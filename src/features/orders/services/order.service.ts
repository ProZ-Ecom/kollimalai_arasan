import crypto from "crypto";
import { db } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/api-error";
import { userRepository } from "@/features/users/repositories/user.repository";
import { offerService } from "@/features/offers/services/offer.service";
import {
  calculateShippingCharge,
  calculateVariantWeightKg,
} from "@/features/shipping/utils/shipping-calculator";
import {
  orderRepository,
  orderDetailInclude,
  formatOrderDetail,
} from "../repositories/order.repository";
import type {
  OrderDetailResponse,
  OrderListItemResponse,
  OrderListResponse,
  OrderStatusTransitionResponse,
  AdminOrdersCountResponse,
} from "../types";
import type {
  CustomerCreateOrderInput,
  CustomerOrdersQueryInput,
  CustomerOrdersListInput,
  AdminOrdersListInput,
  CancelOrderInput,
  ReturnOrderInput,
  OrderStatusTransitionInput,
  ShipOrderCourierInput,
} from "../validations/order.schema";
import type { orders_order_status } from "@/generated/prisma";

export const orderService = {
  async createCustomerOrder(
    sessionUserId: string,
    input: CustomerCreateOrderInput
  ): Promise<OrderDetailResponse> {
    const user = await userRepository.findById(sessionUserId);
    if (!user || !user.internalId) {
      throw ApiError.unauthorized("User not found");
    }
    if (!user.isActive || user.is_active === false) {
      throw ApiError.forbidden("Your account is inactive or blocked. Please contact support.");
    }

    const userId = user.internalId;

    // 1. Find active cart with active cart items
    const cart = await db.cart.findFirst({
      where: {
        userId,
        status: "active",
        is_active: true,
      },
      include: {
        items: {
          where: {
            is_active: true,
          },
          include: {
            product: true,
            variant_unit_price: {
              include: {
                variant: true,
                product_units: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw ApiError.badRequest("Cart is empty or no active cart found");
    }

    // 2. Validate every cart item's product and variant unit price
    const orderItemsData: Array<{
      productId: bigint;
      variantId: bigint;
      variantUnitPriceId: bigint;
      productName: string;
      variantName: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      discountAmount: number;
      taxAmount: number;
      totalPrice: number;
      itemUuid: string;
    }> = [];

    let subtotal = 0;

    for (const item of cart.items) {
      const unitPriceRow = item.variant_unit_price;
      const variant = unitPriceRow?.variant;

      if (
        !item.product ||
        !item.product.isActive ||
        item.product.deleted_at !== null ||
        !unitPriceRow ||
        !unitPriceRow.isActive ||
        unitPriceRow.deleted_at !== null ||
        !variant ||
        !variant.isActive ||
        variant.deleted_at !== null
      ) {
        throw ApiError.badRequest(
          `Product variant "${variant?.variant_name || item.product?.name || "item"}" is no longer available`
        );
      }

      // The stored base price is the only price trusted here - never a value
      // that came in with the request. Offers are applied below, once every
      // line is known, because a minimum-cart-value offer depends on the
      // subtotal of the whole cart.
      const unitPrice = Number(unitPriceRow.base_price);

      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      orderItemsData.push({
        productId: item.productId,
        variantId: variant.id,
        variantUnitPriceId: item.variantUnitPriceId!,
        productName: item.product.name,
        variantName: variant.variant_name,
        sku: unitPriceRow.sku,
        quantity: item.quantity,
        unitPrice,
        discountAmount: 0,
        taxAmount: 0,
        totalPrice,
        itemUuid: unitPriceRow.uuid,
      });
    }

    // 2b. Apply offers. This is the same engine the storefront, cart and
    // checkout quote from, so the price the customer was shown is the price
    // the order is written at.
    const pricing = await offerService.priceCartItems(
      orderItemsData.map((item) => ({
        itemId: item.itemUuid,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }))
    );

    for (const [index, line] of pricing.lines.entries()) {
      const orderItem = orderItemsData[index];
      orderItem.discountAmount = line.discountAmount;
      orderItem.totalPrice = line.finalLineTotal;
    }

    const offerDiscount = pricing.totalDiscount;
    subtotal = pricing.subtotal;

    // 3. Validate shipping address
    const isShippingNumeric = /^\d+$/.test(input.shippingAddressId);
    const shippingAddress = await db.customerAddress.findFirst({
      where: {
        userId,
        is_active: true,
        deleted_at: null,
        OR: [
          { uuid: input.shippingAddressId },
          ...(isShippingNumeric ? [{ id: BigInt(input.shippingAddressId) }] : []),
        ],
      },
    });

    if (!shippingAddress) {
      throw ApiError.badRequest(
        "Shipping address not found or does not belong to customer"
      );
    }

    // 4. Validate billing address if provided
    let billingAddress = shippingAddress;
    if (input.billingAddressId) {
      const isBillingNumeric = /^\d+$/.test(input.billingAddressId);
      const foundBilling = await db.customerAddress.findFirst({
        where: {
          userId,
          is_active: true,
          deleted_at: null,
          OR: [
            { uuid: input.billingAddressId },
            ...(isBillingNumeric ? [{ id: BigInt(input.billingAddressId) }] : []),
          ],
        },
      });

      if (!foundBilling) {
        throw ApiError.badRequest(
          "Billing address not found or does not belong to customer"
        );
      }

      billingAddress = foundBilling;
    }

    const paymentMethod = input.paymentMethod || "CARD";
    const isPaid = paymentMethod === "CARD" || paymentMethod === "UPI";
    const paymentStatus: "paid" | "pending" = isPaid ? "paid" : "pending";
    const orderStatus: "confirmed" | "pending" = isPaid ? "confirmed" : "pending";

    // Weight-based shipping charge calculation (no free delivery)
    const courierType = input.courierType || "st_courier";
    let totalWeightKg = 0;
    for (const item of cart.items) {
      const w = calculateVariantWeightKg(item.variant_unit_price);
      totalWeightKg += w * item.quantity;
    }

    const shippingResult = calculateShippingCharge(courierType, totalWeightKg);
    const shippingCharge = shippingResult.shippingCharge;
    const payableBeforeShipping = Math.max(0, subtotal - offerDiscount);
    const totalAmount = payableBeforeShipping + shippingCharge;

    // 5. Execute creation transaction
    return orderRepository.createCustomerOrderTransaction({
      userId,
      cartId: cart.id,
      subtotal,
      discountAmount: offerDiscount,
      shippingCharge,
      totalAmount,
      orderStatus,
      paymentStatus,
      paymentMethod,
      notes: input.notes,
      shippingAddress: {
        fullName: shippingAddress.full_name,
        phone: shippingAddress.phone,
        addressLine1: shippingAddress.address_line1,
        addressLine2: shippingAddress.address_line2,
        landmark: shippingAddress.landmark,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode ?? "",
        country: shippingAddress.country ?? "India",
        latitude: shippingAddress.latitude ? Number(shippingAddress.latitude) : null,
        longitude: shippingAddress.longitude ? Number(shippingAddress.longitude) : null,
      },
      billingAddress: {
        fullName: billingAddress.full_name,
        phone: billingAddress.phone,
        addressLine1: billingAddress.address_line1,
        addressLine2: billingAddress.address_line2,
        landmark: billingAddress.landmark,
        city: billingAddress.city,
        state: billingAddress.state,
        pincode: billingAddress.pincode ?? "",
        country: billingAddress.country ?? "India",
        latitude: billingAddress.latitude ? Number(billingAddress.latitude) : null,
        longitude: billingAddress.longitude ? Number(billingAddress.longitude) : null,
      },
      items: orderItemsData,
    });
  },

  async getCustomerOrders(
    sessionUserId: string,
    query: CustomerOrdersListInput | CustomerOrdersQueryInput = {}
  ): Promise<OrderListResponse<OrderDetailResponse>> {
    const user = await userRepository.findById(sessionUserId);
    if (!user || !user.internalId) {
      throw ApiError.unauthorized("User not found");
    }
    if (!user.isActive || user.is_active === false) {
      throw ApiError.forbidden("Your account is inactive or blocked. Please contact support.");
    }

    return orderRepository.findCustomerOrders(user.internalId, query);
  },

  async getCustomerOrderByUuid(
    sessionUserId: string,
    uuid: string
  ): Promise<OrderDetailResponse> {
    const user = await userRepository.findById(sessionUserId);
    if (!user || !user.internalId) {
      throw ApiError.unauthorized("User not found");
    }
    if (!user.isActive || user.is_active === false) {
      throw ApiError.forbidden("Your account is inactive or blocked. Please contact support.");
    }

    const order = await orderRepository.findCustomerOrderByUuid(
      user.internalId,
      uuid
    );

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    return order;
  },

  async getAdminOrders(
    query: AdminOrdersListInput
  ): Promise<OrderListResponse<OrderListItemResponse>> {
    return orderRepository.findAdminOrders(query);
  },

  async countAdminOrders(
    query: AdminOrdersListInput
  ): Promise<AdminOrdersCountResponse> {
    return orderRepository.countAdminOrders(query);
  },

  async getAdminOrderByUuid(uuid: string): Promise<OrderDetailResponse> {
    const order = await orderRepository.findAdminOrderByUuid(uuid);
    if (!order) {
      throw ApiError.notFound("Order not found");
    }
    return order;
  },

  async cancelCustomerOrder(
    sessionUserId: string,
    uuid: string,
    input?: CancelOrderInput
  ): Promise<OrderDetailResponse> {
    const user = await userRepository.findById(sessionUserId);
    if (!user || !user.internalId) {
      throw ApiError.unauthorized("User not found");
    }

    const order = await db.order.findFirst({
      where: {
        uuid,
        userId: user.internalId,
        is_active: true,
      },
    });

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    // Cancellation window: pending, confirmed, processing
    const cancellableStatuses = ["pending", "confirmed", "processing"];
    if (!cancellableStatuses.includes(order.order_status)) {
      throw ApiError.badRequest(
        `Order cannot be cancelled in '${order.order_status}' status`
      );
    }

    const cancelledOrder = await orderRepository.cancelOrderTransaction({
      orderId: order.id,
      note: input?.note || "Cancelled by customer",
      changedBy: user.internalId,
    });

    // Note: Automatic gateway refund on customer cancellation is disabled.
    // The refund will be reviewed and approved by the admin.
    return cancelledOrder;
  },

  async cancelAdminOrder(
    adminSessionUserId: string,
    uuid: string,
    input?: CancelOrderInput
  ): Promise<OrderDetailResponse> {
    const adminUser = await userRepository.findById(adminSessionUserId);
    if (!adminUser || !adminUser.internalId) {
      throw ApiError.unauthorized("Session expired. Please log in again.");
    }

    const order = await db.order.findFirst({
      where: {
        uuid,
        is_active: true,
      },
    });

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (
      order.order_status === "delivered" ||
      order.order_status === "returned" ||
      order.order_status === "cancelled"
    ) {
      throw ApiError.badRequest(
        `Cannot cancel an order that is already '${order.order_status}'`
      );
    }

    const cancelledOrder = await orderRepository.cancelOrderTransaction({
      orderId: order.id,
      note: input?.note || "Cancelled by admin",
      changedBy: adminUser.internalId,
    });

    // Note: Automatic gateway refund on admin cancellation is disabled.
    // Refund must be explicitly processed via Admin Refund Action.
    return cancelledOrder;
  },

  async returnCustomerOrder(
    sessionUserId: string,
    uuid: string,
    input?: ReturnOrderInput
  ): Promise<OrderDetailResponse> {
    const user = await userRepository.findById(sessionUserId);
    if (!user || !user.internalId) {
      throw ApiError.unauthorized("User not found");
    }

    const order = await db.order.findFirst({
      where: {
        uuid,
        userId: user.internalId,
        is_active: true,
      },
    });

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (order.order_status !== "delivered") {
      throw ApiError.badRequest("Only delivered orders can be returned");
    }

    return orderRepository.returnOrderTransaction({
      orderId: order.id,
      note: input?.note || "Return requested by customer",
      changedBy: user.internalId,
    });
  },

  async recordPersonalAdminRefund(params: {
    orderId: bigint;
    adminInternalId: bigint;
    amount?: number;
    paymentMode?: string;
    referenceId?: string;
    reason?: string;
    note?: string;
  }) {
    const { orderId, adminInternalId, amount, paymentMode, referenceId, reason, note } = params;

    const order = await db.order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        payments: {
          where: { is_active: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const successPayment = order.payments[0];
    const totalOrderAmount = Number(order.totalAmount);
    const refundAmount = amount ? Math.min(amount, totalOrderAmount) : totalOrderAmount;
    const isPartial = refundAmount < totalOrderAmount;

    const modeText = paymentMode || "Personal / Manual Transfer";
    const refText = referenceId?.trim() ? ` (Ref: ${referenceId.trim()})` : "";
    const fullReason = `${reason || "Admin recorded personal refund"} [${modeText}${refText}]`;

    await db.$transaction(async (tx) => {
      // 1. Resolve or create payment record to satisfy schema foreign key
      let paymentId = successPayment?.id;
      if (!paymentId) {
        let manualMethod = await tx.payment_methods.findFirst({
          where: { code: "MANUAL" },
        });
        if (!manualMethod) {
          manualMethod = await tx.payment_methods.create({
            data: {
              code: "MANUAL",
              name: "Personal / Manual Payment",
              is_active: true,
              created_by: adminInternalId,
              updated_by: adminInternalId,
            },
          });
        }
        const newPay = await tx.payment.create({
          data: {
            orderId,
            payment_method_id: manualMethod.id,
            amount: totalOrderAmount,
            currency: "INR",
            status: "success",
            gateway: "MANUAL",
            created_by: adminInternalId,
            updated_by: adminInternalId,
          },
        });
        paymentId = newPay.id;
      }

      // 2. Insert into refunds table
      await tx.refunds.create({
        data: {
          order_id: orderId,
          payment_id: paymentId,
          amount: refundAmount,
          reason: fullReason.slice(0, 255),
          status: "completed",
          processed_at: new Date(),
          created_by: adminInternalId,
          updated_by: adminInternalId,
        },
      });

      // 3. Create payment transaction audit
      await tx.paymentTransaction.create({
        data: {
          paymentId,
          transaction_type: "refund",
          amount: refundAmount,
          status: "refunded",
          gatewayResponse: {
            manual: true,
            method: modeText,
            referenceId: referenceId?.trim() || null,
            note: note?.trim() || null,
            processedAt: new Date().toISOString(),
          },
          created_by: adminInternalId,
          updated_by: adminInternalId,
        },
      });

      // 4. Update payment status
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: isPartial ? "success" : "refunded",
          updated_by: adminInternalId,
        },
      });

      // 5. Update order payment status
      await tx.order.update({
        where: { id: orderId },
        data: {
          payment_status: isPartial ? "partial_refund" : "refunded",
          updated_by: adminInternalId,
        },
      });

      // 6. Record in order status history
      await tx.order_status_history.create({
        data: {
          order_id: orderId,
          status: order.order_status,
          note: `Admin recorded personal refund of ₹${refundAmount.toFixed(2)} via ${modeText}${refText}${note ? `: ${note}` : ""}`,
          created_by: adminInternalId,
        },
      });
    });
  },

  async returnAdminOrder(
    adminSessionUserId: string,
    uuid: string,
    input?: ReturnOrderInput
  ): Promise<OrderDetailResponse> {
    const adminUser = await userRepository.findById(adminSessionUserId);
    if (!adminUser || !adminUser.internalId) {
      throw ApiError.unauthorized("Session expired. Please log in again.");
    }

    const order = await db.order.findFirst({
      where: {
        uuid,
        is_active: true,
      },
    });

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    // If order was cancelled and paid, process admin personal refund directly
    if (order.order_status === "cancelled") {
      if (order.payment_status !== "paid" && order.payment_status !== "partial_refund") {
        throw ApiError.badRequest("This cancelled order has no paid balance to refund.");
      }

      await this.recordPersonalAdminRefund({
        orderId: order.id,
        adminInternalId: adminUser.internalId,
        amount: input?.amount,
        paymentMode: input?.paymentMode,
        referenceId: input?.referenceId,
        reason: input?.reason || "Admin approved personal refund for cancelled order",
        note: input?.note,
      });

      const updated = await db.order.findUniqueOrThrow({
        where: { id: order.id },
        include: orderDetailInclude,
      });
      return formatOrderDetail(updated);
    }

    if (!["delivered", "shipped", "out_for_delivery"].includes(order.order_status)) {
      throw ApiError.badRequest(
        `Cannot process return for order with status '${order.order_status}'. Only delivered, shipped, or out for delivery orders can be returned.`
      );
    }

    const returnedOrder = await orderRepository.returnOrderTransaction({
      orderId: order.id,
      note: input?.note || "Return processed by admin",
      changedBy: adminUser.internalId,
    });

    // In case of refund: if order was paid, record personal refund by admin
    if (order.payment_status === "paid" || order.payment_status === "partial_refund") {
      try {
        await this.recordPersonalAdminRefund({
          orderId: order.id,
          adminInternalId: adminUser.internalId,
          amount: input?.amount,
          paymentMode: input?.paymentMode,
          referenceId: input?.referenceId,
          reason: input?.reason || "Admin return and personal refund",
          note: input?.note,
        });
      } catch (refundError: any) {
        console.error(
          `[Refund Error] Recording personal refund failed for admin-returned order ${order.orderNumber}:`,
          refundError?.message || refundError
        );
      }
    }

    return returnedOrder;
  },

  async deliverAdminOrder(
    adminSessionUserId: string,
    uuid: string,
    input?: { note?: string }
  ): Promise<OrderDetailResponse> {
    const adminUser = await userRepository.findById(adminSessionUserId);
    if (!adminUser || !adminUser.internalId) {
      throw ApiError.unauthorized("Session expired. Please log in again.");
    }

    const order = await db.order.findFirst({
      where: {
        uuid,
        is_active: true,
      },
    });

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (["delivered", "cancelled", "returned"].includes(order.order_status)) {
      throw ApiError.badRequest(
        `Cannot deliver order that is already '${order.order_status}'`
      );
    }

    return orderRepository.updateOrderStatusWithHistory({
      orderId: order.id,
      status: "delivered",
      note: input?.note || "Order marked as delivered by admin",
      changedBy: adminUser.internalId,
    });
  },

  async transitionOrderStatus(
    adminSessionUserId: string,
    uuid: string,
    expectedCurrentStatus: orders_order_status,
    newStatus: orders_order_status,
    input?: OrderStatusTransitionInput
  ): Promise<OrderStatusTransitionResponse> {
    const adminUser = await userRepository.findById(adminSessionUserId);
    if (!adminUser || !adminUser.internalId) {
      throw ApiError.unauthorized("Session expired. Please log in again.");
    }

    const order = await db.order.findFirst({
      where: {
        uuid,
        is_active: true,
      },
    });

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (order.order_status !== expectedCurrentStatus) {
      throw ApiError.badRequest(
        `Order status is '${order.order_status}'. Only '${expectedCurrentStatus}' orders can be transitioned to '${newStatus}'.`
      );
    }

    const updated = await orderRepository.updateOrderStatusWithHistory({
      orderId: order.id,
      status: newStatus,
      note: input?.note,
      changedBy: adminUser.internalId,
    });

    return {
      id: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
    };
  },

  async confirmOrder(
    adminSessionUserId: string,
    uuid: string,
    input?: OrderStatusTransitionInput
  ): Promise<OrderStatusTransitionResponse> {
    return this.transitionOrderStatus(
      adminSessionUserId,
      uuid,
      "pending",
      "confirmed",
      input
    );
  },

  async startProcessingOrder(
    adminSessionUserId: string,
    uuid: string,
    input?: OrderStatusTransitionInput
  ): Promise<OrderStatusTransitionResponse> {
    return this.transitionOrderStatus(
      adminSessionUserId,
      uuid,
      "confirmed",
      "processing",
      input
    );
  },

  async markOrderAsPacked(
    adminSessionUserId: string,
    uuid: string,
    input?: OrderStatusTransitionInput
  ): Promise<OrderStatusTransitionResponse> {
    return this.transitionOrderStatus(
      adminSessionUserId,
      uuid,
      "processing",
      "packed",
      input
    );
  },

  async shipOrderWithCourier(
    adminSessionUserId: string,
    uuid: string,
    input: ShipOrderCourierInput
  ): Promise<OrderDetailResponse> {
    const adminUser = await userRepository.findById(adminSessionUserId);
    const adminId = adminUser?.internalId ?? null;

    const isNumeric = /^\d+$/.test(uuid);
    const order = await db.order.findFirst({
      where: {
        is_active: true,
        OR: [
          { uuid },
          { orderNumber: uuid },
          ...(isNumeric ? [{ id: BigInt(uuid) }] : []),
        ],
      },
    });

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (["cancelled", "delivered", "returned"].includes(order.order_status)) {
      throw ApiError.badRequest(
        `Cannot ship order with status '${order.order_status}'`
      );
    }

    // Resolve delivery partner
    const isPartnerNumeric =
      typeof input.deliveryPartnerId === "number" ||
      /^\d+$/.test(String(input.deliveryPartnerId));

    const partner = await db.delivery_partners.findFirst({
      where: {
        is_active: true,
        OR: [
          ...(isPartnerNumeric
            ? [{ id: BigInt(input.deliveryPartnerId) }]
            : []),
          { code: String(input.deliveryPartnerId) },
        ],
      },
    });

    if (!partner) {
      throw ApiError.notFound("Delivery partner not found or is inactive");
    }

    const trackingNum = input.trackingNumber.trim();
    const cleanNotes = input.notes?.trim() || null;

    await db.$transaction(async (tx) => {
      // Find active shipment for this order
      const existingShipment = await tx.shipments.findFirst({
        where: {
          order_id: order.id,
          is_active: true,
        },
        orderBy: { id: "desc" },
      });

      if (existingShipment) {
        await tx.shipments.update({
          where: { id: existingShipment.id },
          data: {
            delivery_partner_id: partner.id,
            tracking_number: trackingNum,
            status: "in_transit",
            assignment_status: "assigned",
            shipped_at: new Date(),
            delivery_notes: cleanNotes || existingShipment.delivery_notes,
            updated_by: adminId,
            updated_at: new Date(),
          },
        });
      } else {
        await tx.shipments.create({
          data: {
            uuid: crypto.randomUUID(),
            order_id: order.id,
            delivery_partner_id: partner.id,
            tracking_number: trackingNum,
            status: "in_transit",
            assignment_status: "assigned",
            shipped_at: new Date(),
            delivery_notes: cleanNotes,
            created_by: adminId,
            updated_by: adminId,
          },
        });
      }

      // Update order status to 'shipped'
      await tx.order.update({
        where: { id: order.id },
        data: {
          order_status: "shipped",
          updated_by: adminId,
          updatedAt: new Date(),
        },
      });

      // Add status history
      const historyNote = cleanNotes
        ? `Shipped via ${partner.name} (AWB: ${trackingNum}) - ${cleanNotes}`
        : `Shipped via ${partner.name} (AWB: ${trackingNum})`;

      await tx.order_status_history.create({
        data: {
          order_id: order.id,
          status: "shipped",
          note: historyNote,
          created_by: adminId,
        },
      });
    });

    const updated = await orderRepository.findCustomerOrderByUuid(
      order.userId,
      order.uuid || String(order.id)
    );
    if (!updated) {
      throw ApiError.internal("Failed to retrieve updated order");
    }
    return updated;
  },

  async getOrders(userId: number | string | bigint, params: any = {}) {
    return this.getCustomerOrders(String(userId), params);
  },

  async placeOrder(userId: number | string | bigint, input: any) {
    return this.createCustomerOrder(String(userId), {
      shippingAddressId: input.shippingAddressId || String(input.addressId),
      billingAddressId: input.billingAddressId,
      notes: input.notes,
      paymentMethod: input.paymentMethod || "CARD",
      paymentDetails: input.paymentDetails,
    });
  },

  async getCheckoutSummary(
    userId: number | string | bigint,
    deliveryMethod?: string,
    _couponCode?: string
  ) {
    const user = await userRepository.findById(String(userId));
    if (!user || !user.internalId) throw ApiError.unauthorized("User not found");
    const cart = await db.cart.findFirst({
      where: { userId: user.internalId, status: "active", is_active: true },
      include: {
        items: {
          where: { is_active: true },
          include: { variant_unit_price: true },
        },
      },
    });

    // Priced from the live `base_price`, not the price captured when the item
    // was added, so the summary reflects today's catalog and today's offers.
    const lines = (cart?.items ?? [])
      .filter((it) => it.variant_unit_price)
      .map((it) => ({
        itemId: it.variant_unit_price!.uuid,
        quantity: it.quantity,
        unitPrice: Number(it.variant_unit_price!.base_price ?? 0),
      }));

    const pricing = await offerService.priceCartItems(lines);
    const deliveryCharge = deliveryMethod === "EXPRESS" ? 100 : 0;

    return {
      subtotal: pricing.subtotal,
      deliveryCharge,
      discount: pricing.totalDiscount,
      totalSavings: pricing.totalSavings,
      items: pricing.lines,
      total: pricing.total + deliveryCharge,
    };
  },

  async getOrder(sessionUserId: string | number, idOrUuid: string | number): Promise<OrderDetailResponse> {
    return this.getCustomerOrderByUuid(String(sessionUserId), String(idOrUuid));
  },

  async getOrderByNumber(orderNumber: string): Promise<OrderDetailResponse | null> {
    const order = await db.order.findFirst({
      where: { orderNumber, is_active: true },
      select: { uuid: true },
    });
    if (!order?.uuid) return null;
    return this.getAdminOrderByUuid(order.uuid);
  },

  async cancelOrder(
    sessionUserId: string | number,
    idOrUuid: string | number,
    reason?: string
  ): Promise<OrderDetailResponse> {
    return this.cancelCustomerOrder(String(sessionUserId), String(idOrUuid), {
      note: reason,
    });
  },
};
