import crypto from "crypto";
import { ApiError } from "@/lib/api/api-error";
import { db } from "@/lib/db/prisma";
import { userRepository } from "@/features/users/repositories/user.repository";
import { cartService } from "@/features/cart/services/cart.service";
import { orderService } from "@/features/orders/services/order.service";
import { calculateShippingCharge } from "@/features/shipping/utils/shipping-calculator";
import { calculateShippingChargeAsync } from "@/features/shipping/utils/server-shipping-calculator";
import { getRazorpayClient, getRazorpayPublicKey } from "../config/razorpay.config";
import { paymentRepository } from "../repositories/payment.repository";
import type {
  CreateRazorpayOrderInput,
  VerifyRazorpayPaymentInput,
  ReconcileRazorpayPaymentInput,
  RazorpayOrderResponse,
} from "../validations/payment.schema";

export const razorpayService = {
  /**
   * Create a Razorpay Order based on either active Cart or an existing internal order
   */
  async createRazorpayOrder(
    sessionUserId: string,
    input: CreateRazorpayOrderInput
  ): Promise<RazorpayOrderResponse> {
    const user = await userRepository.findById(sessionUserId);
    if (!user || !user.internalId) {
      throw ApiError.unauthorized("User not found");
    }
    if (!user.isActive || user.is_active === false) {
      throw ApiError.forbidden("Your account is inactive. Please contact support.");
    }

    const userId = user.internalId;
    const isCartCheckout = !input.orderId || input.orderId === "cart";

    // A. Cart-First Flow: Create Razorpay Order directly from active cart (No internal order created yet)
      if (isCartCheckout) {
      const cart = await cartService.getCart(sessionUserId);
      if (!cart || cart.items.length === 0) {
        throw ApiError.badRequest("Your cart is empty. Please add items before checking out.");
      }

      // Check real-time stock before creating Razorpay order
      for (const item of cart.items) {
        if (!item.variantUnitPriceId) continue;
        const vup = await db.variantUnitPrice.findFirst({
          where: {
            OR: [
              { uuid: item.variantUnitPriceId },
              ...(isNaN(Number(item.variantUnitPriceId)) ? [] : [{ id: BigInt(item.variantUnitPriceId) }]),
            ],
            deleted_at: null,
          },
          include: {
            inventories: {
              where: { is_active: true },
              select: { quantity_available: true },
            },
          },
        });
        const available = vup?.inventories ? Number(vup.inventories.quantity_available) : 0;
        if (available <= 0) {
          throw ApiError.badRequest(
            `"${item.productName}" is out of stock. Please remove it from your cart.`
          );
        }
        if (available < item.quantity) {
          throw ApiError.badRequest(
            `Only ${available} unit${available === 1 ? "" : "s"} left for "${item.productName}". Please update your cart.`
          );
        }
      }

      const payableBeforeShipping = cart.total;
      const courierType = input.courierType || "st_courier";
      const totalWeightKg = cart.totalWeightKg ?? 0.5;

      let destinationPincode: string | undefined;
      if (input.shippingAddressId) {
        try {
          const addrIdNum = Number(input.shippingAddressId);
          const addr = await db.customerAddress.findFirst({
            where: {
              userId,
              ...(isNaN(addrIdNum) ? { uuid: input.shippingAddressId } : { id: addrIdNum }),
            },
          });
          if (addr?.pincode) {
            destinationPincode = addr.pincode;
          }
        } catch {
          // ignore error
        }
      }

      const shippingResult = await calculateShippingChargeAsync(courierType, totalWeightKg, destinationPincode);
      const shippingCharge = shippingResult.shippingCharge;
      const payableAmount = payableBeforeShipping + shippingCharge;
      if (payableAmount <= 0) {
        throw ApiError.badRequest("Invalid cart payable amount.");
      }

      const amountInPaise = Math.round(payableAmount * 100);
      const razorpay = getRazorpayClient();
      let rzpOrder: any;
      try {
        rzpOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: `CART_${Date.now().toString().slice(-8)}`,
          notes: {
            userId: String(userId),
            checkoutType: "cart",
            shippingAddressId: input.shippingAddressId || "",
            courierType: courierType || "st_courier",
          },
        });
      } catch (err: any) {
        const description =
          err?.error?.description ||
          err?.message ||
          "Failed to communicate with Razorpay API";
        console.error("[Razorpay] Order creation failed (cart checkout):", err);
        throw ApiError.badRequest(
          `Payment service is temporarily unavailable: ${description}. Please try again.`
        );
      }

      return {
        razorpayOrderId: rzpOrder.id,
        amount: Number(rzpOrder.amount),
        currency: rzpOrder.currency,
        keyId: getRazorpayPublicKey(),
        orderNumber: "New Order",
        internalOrderId: "cart",
      };
    }

    // B. Existing Order Flow: Used when retrying payment for an already created pending order
    const order = await paymentRepository.findCustomerOrder(userId, input.orderId!);
    if (!order) {
      throw ApiError.notFound("Order not found or does not belong to customer");
    }

    if (order.payment_status === "paid") {
      throw ApiError.badRequest("This order has already been paid for.");
    }

    if (order.order_status === "cancelled") {
      throw ApiError.badRequest("Cannot pay for a cancelled order.");
    }

    const payableAmount = Number(order.totalAmount);
    if (isNaN(payableAmount) || payableAmount <= 0) {
      throw ApiError.badRequest("Invalid order payable amount.");
    }

    const amountInPaise = Math.round(payableAmount * 100);

    // Check for an existing pending payment record with a valid Razorpay Order ID
    const existingPendingPayment = await paymentRepository.findPendingPayment(order.id);
    if (
      existingPendingPayment &&
      existingPendingPayment.gateway_order_id &&
      Number(existingPendingPayment.amount) === payableAmount
    ) {
      return {
        razorpayOrderId: existingPendingPayment.gateway_order_id,
        amount: amountInPaise,
        currency: "INR",
        keyId: getRazorpayPublicKey(),
        orderNumber: order.orderNumber,
        internalOrderId: order.uuid || String(order.id),
      };
    }

    const razorpay = getRazorpayClient();
    let rzpOrder: any;
    try {
      rzpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: order.orderNumber,
        notes: {
          orderId: String(order.id),
          orderUuid: order.uuid || "",
          orderNumber: order.orderNumber,
          userId: String(userId),
        },
      });
    } catch (err: any) {
      const description =
        err?.error?.description ||
        err?.message ||
        "Failed to communicate with Razorpay API";
      console.error("[Razorpay] Order creation failed (existing order):", err);
      throw ApiError.badRequest(
        `Payment service is temporarily unavailable: ${description}. Please try again.`
      );
    }

    const paymentMethod = await paymentRepository.getOrCreatePaymentMethod(
      "RAZORPAY",
      "Razorpay Online Payment"
    );

    await paymentRepository.createPaymentRecord({
      orderId: order.id,
      paymentMethodId: paymentMethod.id,
      amount: payableAmount,
      currency: "INR",
      gatewayOrderId: rzpOrder.id,
      createdBy: userId,
    });

    return {
      razorpayOrderId: rzpOrder.id,
      amount: Number(rzpOrder.amount),
      currency: rzpOrder.currency,
      keyId: getRazorpayPublicKey(),
      orderNumber: order.orderNumber,
      internalOrderId: order.uuid || String(order.id),
    };
  },

  /**
   * Cryptographically verify Razorpay signature and confirm order on success
   */
  async verifyPaymentSignature(
    sessionUserId: string,
    input: VerifyRazorpayPaymentInput
  ) {
    const user = await userRepository.findById(sessionUserId);
    if (!user || !user.internalId) {
      throw ApiError.unauthorized("User not found");
    }

    const userId = user.internalId;
    const isCartCheckout = !input.orderId || input.orderId === "cart";

    // 1. Cryptographic Signature Verification
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error("RAZORPAY_KEY_SECRET is not configured");
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${input.razorpay_order_id}|${input.razorpay_payment_id}`)
      .digest("hex");

    const isSignatureValid = expectedSignature === input.razorpay_signature;

    if (!isSignatureValid) {
      throw ApiError.badRequest("Invalid payment signature. Verification rejected.");
    }

    // 2. Handle Cart-First Payment Verification:
    // Create the order in the database ONLY NOW, after signature is cryptographically verified!
    if (isCartCheckout) {
      if (!input.shippingAddressId) {
        throw ApiError.badRequest("Shipping address is required to complete the order.");
      }

      // Recover courierType from Razorpay order notes if omitted in verify request payload
      let resolvedCourierType = input.courierType;
      if (!resolvedCourierType && input.razorpay_order_id) {
        try {
          const razorpay = getRazorpayClient();
          const rzpOrder = await razorpay.orders.fetch(input.razorpay_order_id);
          const noteCourier = rzpOrder?.notes?.courierType;
          if (
            noteCourier === "st_courier" ||
            noteCourier === "mss" ||
            noteCourier === "shiprocket"
          ) {
            resolvedCourierType = noteCourier;
          }
        } catch (fetchErr) {
          console.warn("[Razorpay] Could not fetch order notes for courierType recovery:", fetchErr);
        }
      }

      let createdOrder;
      try {
        createdOrder = await orderService.createCustomerOrder(sessionUserId, {
          shippingAddressId: input.shippingAddressId,
          billingAddressId: input.billingAddressId || input.shippingAddressId,
          notes: input.notes,
          paymentMethod: "CARD",
          courierType: resolvedCourierType,
          paymentDetails: {
            gateway: "RAZORPAY",
            isPaid: true,
            razorpay_order_id: input.razorpay_order_id,
            razorpay_payment_id: input.razorpay_payment_id,
            razorpay_signature: input.razorpay_signature,
          },
        });
      } catch (orderErr: any) {
        // Stock reservation or order creation failed after payment capture.
        // Automatically refund captured payment immediately so customer is protected.
        try {
          const razorpay = getRazorpayClient();
          await razorpay.payments.refund(input.razorpay_payment_id, {
            notes: {
              reason: "Stock unavailable during checkout; automatic full refund initiated",
              razorpay_order_id: input.razorpay_order_id,
            },
          });
          console.warn(
            `[Razorpay] Auto-refunded payment ${input.razorpay_payment_id} due to order placement failure: ${orderErr?.message}`
          );
        } catch (refundErr: any) {
          console.error(
            `[Razorpay] CRITICAL: Auto-refund failed for payment ${input.razorpay_payment_id}:`,
            refundErr
          );
        }

        const baseMsg = orderErr?.message || "Could not complete order due to stock unavailability.";
        throw ApiError.badRequest(
          `${baseMsg} A full refund has been automatically initiated to your payment method.`
        );
      }

      // Find the created order to retrieve internal BigInt ID
      const dbOrder = await db.order.findFirst({
        where: {
          OR: [
            { uuid: createdOrder.id },
            { orderNumber: createdOrder.orderNumber },
          ],
        },
        select: { id: true, uuid: true, orderNumber: true, totalAmount: true },
      });

      if (dbOrder) {
        const paymentMethod = await paymentRepository.getOrCreatePaymentMethod(
          "RAZORPAY",
          "Razorpay Online Payment"
        );

        const paymentRecord = await paymentRepository.createPaymentRecord({
          orderId: dbOrder.id,
          paymentMethodId: paymentMethod.id,
          amount: Number(dbOrder.totalAmount),
          currency: "INR",
          gatewayOrderId: input.razorpay_order_id,
          createdBy: userId,
        });

        await paymentRepository.recordPaymentSuccess({
          paymentId: paymentRecord.id,
          orderId: dbOrder.id,
          userId,
          razorpayPaymentId: input.razorpay_payment_id,
          gatewayResponse: {
            razorpay_order_id: input.razorpay_order_id,
            razorpay_payment_id: input.razorpay_payment_id,
            razorpay_signature: input.razorpay_signature,
          },
          amount: Number(dbOrder.totalAmount),
        });
      }

      return {
        success: true,
        message: "Payment verified and order placed successfully",
        orderNumber: createdOrder.orderNumber,
        orderId: createdOrder.id,
      };
    }

    // 3. Handle Existing Order Verification
    const order = await paymentRepository.findCustomerOrder(userId, input.orderId!);
    if (!order) {
      throw ApiError.notFound("Order not found or does not belong to customer");
    }

    const payment = await paymentRepository.findPendingPayment(
      order.id,
      input.razorpay_order_id
    );

    if (!payment) {
      throw ApiError.notFound("Matching payment record not found for this order");
    }

    if (payment.status === "success" && order.payment_status === "paid") {
      return {
        success: true,
        message: "Payment already verified",
        orderNumber: order.orderNumber,
        orderId: order.uuid || String(order.id),
      };
    }

    const result = await paymentRepository.recordPaymentSuccess({
      paymentId: payment.id,
      orderId: order.id,
      userId,
      razorpayPaymentId: input.razorpay_payment_id,
      gatewayResponse: {
        razorpay_order_id: input.razorpay_order_id,
        razorpay_payment_id: input.razorpay_payment_id,
        razorpay_signature: input.razorpay_signature,
      },
      amount: Number(order.totalAmount),
    });

    return {
      success: true,
      message: "Payment verified successfully",
      orderNumber: result.order.orderNumber,
      orderId: result.order.uuid || String(result.order.id),
    };
  },

  /**
   * Reconcile an interrupted or unfinalized Razorpay payment.
   * If a customer refreshed the page or lost connection after payment capture,
   * this verifies payment directly with Razorpay API and creates/finalizes the order.
   */
  async reconcileOrder(
    sessionUserId: string,
    input: ReconcileRazorpayPaymentInput
  ) {
    const user = await userRepository.findById(sessionUserId);
    if (!user || !user.internalId) {
      throw ApiError.unauthorized("User not found");
    }
    const userId = user.internalId;
    const razorpay = getRazorpayClient();

    let orderIdToInspect = input.razorpayOrderId?.trim();

    // If orderId is not provided, look up the user's latest orders directly from Razorpay
    if (!orderIdToInspect) {
      try {
        const recentOrders = await razorpay.orders.all({ count: 15 });
        const userPaidOrder = recentOrders.items.find(
          (o: any) =>
            (o.status === "paid" || Number(o.amount_paid) > 0) &&
            String(o.notes?.userId) === String(userId) &&
            o.notes?.checkoutType === "cart"
        );
        if (userPaidOrder) {
          orderIdToInspect = userPaidOrder.id;
        }
      } catch (fetchErr) {
        console.warn("[Razorpay Reconcile] Error fetching recent orders:", fetchErr);
      }
    }

    if (!orderIdToInspect) {
      return { found: false, message: "No unfulfilled paid payment found" };
    }

    // 1. Check if an order already exists for this gateway_order_id in our database
    const existingPayment = await paymentRepository.findPaymentByGatewayOrderId(orderIdToInspect);
    if (existingPayment && existingPayment.order) {
      return {
        found: true,
        alreadyProcessed: true,
        orderId: existingPayment.order.uuid || String(existingPayment.order.id),
        orderNumber: existingPayment.order.orderNumber,
        paymentStatus: existingPayment.order.payment_status,
      };
    }

    // 2. Query Razorpay API for the real state of this order
    const rzpOrder = await razorpay.orders.fetch(orderIdToInspect);
    if (!rzpOrder) {
      return { found: false, message: "Order not found on payment gateway" };
    }

    // Security check: verify this order belongs to this customer
    if (rzpOrder.notes?.userId && String(rzpOrder.notes.userId) !== String(userId)) {
      throw ApiError.forbidden("Razorpay order does not belong to your account");
    }

    // If Razorpay order is not paid, nothing to reconcile
    if (rzpOrder.status !== "paid" && Number(rzpOrder.amount_paid) <= 0) {
      return {
        found: true,
        status: rzpOrder.status,
        isPaid: false,
        message: "Payment is not marked as paid on Razorpay",
      };
    }

    // 3. Fetch captured payment details from Razorpay
    const payments = await razorpay.orders.fetchPayments(orderIdToInspect);
    const capturedPayment =
      payments.items?.find((p: any) => p.status === "captured") ||
      payments.items?.[0];

    if (!capturedPayment || capturedPayment.status !== "captured") {
      return {
        found: true,
        status: capturedPayment?.status || rzpOrder.status,
        isPaid: false,
        message: "Payment was not captured",
      };
    }

    // 4. Identify shipping details from order notes or fallback to user's active address
    const rawAddressId = rzpOrder.notes?.shippingAddressId;
    const requestedAddressId = rawAddressId != null ? String(rawAddressId).trim() : undefined;
    let shippingAddress: any = null;

    if (requestedAddressId) {
      const isNum = /^\d+$/.test(requestedAddressId);
      shippingAddress = await db.customerAddress.findFirst({
        where: {
          userId,
          is_active: true,
          deleted_at: null,
          OR: [
            { uuid: requestedAddressId },
            ...(isNum ? [{ id: BigInt(requestedAddressId) }] : []),
          ],
        },
      });
    }

    // If requested address not found or inactive, fallback to customer's default or latest active address
    if (!shippingAddress) {
      shippingAddress = await db.customerAddress.findFirst({
        where: { userId, is_active: true, deleted_at: null },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      });
    }

    if (!shippingAddress) {
      return {
        found: true,
        success: false,
        message: "No delivery address found for your account. Please add an address to complete this order.",
      };
    }

    const resolvedAddressId = shippingAddress.uuid || String(shippingAddress.id);
    const rawCourier = rzpOrder.notes?.courierType;
    const courierType = (rawCourier ? String(rawCourier) : "st_courier") as "st_courier" | "mss" | "shiprocket";

    // 5. Create customer order from cart
    let createdOrder: any;
    try {
      createdOrder = await orderService.createCustomerOrder(sessionUserId, {
        shippingAddressId: resolvedAddressId,
        billingAddressId: resolvedAddressId,
        paymentMethod: "CARD",
        courierType,
        paymentDetails: {
          gateway: "RAZORPAY",
          isPaid: true,
          razorpay_order_id: orderIdToInspect,
          razorpay_payment_id: capturedPayment.id,
          razorpay_signature: "reconciled_via_gateway_verification",
        },
      });
    } catch (orderErr: any) {
      console.warn("[Razorpay Reconcile] createCustomerOrder result/error:", orderErr?.message);
      // If order was already created in parallel, check again
      const parallelPayment = await paymentRepository.findPaymentByGatewayOrderId(orderIdToInspect);
      if (parallelPayment && parallelPayment.order) {
        return {
          found: true,
          alreadyProcessed: true,
          orderId: parallelPayment.order.uuid || String(parallelPayment.order.id),
          orderNumber: parallelPayment.order.orderNumber,
        };
      }
      return {
        found: true,
        success: false,
        message: orderErr?.message || "Failed to finalize order from cart.",
      };
    }

    // 6. Record payment record and mark success
    const dbOrder = await db.order.findFirst({
      where: {
        OR: [
          { uuid: createdOrder.id },
          { orderNumber: createdOrder.orderNumber },
        ],
      },
      select: { id: true, uuid: true, orderNumber: true, totalAmount: true },
    });

    if (dbOrder) {
      const paymentMethod = await paymentRepository.getOrCreatePaymentMethod(
        "RAZORPAY",
        "Razorpay Online Payment"
      );

      const paymentRecord = await paymentRepository.createPaymentRecord({
        orderId: dbOrder.id,
        paymentMethodId: paymentMethod.id,
        amount: Number(dbOrder.totalAmount),
        currency: "INR",
        gatewayOrderId: orderIdToInspect,
        createdBy: userId,
      });

      await paymentRepository.recordPaymentSuccess({
        paymentId: paymentRecord.id,
        orderId: dbOrder.id,
        userId,
        razorpayPaymentId: capturedPayment.id,
        gatewayResponse: {
          reconciled: true,
          razorpay_order_id: orderIdToInspect,
          razorpay_payment_id: capturedPayment.id,
        },
        amount: Number(dbOrder.totalAmount),
      });
    }

    return {
      found: true,
      success: true,
      reconciled: true,
      orderNumber: createdOrder.orderNumber,
      orderId: createdOrder.id,
      message: "Payment successfully verified and order confirmed!",
    };
  },

  /**
   * Handle server-to-server Razorpay webhooks idempotently
   */
  async handleWebhook(rawBody: string, signatureHeader: string | null) {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured");
    }

    if (!signatureHeader) {
      throw ApiError.badRequest("Missing Razorpay webhook signature header");
    }

    // 1. Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signatureHeader) {
      throw ApiError.badRequest("Invalid webhook signature");
    }

    // 2. Parse event payload
    const event = JSON.parse(rawBody);
    const eventType = event.event as string;

    // We specifically handle payment captured or order paid events
    if (eventType === "order.paid" || eventType === "payment.captured") {
      const paymentEntity = event.payload?.payment?.entity;
      const gatewayOrderId = paymentEntity?.order_id || event.payload?.order?.entity?.id;
      const gatewayPaymentId = paymentEntity?.id;

      if (!gatewayOrderId) {
        return { received: true, ignored: "No gateway order id found in event" };
      }

      // Find local payment record
      let paymentRecord = await paymentRepository.findPaymentByGatewayOrderId(gatewayOrderId);
      if (!paymentRecord) {
        // Auto-reconcile cart checkout if payment was captured
        const notes = paymentEntity?.notes || event.payload?.order?.entity?.notes;
        if (notes?.checkoutType === "cart" && notes?.userId) {
          try {
            console.log(
              `[Razorpay Webhook] Auto-reconciling unfinalized cart order ${gatewayOrderId}`
            );
            const reconcileResult = await razorpayService.reconcileOrder(String(notes.userId), {
              razorpayOrderId: gatewayOrderId,
            });
            return { received: true, reconciled: true, result: reconcileResult };
          } catch (recErr: any) {
            console.error("[Razorpay Webhook] Cart reconciliation error:", recErr);
          }
        }
        return { received: true, ignored: "Payment record not found locally" };
      }

      // Idempotency: if already success, do not double-process
      if (paymentRecord.status === "success" && paymentRecord.order.payment_status === "paid") {
        return { received: true, duplicate: true };
      }

      const order = paymentRecord.order;
      await paymentRepository.recordPaymentSuccess({
        paymentId: paymentRecord.id,
        orderId: order.id,
        userId: order.userId,
        razorpayPaymentId: gatewayPaymentId || "webhook_captured",
        gatewayResponse: event,
        amount: Number(order.totalAmount),
      });

      return { received: true, processed: true };
    }

    if (eventType === "payment.failed") {
      const paymentEntity = event.payload?.payment?.entity;
      const gatewayOrderId = paymentEntity?.order_id;
      const errorDescription =
        paymentEntity?.error_description || "Payment failed via webhook notification";

      if (gatewayOrderId) {
        const paymentRecord = await paymentRepository.findPaymentByGatewayOrderId(gatewayOrderId);
        if (paymentRecord && paymentRecord.status !== "success") {
          await paymentRepository.recordPaymentFailure({
            paymentId: paymentRecord.id,
            orderId: paymentRecord.order.id,
            userId: paymentRecord.order.userId,
            errorReason: errorDescription,
            gatewayResponse: event,
            amount: Number(paymentRecord.order.totalAmount),
          });
        }
      }

      return { received: true, processed: true };
    }

    return { received: true, unhandledEvent: eventType };
  },
};


