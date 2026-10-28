import { ApiError } from "@/lib/api/api-error";
import { returnRepository } from "../repositories/return.repository";
import { userRepository } from "@/features/users/repositories/user.repository";
import {
  isProduction,
  isDevelopment,
  isRefundSimulationAllowed,
  getRazorpayEnvironment,
} from "@/lib/env-config";
import { getRazorpayClient } from "@/features/payment/config/razorpay.config";
import type {
  CreateReturnRequestInput,
  CustomerReturnListInput,
  AdminReturnListInput,
  RejectReturnInput,
  AdminReviewReturnInput,
  AdminProcessReturnRefundInput,
} from "../validations/return.schema";
import type {
  ReturnRequestListItem,
  ReturnRequestDetailResponse,
  CreateReturnRequestResult,
  ApproveReturnResult,
  RejectReturnResult,
  PickupReturnResult,
  ReviewReturnResult,
  ProcessReturnRefundResult,
  ReturnItemInfo,
  ReturnPayoutDetails,
} from "../types/return.types";

function parsePayoutDetailsFromReason(reasonText?: string | null): ReturnPayoutDetails | null {
  if (!reasonText) return null;

  const upiMatch = reasonText.match(/Refund via UPI:\s*([^\s|]+)/i);
  if (upiMatch && upiMatch[1]) {
    return {
      method: "upi",
      upiId: upiMatch[1].trim(),
    };
  }

  const bankMatch = reasonText.match(/Refund via Bank:([^|]+)/i);
  if (bankMatch && bankMatch[1]) {
    const detailsStr = bankMatch[1];
    const acMatch = detailsStr.match(/A\/C:\s*([^\s,]+)/i);
    const ifscMatch = detailsStr.match(/IFSC:\s*([^\s,]+)/i);
    const holderMatch = detailsStr.match(/Holder:\s*([^,]+)/i);
    const bankNameMatch = detailsStr.match(/Bank:\s*([^,]+)/i);

    return {
      method: "bank_transfer",
      accountNumber: acMatch ? acMatch[1].trim() : undefined,
      ifscCode: ifscMatch ? ifscMatch[1].trim() : undefined,
      accountHolderName: holderMatch ? holderMatch[1].trim() : undefined,
      bankName: bankNameMatch ? bankNameMatch[1].trim() : undefined,
    };
  }

  return null;
}

function formatReturnItems(returnItems: any[]): ReturnItemInfo[] {
  return (returnItems || []).map((item) => {
    const unitPrice = Number(item.order_items.unit_price);
    const quantity = item.quantity;
    const itemRefund =
      item.refund_amount != null
        ? Number(item.refund_amount)
        : Math.round(unitPrice * quantity * 100) / 100;

    return {
      orderItemId: item.order_items.uuid || String(item.order_items.id),
      productName: item.order_items.product_name_snapshot,
      variantName: item.order_items.variant_snapshot,
      sku: item.order_items.sku_snapshot,
      orderedQuantity: item.order_items.quantity,
      returnQuantity: quantity,
      unitPrice,
      totalPrice: Number(item.order_items.total_price),
      refundAmount: itemRefund,
      primaryImage:
        item.order_items.product?.images?.[0]?.image_url || null,
      reason: item.reason,
    };
  });
}

function formatReturnDetail(req: any): ReturnRequestDetailResponse {
  const items = formatReturnItems(req.return_items);
  const eligibleRefundAmount = items.reduce(
    (acc, it) => acc + (it.refundAmount ?? it.unitPrice * it.returnQuantity),
    0
  );

  const order = req.orders;
  const isCod = Boolean(
    order.payments?.some(
      (p: any) =>
        p.gateway?.toUpperCase() === "COD" ||
        p.payment_methods?.code?.toUpperCase() === "COD"
    ) ||
      order.payment_status === "pending" ||
      (order as any).order_status_history?.some(
        (h: any) =>
          (h.note || "").toLowerCase().includes("cash on delivery") ||
          (h.note || "").toLowerCase().includes("(cod)")
      )
  );

  const paymentMethod =
    order.payments?.[0]?.gateway || (isCod ? "COD" : "RAZORPAY");

  const payoutDetails = parsePayoutDetailsFromReason(req.reason);

  const refunds = (order.refunds || []).map((r: any) => ({
    id: String(r.id),
    amount: Number(r.amount),
    status: r.status,
    reason: r.reason,
    processedAt: r.processed_at,
  }));

  return {
    id: req.uuid || String(req.id),
    orderId: order.uuid || String(order.id),
    orderNumber: order.orderNumber,
    orderStatus: order.order_status,
    customer: {
      id:
        req.users_return_requests_user_idTousers.uuid ||
        String(req.users_return_requests_user_idTousers.id),
      name: req.users_return_requests_user_idTousers.name,
      email: req.users_return_requests_user_idTousers.email,
      phone: req.users_return_requests_user_idTousers.phone,
    },
    reason: req.reason,
    videoUrl: req.video_url || null,
    status: req.status,
    adminNotes: req.admin_notes || null,
    inspectedAt: req.inspected_at || null,
    returnAwb: req.return_awb_code || null,
    returnShipmentId: req.return_shipment_id || null,
    returnLabelUrl: req.return_label_url || null,
    courierName: req.courier_partner_name || null,
    paymentMethod,
    paymentStatus: order.payment_status,
    isCod,
    totalAmount: Number(order.totalAmount),
    eligibleRefundAmount: Math.round(eligibleRefundAmount * 100) / 100,
    payoutDetails,
    refunds,
    requestedAt: req.requested_at,
    approvedAt: req.approved_at,
    items,
    createdAt: req.created_at,
    updatedAt: req.updated_at,
  };
}

function formatReturnListItem(req: any): ReturnRequestListItem {
  return {
    id: req.uuid || String(req.id),
    orderId: req.orders.uuid || String(req.orders.id),
    orderNumber: req.orders.orderNumber,
    orderStatus: req.orders.order_status,
    customer: req.users_return_requests_user_idTousers
      ? {
          id:
            req.users_return_requests_user_idTousers.uuid ||
            String(req.users_return_requests_user_idTousers.id),
          name: req.users_return_requests_user_idTousers.name,
          email: req.users_return_requests_user_idTousers.email,
          phone: req.users_return_requests_user_idTousers.phone,
        }
      : undefined,
    reason: req.reason,
    videoUrl: req.video_url || null,
    status: req.status,
    adminNotes: req.admin_notes || null,
    inspectedAt: req.inspected_at || null,
    totalItems: req.return_items?.length || 0,
    requestedAt: req.requested_at,
    approvedAt: req.approved_at,
    createdAt: req.created_at,
    updatedAt: req.updated_at,
  };
}

export const returnService = {
  async createCustomerReturnRequest(
    sessionUserId: string,
    input: CreateReturnRequestInput
  ): Promise<CreateReturnRequestResult> {
    // 1. Resolve Customer
    const customer = await userRepository.findById(sessionUserId);
    if (!customer) {
      throw ApiError.unauthorized("Customer not found");
    }
    const customerId = BigInt(customer.internalId || customer.id);

    // 2. Validate mandatory video upload
    if (!input.videoUrl || !input.videoUrl.trim()) {
      throw ApiError.badRequest(
        "Product condition video is mandatory before submitting a return request."
      );
    }

    // 3. Resolve Order
    const order = await returnRepository.findOrderWithItems(input.orderId);
    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    // 4. Customer Ownership Check
    if (order.userId !== customerId) {
      throw ApiError.forbidden("You do not have access to this order");
    }

    // 5. Order Status & 5-Day Return Window Check
    if (order.order_status !== "delivered") {
      throw ApiError.badRequest(
        `Cannot create return request for order with status '${order.order_status}'. Only 'delivered' orders can be returned.`
      );
    }

    const deliveredDate =
      (order as any).shipments?.[0]?.delivered_at ||
      (order as any).shipments?.[0]?.deliveredAt ||
      order.updatedAt ||
      order.createdAt;

    const deliveredTime = new Date(deliveredDate).getTime();
    const fiveDaysInMs = 5 * 24 * 60 * 60 * 1000;
    const elapsedMs = Date.now() - deliveredTime;

    if (elapsedMs > fiveDaysInMs) {
      throw ApiError.badRequest(
        "The 5-day return window for this order has expired. Return requests can only be placed within 5 days of delivery."
      );
    }

    // 6. Validate Return Items Belong to Order & Quantities
    const orderItemMap = new Map<string, any>();
    order.items.forEach((item) => {
      if (item.uuid) orderItemMap.set(item.uuid, item);
      orderItemMap.set(String(item.id), item);
    });

    const uniqueOrderItems = new Set<string>();
    const validatedItems: {
      orderItemId: bigint;
      quantity: number;
      reason?: string | null;
      refundAmount?: number | null;
      publicId: string;
    }[] = [];

    const orderItemInternalIds: bigint[] = [];

    for (const itemInput of input.items) {
      if (uniqueOrderItems.has(itemInput.orderItemId)) {
        throw ApiError.badRequest(
          `Duplicate order item '${itemInput.orderItemId}' in return request`
        );
      }
      uniqueOrderItems.add(itemInput.orderItemId);

      const orderItem = orderItemMap.get(itemInput.orderItemId);
      if (!orderItem) {
        throw ApiError.badRequest(
          `Order item '${itemInput.orderItemId}' does not belong to this order`
        );
      }

      if (itemInput.quantity > orderItem.quantity) {
        throw ApiError.badRequest(
          `Return quantity (${itemInput.quantity}) exceeds purchased quantity (${orderItem.quantity}) for item '${orderItem.product_name_snapshot}'`
        );
      }

      const unitPrice = Number(orderItem.unit_price || 0);
      orderItemInternalIds.push(orderItem.id);
      validatedItems.push({
        orderItemId: orderItem.id,
        quantity: itemInput.quantity,
        reason: itemInput.reason || input.reason,
        refundAmount: Math.round(unitPrice * itemInput.quantity * 100) / 100,
        publicId: orderItem.uuid || String(orderItem.id),
      });
    }

    // 7. Check Duplicate Active Return Requests for these order items
    const activeReturns = await returnRepository.findActiveReturnsForOrderItems(
      orderItemInternalIds
    );
    if (activeReturns.length > 0) {
      const duplicate = activeReturns[0];
      throw ApiError.conflict(
        `An active return request (${duplicate.return_requests.status}) already exists for item '${duplicate.order_items.product_name_snapshot}'`
      );
    }

    // Format reason with refund destination and customer notes for admin visibility
    let fullReason = input.reason;
    if (input.description && input.description.trim()) {
      fullReason += ` | Note: ${input.description.trim()}`;
    }
    if (input.refundDetails) {
      if (input.refundDetails.method === "upi" && input.refundDetails.upiId) {
        fullReason += ` | Refund via UPI: ${input.refundDetails.upiId.trim()}`;
      } else if (input.refundDetails.method === "bank_transfer") {
        const bank = input.refundDetails.bankName
          ? ` ${input.refundDetails.bankName.trim()},`
          : "";
        fullReason += ` | Refund via Bank:${bank} A/C: ••••${input.refundDetails.accountNumber
          ?.trim()
          .slice(-4)}, IFSC: ${input.refundDetails.ifscCode
          ?.trim()
          .toUpperCase()}, Holder: ${input.refundDetails.accountHolderName?.trim()}`;
      }
    }
    if (fullReason.length > 255) {
      fullReason = fullReason.slice(0, 252) + "...";
    }

    // 8. Atomically Create Return Request and Return Items
    const created = await returnRepository.createReturnRequestTransaction({
      orderId: order.id,
      userId: customerId,
      reason: fullReason,
      videoUrl: input.videoUrl.trim(),
      items: validatedItems,
    });

    return {
      id: created.uuid || String(created.id),
      orderId: order.uuid || String(order.id),
      orderNumber: order.orderNumber,
      status: "requested",
      reason: created.reason,
      videoUrl: created.video_url,
      requestedAt: created.requested_at,
      items: validatedItems.map((i) => ({
        orderItemId: i.publicId,
        quantity: i.quantity,
        reason: i.reason || null,
      })),
      createdAt: created.created_at,
      updatedAt: created.updated_at,
    };
  },

  async getCustomerReturnRequests(
    sessionUserId: string,
    params: CustomerReturnListInput
  ) {
    const customer = await userRepository.findById(sessionUserId);
    if (!customer) {
      throw ApiError.unauthorized("Customer not found");
    }
    const customerId = BigInt(customer.internalId || customer.id);

    const result = await returnRepository.findCustomerReturnRequests(
      customerId,
      params
    );

    const data = result.requests.map(formatReturnListItem);

    return {
      data,
      meta: {
        page: result.page,
        limit: result.limit,
        pageSize: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit) || 1,
      },
    };
  },

  async getCustomerReturnRequestByUuid(
    sessionUserId: string,
    uuid: string
  ): Promise<ReturnRequestDetailResponse> {
    const customer = await userRepository.findById(sessionUserId);
    if (!customer) {
      throw ApiError.unauthorized("Customer not found");
    }
    const customerId = BigInt(customer.internalId || customer.id);

    const req = await returnRepository.findCustomerReturnRequestByUuid(
      uuid,
      customerId
    );

    if (!req) {
      const anyReq = await returnRepository.findReturnRequestByUuidOnly(uuid);
      if (anyReq) {
        throw ApiError.forbidden(
          "You do not have access to this return request"
        );
      }
      throw ApiError.notFound("Return request not found");
    }

    return formatReturnDetail(req);
  },

  async getAdminReturnRequests(params: AdminReturnListInput) {
    const result = await returnRepository.findAdminReturnRequests(params);
    const data = result.requests.map(formatReturnListItem);

    return {
      data,
      meta: {
        page: result.page,
        limit: result.limit,
        pageSize: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit) || 1,
      },
    };
  },

  async getAdminReturnRequestByUuid(
    uuid: string
  ): Promise<ReturnRequestDetailResponse> {
    const req = await returnRepository.findReturnRequestByUuidOnly(uuid);
    if (!req) {
      throw ApiError.notFound("Return request not found");
    }

    return formatReturnDetail(req);
  },

  async approveReturnRequest(
    adminSessionUserId: string,
    uuid: string
  ): Promise<ApproveReturnResult> {
    const admin = await userRepository.findById(adminSessionUserId);
    if (!admin) {
      throw ApiError.unauthorized("Session expired. Please log in again.");
    }
    const adminId = BigInt(admin.internalId || admin.id);

    const req = await returnRepository.findReturnRequestByUuidOnly(uuid);
    if (!req) {
      throw ApiError.notFound("Return request not found");
    }

    if (req.status === "approved") {
      throw ApiError.badRequest("Return request is already approved");
    }

    if (req.status !== "requested") {
      throw ApiError.badRequest(
        `Cannot approve return request in '${req.status}' status. Only 'requested' return requests can be approved.`
      );
    }

    const updated = await returnRepository.approveReturnRequest(
      req.id,
      adminId
    );

    return {
      id: updated.uuid || String(updated.id),
      orderId: updated.orders.uuid || String(updated.orders.id),
      status: "approved",
      approvedAt: updated.approved_at || new Date(),
    };
  },

  async rejectReturnRequest(
    adminSessionUserId: string,
    uuid: string,
    input?: RejectReturnInput
  ): Promise<RejectReturnResult> {
    const admin = await userRepository.findById(adminSessionUserId);
    if (!admin) {
      throw ApiError.unauthorized("Session expired. Please log in again.");
    }
    const adminId = BigInt(admin.internalId || admin.id);

    const req = await returnRepository.findReturnRequestByUuidOnly(uuid);
    if (!req) {
      throw ApiError.notFound("Return request not found");
    }

    if (req.status === "rejected") {
      throw ApiError.badRequest("Return request is already rejected");
    }

    if (req.status === "refunded") {
      throw ApiError.badRequest("Cannot reject a return request that has already been refunded");
    }

    const updated = await returnRepository.rejectReturnRequest(
      req.id,
      adminId,
      input?.note
    );

    return {
      id: updated.uuid || String(updated.id),
      orderId: updated.orders.uuid || String(updated.orders.id),
      status: "rejected",
    };
  },

  async completePickup(
    adminSessionUserId: string,
    uuid: string
  ): Promise<PickupReturnResult> {
    const admin = await userRepository.findById(adminSessionUserId);
    if (!admin) {
      throw ApiError.unauthorized("Session expired. Please log in again.");
    }
    const adminId = BigInt(admin.internalId || admin.id);

    const req = await returnRepository.findReturnRequestByUuidOnly(uuid);
    if (!req) {
      throw ApiError.notFound("Return request not found");
    }

    if (req.status === "picked_up") {
      throw ApiError.badRequest("Return pickup has already been completed");
    }

    if (req.status !== "approved") {
      throw ApiError.badRequest(
        `Cannot complete pickup for return request in '${req.status}' status. Return request must be in 'approved' status.`
      );
    }

    const result = await returnRepository.completePickupTransaction({
      returnRequestId: req.id,
      orderId: req.orders.id,
      adminId,
    });

    return {
      id: result.returnRequest.uuid || String(result.returnRequest.id),
      orderId: result.order.uuid || String(result.order.id),
      orderNumber: result.order.orderNumber,
      returnStatus: "picked_up",
      orderStatus: "returned",
    };
  },

  async reviewReturnRequest(
    adminSessionUserId: string,
    uuid: string,
    input: AdminReviewReturnInput
  ): Promise<ReviewReturnResult> {
    const admin = await userRepository.findById(adminSessionUserId);
    if (!admin) {
      throw ApiError.unauthorized("Session expired. Please log in again.");
    }
    const adminId = BigInt(admin.internalId || admin.id);

    const req = await returnRepository.findReturnRequestByUuidOnly(uuid);
    if (!req) {
      throw ApiError.notFound("Return request not found");
    }

    if (req.status === "refunded") {
      throw ApiError.badRequest("Cannot review a return request that has already been refunded.");
    }

    // Admin physical review requires parcel to be delivered first
    if (req.status !== "delivered") {
      throw ApiError.badRequest(
        `Physical inspection requires the returned parcel to be 'delivered'. Current status: '${req.status}'.`
      );
    }

    const updated = await returnRepository.reviewReturnInspection({
      returnRequestId: req.id,
      adminId,
      decision: input.decision,
      notes: input.notes.trim(),
    });

    return {
      id: updated.uuid || String(updated.id),
      orderId: updated.orders.uuid || String(updated.orders.id),
      status: updated.status,
      adminNotes: updated.admin_notes || input.notes.trim(),
      inspectedAt: updated.inspected_at || new Date(),
    };
  },

  async processReturnRefund(
    adminSessionUserId: string,
    uuid: string,
    input: AdminProcessReturnRefundInput
  ): Promise<ProcessReturnRefundResult> {
    const admin = await userRepository.findById(adminSessionUserId);
    if (!admin) {
      throw ApiError.unauthorized("Session expired. Please log in again.");
    }
    const adminId = BigInt(admin.internalId || admin.id);

    const req = await returnRepository.findReturnRequestByUuidOnly(uuid);
    if (!req) {
      throw ApiError.notFound("Return request not found");
    }

    // 1. Enforce Lifecycle Gates
    if (req.status === "refunded") {
      throw ApiError.badRequest("This return request has already been refunded.");
    }

    if (req.status === "rejected") {
      throw ApiError.badRequest("Cannot refund a rejected return request.");
    }

    if (req.status !== "delivered") {
      throw ApiError.badRequest(
        `Cannot authorize refund: Return parcel must reach 'delivered' status and pass physical product inspection before triggering refund. Current status is '${req.status}'.`
      );
    }

    if (!req.inspected_at) {
      throw ApiError.badRequest(
        "Cannot authorize refund: The returned product must be physically inspected and approved by admin before processing refund."
      );
    }

    // 2. Calculate eligible refund amount
    const eligibleAmount = req.return_items.reduce((sum: number, item: any) => {
      const uPrice = Number(item.order_items.unit_price);
      const itemRefund =
        item.refund_amount != null
          ? Number(item.refund_amount)
          : Math.round(uPrice * item.quantity * 100) / 100;
      return sum + itemRefund;
    }, 0);

    const orderTotal = Number(req.orders.totalAmount);
    const existingRefundsSum = (req.orders.refunds || []).reduce(
      (s: number, r: any) => s + Number(r.amount),
      0
    );
    const maxRemainingRefundable = Math.max(0, orderTotal - existingRefundsSum);

    const refundAmount = input.amount
      ? Math.min(input.amount, eligibleAmount)
      : Math.min(eligibleAmount, maxRemainingRefundable);

    if (refundAmount <= 0) {
      throw ApiError.badRequest("Eligible refund amount must be greater than ₹0.");
    }

    if (input.amount && input.amount > maxRemainingRefundable + 0.01) {
      throw ApiError.badRequest(
        `Refund amount cannot exceed remaining order balance of ₹${maxRemainingRefundable.toFixed(
          2
        )}.`
      );
    }

    // 3. Detect payment method & COD vs Prepaid
    const order = req.orders;
    const isCod = Boolean(
      order.payments?.some(
        (p: any) =>
          p.gateway?.toUpperCase() === "COD" ||
          p.payment_methods?.code?.toUpperCase() === "COD"
      ) ||
        order.payment_status === "pending" ||
        (order as any).order_status_history?.some(
          (h: any) =>
            (h.note || "").toLowerCase().includes("cash on delivery") ||
            (h.note || "").toLowerCase().includes("(cod)")
        )
    );

    let paymentMode = input.paymentMode;
    let referenceId = input.referenceId?.trim();
    let gatewayRefundId: string | undefined;

    const isProd = isProduction();
    const isSimAllowed = isRefundSimulationAllowed();
    let isSimulated = false;

    if (isCod) {
      // COD Refund Workflow
      if (!paymentMode) {
        // Fallback to customer's submitted payout method if present
        const parsed = parsePayoutDetailsFromReason(req.reason);
        paymentMode =
          parsed?.method === "upi"
            ? "UPI Transfer"
            : parsed?.method === "bank_transfer"
            ? "Bank Transfer"
            : "Cash / Manual Transfer";
      }

      // In production, require admin to provide confirmation UTR / bank reference
      if (isProd) {
        if (!referenceId) {
          throw ApiError.badRequest(
            "Production Safety: A valid Bank Reference Number / UTR is required to confirm manual payout for Cash on Delivery returns."
          );
        }
        isSimulated = false;
      } else {
        // In development: if simulation is enabled and referenceId omitted, provide simulated UTR
        if (isSimAllowed) {
          isSimulated = true;
          referenceId = referenceId || `SIM_COD_UTR_${Date.now().toString().slice(-8)}`;
        }
      }
      // Strictly do NOT attempt Razorpay gateway API call for COD
    } else {
      // Prepaid Razorpay Refund Workflow
      paymentMode = paymentMode || "Razorpay Gateway Refund";

      const successfulPayment = order.payments?.find(
        (p: any) =>
          Boolean(p.gateway_payment_id) &&
          (p.status === "success" || p.status === "captured")
      );

      if (isProd) {
        // In production: Must verify valid real gateway payment record
        if (!successfulPayment?.gateway_payment_id) {
          throw ApiError.badRequest(
            "Production Safety: Cannot process online gateway refund because the order has no verified gateway payment transaction ID. If this was settled offline, contact support or record an approved manual adjustment."
          );
        }

        const paymentId = successfulPayment.gateway_payment_id;
        if (
          paymentId.startsWith("pay_test_") ||
          paymentId.startsWith("test_") ||
          paymentId === "webhook_captured"
        ) {
          throw ApiError.badRequest(
            `Production Safety: Cannot issue production refund against test payment ID '${paymentId}'.`
          );
        }

        try {
          const razorpay = getRazorpayClient();
          const refundResponse = await razorpay.payments.refund(paymentId, {
            amount: Math.round(refundAmount * 100),
            notes: {
              returnRequestId: String(req.id),
              orderNumber: order.orderNumber,
              returnUuid: req.uuid,
            },
          });
          gatewayRefundId = refundResponse?.id;
          referenceId = referenceId || gatewayRefundId;
          isSimulated = false;
        } catch (rfErr: any) {
          console.error(
            `[Razorpay Production Return Refund Error] Failed refund for return #${req.id}:`,
            rfErr
          );
          throw ApiError.badRequest(
            `Razorpay online refund failed: ${rfErr?.error?.description || rfErr?.message || "Gateway declined"}`
          );
        }
      } else {
        // In development / test environment:
        if (isSimAllowed) {
          // Explicit development refund simulation
          isSimulated = true;
          gatewayRefundId = undefined; // Do not fabricate a fake Razorpay ID
          referenceId = referenceId || `SIM_DEV_REFUND_${Date.now().toString().slice(-8)}`;
        } else {
          // Developer explicitly wants to test against Razorpay Sandbox
          if (!successfulPayment?.gateway_payment_id) {
            throw ApiError.badRequest(
              "Order does not have a recorded gateway payment ID to test with Razorpay sandbox. Set REFUND_SIMULATION_ENABLED=true in .env to test without gateway calls."
            );
          }

          const rzEnv = getRazorpayEnvironment();
          if (rzEnv.mode === "live") {
            throw ApiError.badRequest(
              "[FATAL SAFETY BLOCK] Live Razorpay credentials (rzp_live_*) cannot be used in development. Switch to Razorpay test credentials or enable REFUND_SIMULATION_ENABLED=true."
            );
          }

          try {
            const razorpay = getRazorpayClient();
            const refundResponse = await razorpay.payments.refund(
              successfulPayment.gateway_payment_id,
              {
                amount: Math.round(refundAmount * 100),
                notes: {
                  returnRequestId: String(req.id),
                  orderNumber: order.orderNumber,
                  returnUuid: req.uuid,
                  environment: "development_sandbox",
                },
              }
            );
            gatewayRefundId = refundResponse?.id;
            referenceId = referenceId || gatewayRefundId;
            isSimulated = false;
          } catch (rfErr: any) {
            console.error(
              `[Razorpay Sandbox Return Refund Error] Failed sandbox refund for return #${req.id}:`,
              rfErr
            );
            throw ApiError.badRequest(
              `Razorpay sandbox refund failed: ${rfErr?.error?.description || rfErr?.message || "Gateway declined"}. To simulate locally without calling Razorpay, set REFUND_SIMULATION_ENABLED=true.`
            );
          }
        }
      }
    }

    // 4. Atomically persist refund, audit transaction, restock inventory, and update statuses
    const result = await returnRepository.processReturnRefundTransaction({
      returnRequestId: req.id,
      orderId: order.id,
      adminId,
      refundAmount,
      paymentMode: paymentMode || "Manual Transfer",
      referenceId,
      note: input.note,
      gatewayRefundId,
      isPrepaidGateway: !isCod,
      restockInventory: input.restockInventory ?? true,
      isSimulated,
    });

    return {
      id: result.returnRequest.uuid || String(result.returnRequest.id),
      orderId: order.uuid || String(order.id),
      orderNumber: order.orderNumber,
      refundAmount: result.refundAmount,
      paymentMode: paymentMode || "Manual Transfer",
      referenceId,
      returnStatus: "refunded",
      orderPaymentStatus: result.isFullyRefunded ? "refunded" : "partial_refund",
      isSimulated,
      message: isSimulated
        ? `[Simulated Test] Return refund of ₹${refundAmount.toFixed(
            2
          )} recorded locally (Simulation Mode - No live gateway transaction).`
        : `Successfully processed refund of ₹${refundAmount.toFixed(
            2
          )} for Return Request #${req.id} via ${paymentMode}.`,
    };
  },
};
