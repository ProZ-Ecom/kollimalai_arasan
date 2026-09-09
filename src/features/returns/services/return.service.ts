import { ApiError } from "@/lib/api/api-error";
import { returnRepository } from "../repositories/return.repository";
import { userRepository } from "@/features/users/repositories/user.repository";
import type {
  CreateReturnRequestInput,
  CustomerReturnListInput,
  AdminReturnListInput,
  RejectReturnInput,
} from "../validations/return.schema";
import type {
  ReturnRequestListItem,
  ReturnRequestDetailResponse,
  CreateReturnRequestResult,
  ApproveReturnResult,
  RejectReturnResult,
  PickupReturnResult,
  ReturnItemInfo,
} from "../types/return.types";

function formatReturnItems(returnItems: any[]): ReturnItemInfo[] {
  return (returnItems || []).map((item) => ({
    orderItemId: item.order_items.uuid || String(item.order_items.id),
    productName: item.order_items.product_name_snapshot,
    variantName: item.order_items.variant_snapshot,
    sku: item.order_items.sku_snapshot,
    orderedQuantity: item.order_items.quantity,
    returnQuantity: item.quantity,
    unitPrice: Number(item.order_items.unit_price),
    totalPrice: Number(item.order_items.total_price),
    reason: item.reason,
  }));
}

function formatReturnDetail(req: any): ReturnRequestDetailResponse {
  return {
    id: req.uuid || String(req.id),
    orderId: req.orders.uuid || String(req.orders.id),
    orderNumber: req.orders.orderNumber,
    orderStatus: req.orders.order_status,
    customer: {
      id: req.users_return_requests_user_idTousers.uuid || String(req.users_return_requests_user_idTousers.id),
      name: req.users_return_requests_user_idTousers.name,
      email: req.users_return_requests_user_idTousers.email,
      phone: req.users_return_requests_user_idTousers.phone,
    },
    reason: req.reason,
    status: req.status,
    requestedAt: req.requested_at,
    approvedAt: req.approved_at,
    items: formatReturnItems(req.return_items),
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
          id: req.users_return_requests_user_idTousers.uuid || String(req.users_return_requests_user_idTousers.id),
          name: req.users_return_requests_user_idTousers.name,
          email: req.users_return_requests_user_idTousers.email,
          phone: req.users_return_requests_user_idTousers.phone,
        }
      : undefined,
    reason: req.reason,
    status: req.status,
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

    // 2. Resolve Order
    const order = await returnRepository.findOrderWithItems(input.orderId);
    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    // 3. Customer Ownership Check
    if (order.userId !== customerId) {
      throw ApiError.forbidden("You do not have access to this order");
    }

    // 4. Order Status Check (Only delivered orders can be returned)
    if (order.order_status !== "delivered") {
      throw ApiError.badRequest(
        `Cannot create return request for order with status '${order.order_status}'. Only 'delivered' orders can be returned.`
      );
    }

    // 5. Validate Return Items Belong to Order & Quantities
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

      orderItemInternalIds.push(orderItem.id);
      validatedItems.push({
        orderItemId: orderItem.id,
        quantity: itemInput.quantity,
        reason: itemInput.reason,
        publicId: orderItem.uuid || String(orderItem.id),
      });
    }

    // 6. Check Duplicate Active Return Requests for these order items
    const activeReturns = await returnRepository.findActiveReturnsForOrderItems(
      orderItemInternalIds
    );
    if (activeReturns.length > 0) {
      const duplicate = activeReturns[0];
      throw ApiError.conflict(
        `An active return request (${duplicate.return_requests.status}) already exists for item '${duplicate.order_items.product_name_snapshot}'`
      );
    }

    // 7. Atomically Create Return Request and Return Items
    const created = await returnRepository.createReturnRequestTransaction({
      orderId: order.id,
      userId: customerId,
      reason: input.reason,
      items: validatedItems,
    });

    return {
      id: created.uuid || String(created.id),
      orderId: order.uuid || String(order.id),
      orderNumber: order.orderNumber,
      status: "requested",
      reason: created.reason,
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
        throw ApiError.forbidden("You do not have access to this return request");
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
    _input?: RejectReturnInput
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

    if (req.status !== "requested") {
      throw ApiError.badRequest(
        `Cannot reject return request in '${req.status}' status. Only 'requested' return requests can be rejected.`
      );
    }

    const updated = await returnRepository.rejectReturnRequest(
      req.id,
      adminId
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

    if (req.orders.order_status === "returned") {
      throw ApiError.badRequest("Order is already marked as returned");
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
};
