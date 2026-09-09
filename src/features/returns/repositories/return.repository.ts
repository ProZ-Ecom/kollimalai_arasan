import crypto from "crypto";
import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type {
  CustomerReturnListInput,
  AdminReturnListInput,
} from "../validations/return.schema";

const returnDetailInclude = {
  orders: {
    select: {
      id: true,
      uuid: true,
      orderNumber: true,
      order_status: true,
      totalAmount: true,
      placed_at: true,
      createdAt: true,
    },
  },
  users_return_requests_user_idTousers: {
    select: {
      id: true,
      uuid: true,
      name: true,
      email: true,
      phone: true,
    },
  },
  return_items: {
    include: {
      order_items: {
        select: {
          id: true,
          uuid: true,
          product_name_snapshot: true,
          variant_snapshot: true,
          sku_snapshot: true,
          quantity: true,
          unit_price: true,
          total_price: true,
        },
      },
    },
  },
};

export const returnRepository = {
  async findOrderWithItems(orderUuid: string) {
    return db.order.findFirst({
      where: { uuid: orderUuid, is_active: true },
      include: {
        items: {
          where: { is_active: true },
        },
        user: {
          select: {
            id: true,
            uuid: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  },

  async findActiveReturnsForOrderItems(orderItemIds: bigint[]) {
    return db.return_items.findMany({
      where: {
        order_item_id: { in: orderItemIds },
        is_active: true,
        return_requests: {
          status: { in: ["requested", "approved"] },
          is_active: true,
        },
      },
      include: {
        return_requests: {
          select: {
            id: true,
            uuid: true,
            status: true,
          },
        },
        order_items: {
          select: {
            id: true,
            uuid: true,
            product_name_snapshot: true,
          },
        },
      },
    });
  },

  async createReturnRequestTransaction(params: {
    orderId: bigint;
    userId: bigint;
    reason: string;
    items: {
      orderItemId: bigint;
      quantity: number;
      reason?: string | null;
    }[];
  }) {
    const returnUuid = crypto.randomUUID();
    const now = new Date();

    return db.$transaction(async (tx) => {
      const returnRequest = await tx.return_requests.create({
        data: {
          uuid: returnUuid,
          order_id: params.orderId,
          user_id: params.userId,
          reason: params.reason,
          status: "requested",
          requested_at: now,
          is_active: true,
          created_by: params.userId,
          updated_by: params.userId,
        },
      });

      await tx.return_items.createMany({
        data: params.items.map((item) => ({
          return_request_id: returnRequest.id,
          order_item_id: item.orderItemId,
          quantity: item.quantity,
          reason: item.reason || null,
          refund_amount: null,
          is_active: true,
          created_by: params.userId,
          updated_by: params.userId,
        })),
      });

      const fullRecord = await tx.return_requests.findUniqueOrThrow({
        where: { id: returnRequest.id },
        include: returnDetailInclude,
      });

      return fullRecord;
    });
  },

  async findCustomerReturnRequests(
    customerId: bigint,
    params: CustomerReturnListInput
  ) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.return_requestsWhereInput = {
      user_id: customerId,
      is_active: true,
    };

    if (params.status) {
      where.status = params.status;
    }

    if (params.search) {
      const s = params.search.trim();
      where.OR = [
        { reason: { contains: s } },
        { orders: { orderNumber: { contains: s } } },
      ];
    }

    const sortOrder = params.sortOrder ?? "desc";
    const sortBy = params.sortBy ?? "createdAt";
    const orderBy: Prisma.return_requestsOrderByWithRelationInput = {
      [sortBy === "requestedAt" ? "requested_at" : sortBy === "approvedAt" ? "approved_at" : sortBy === "updatedAt" ? "updated_at" : "created_at"]: sortOrder,
    };

    const [requests, total] = await Promise.all([
      db.return_requests.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: returnDetailInclude,
      }),
      db.return_requests.count({ where }),
    ]);

    return {
      requests,
      total,
      page,
      limit,
    };
  },

  async findCustomerReturnRequestByUuid(uuid: string, customerId: bigint) {
    return db.return_requests.findFirst({
      where: {
        uuid,
        user_id: customerId,
        is_active: true,
      },
      include: returnDetailInclude,
    });
  },

  async findReturnRequestByUuidOnly(uuid: string) {
    return db.return_requests.findFirst({
      where: {
        uuid,
        is_active: true,
      },
      include: returnDetailInclude,
    });
  },

  async findAdminReturnRequests(params: AdminReturnListInput) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.return_requestsWhereInput = {
      is_active: true,
    };

    if (params.status) {
      where.status = params.status;
    }

    if (params.search) {
      const s = params.search.trim();
      where.OR = [
        { reason: { contains: s } },
        { orders: { orderNumber: { contains: s } } },
        { users_return_requests_user_idTousers: { name: { contains: s } } },
        { users_return_requests_user_idTousers: { email: { contains: s } } },
        { users_return_requests_user_idTousers: { phone: { contains: s } } },
      ];
    }

    const sortOrder = params.sortOrder ?? "desc";
    const sortBy = params.sortBy ?? "requestedAt";
    const orderBy: Prisma.return_requestsOrderByWithRelationInput = {
      [sortBy === "createdAt" ? "created_at" : sortBy === "approvedAt" ? "approved_at" : sortBy === "updatedAt" ? "updated_at" : "requested_at"]: sortOrder,
    };

    const [requests, total] = await Promise.all([
      db.return_requests.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: returnDetailInclude,
      }),
      db.return_requests.count({ where }),
    ]);

    return {
      requests,
      total,
      page,
      limit,
    };
  },

  async approveReturnRequest(returnRequestId: bigint, adminId: bigint) {
    const now = new Date();
    return db.return_requests.update({
      where: { id: returnRequestId },
      data: {
        status: "approved",
        approved_at: now,
        updated_at: now,
        updated_by: adminId,
      },
      include: returnDetailInclude,
    });
  },

  async rejectReturnRequest(returnRequestId: bigint, adminId: bigint) {
    const now = new Date();
    return db.return_requests.update({
      where: { id: returnRequestId },
      data: {
        status: "rejected",
        updated_at: now,
        updated_by: adminId,
      },
      include: returnDetailInclude,
    });
  },

  async completePickupTransaction(params: {
    returnRequestId: bigint;
    orderId: bigint;
    adminId: bigint;
  }) {
    const now = new Date();

    return db.$transaction(async (tx) => {
      const updatedReturn = await tx.return_requests.update({
        where: { id: params.returnRequestId },
        data: {
          status: "picked_up",
          updated_at: now,
          updated_by: params.adminId,
        },
        include: returnDetailInclude,
      });

      const updatedOrder = await tx.order.update({
        where: { id: params.orderId },
        data: {
          order_status: "returned",
          updatedAt: now,
          updated_by: params.adminId,
        },
      });

      await tx.order_status_history.create({
        data: {
          order_id: params.orderId,
          status: "returned",
          note: "Return picked up and order marked returned",
          changed_by: params.adminId,
          is_active: true,
          created_by: params.adminId,
          updated_by: params.adminId,
        },
      });

      return {
        returnRequest: updatedReturn,
        order: updatedOrder,
      };
    });
  },
};
