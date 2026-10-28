import crypto from "crypto";
import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type {
  CustomerReturnListInput,
  AdminReturnListInput,
} from "../validations/return.schema";

export const returnDetailInclude = {
  orders: {
    select: {
      id: true,
      uuid: true,
      orderNumber: true,
      order_status: true,
      payment_status: true,
      totalAmount: true,
      subtotal: true,
      discountAmount: true,
      shipping_charge: true,
      taxAmount: true,
      placed_at: true,
      createdAt: true,
      payments: {
        where: { is_active: true },
        select: {
          id: true,
          gateway: true,
          status: true,
          amount: true,
          currency: true,
          gateway_payment_id: true,
          gateway_order_id: true,
          createdAt: true,
          payment_methods: {
            select: { id: true, code: true, name: true },
          },
          transactions: {
            where: { is_active: true },
            select: {
              id: true,
              transaction_type: true,
              amount: true,
              status: true,
              gatewayResponse: true,
              createdAt: true,
            },
          },
        },
      },
      refunds: {
        where: { is_active: true },
        select: {
          id: true,
          amount: true,
          status: true,
          reason: true,
          processed_at: true,
          createdAt: true,
        },
      },
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
          variant_unit_price_id: true,
          product: {
            select: {
              images: {
                where: { is_active: true, isPrimary: true },
                select: { image_url: true },
                take: 1,
              },
            },
          },
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
        shipments: {
          where: { is_active: true },
          orderBy: { id: "desc" },
          take: 1,
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
        payments: {
          where: { is_active: true },
          orderBy: { createdAt: "desc" },
          take: 1,
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
          status: { in: ["requested", "approved", "picked_up", "delivered"] },
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
    videoUrl?: string | null;
    items: {
      orderItemId: bigint;
      quantity: number;
      reason?: string | null;
      refundAmount?: number | null;
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
          video_url: params.videoUrl || null,
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
          refund_amount: item.refundAmount !== undefined ? item.refundAmount : null,
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

  async rejectReturnRequest(
    returnRequestId: bigint,
    adminId: bigint,
    note?: string
  ) {
    const now = new Date();
    return db.return_requests.update({
      where: { id: returnRequestId },
      data: {
        status: "rejected",
        admin_notes: note || undefined,
        updated_at: now,
        updated_by: adminId,
      },
      include: returnDetailInclude,
    });
  },

  async reviewReturnInspection(params: {
    returnRequestId: bigint;
    adminId: bigint;
    decision: "passed" | "failed";
    notes: string;
  }) {
    const now = new Date();
    const isFailed = params.decision === "failed";

    return db.return_requests.update({
      where: { id: params.returnRequestId },
      data: {
        status: isFailed ? "rejected" : undefined,
        admin_notes: params.notes,
        inspected_at: now,
        updated_at: now,
        updated_by: params.adminId ?? undefined,
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
          updated_by: params.adminId ?? undefined,
        },
        include: returnDetailInclude,
      });

      const updatedOrder = await tx.order.update({
        where: { id: params.orderId },
        data: {
          order_status: "returned",
          updatedAt: now,
          updated_by: params.adminId ?? undefined,
        },
      });

      await tx.order_status_history.create({
        data: {
          order_id: params.orderId,
          status: "returned",
          note: "Return picked up and order marked returned",
          changed_by: params.adminId ?? undefined,
          is_active: true,
          created_by: params.adminId ?? undefined,
          updated_by: params.adminId ?? undefined,
        },
      });

      return {
        returnRequest: updatedReturn,
        order: updatedOrder,
      };
    });
  },

  async processReturnRefundTransaction(params: {
    returnRequestId: bigint;
    orderId: bigint;
    adminId: bigint;
    refundAmount: number;
    paymentMode: string;
    referenceId?: string;
    note?: string;
    gatewayRefundId?: string;
    isPrepaidGateway: boolean;
    restockInventory: boolean;
    isSimulated?: boolean;
  }) {
    const now = new Date();

    return db.$transaction(async (tx) => {
      // 1. Fetch fresh return request with order and items
      const returnReq = await tx.return_requests.findUniqueOrThrow({
        where: { id: params.returnRequestId },
        include: returnDetailInclude,
      });

      const order = returnReq.orders;
      const totalOrderAmount = Number(order.totalAmount);
      const refundAmount = params.refundAmount;

      // 2. Resolve or create payment record
      let paymentId: bigint | null = null;
      const successPayment = order.payments?.find(
        (p) => p.status === "success"
      ) || order.payments?.[0];

      if (successPayment) {
        paymentId = successPayment.id;
      } else {
        let manualMethod = await tx.payment_methods.findFirst({
          where: { code: params.isPrepaidGateway ? "RAZORPAY" : "COD" },
        });
        if (!manualMethod) {
          manualMethod = await tx.payment_methods.create({
            data: {
              code: params.isPrepaidGateway ? "RAZORPAY" : "COD",
              name: params.isPrepaidGateway ? "Online Payment" : "Cash on Delivery",
              is_active: true,
              created_by: params.adminId ?? undefined,
              updated_by: params.adminId ?? undefined,
            },
          });
        }
        const newPay = await tx.payment.create({
          data: {
            orderId: order.id,
            payment_method_id: manualMethod.id,
            amount: totalOrderAmount,
            currency: "INR",
            status: "success",
            gateway: params.isPrepaidGateway ? "RAZORPAY" : "COD",
            created_by: params.adminId ?? undefined,
            updated_by: params.adminId ?? undefined,
          },
        });
        paymentId = newPay.id;
      }

      // 3. Create Refund record
      const modeText = params.paymentMode;
      const refText = params.referenceId ? ` (Ref: ${params.referenceId})` : "";
      const simPrefix = params.isSimulated ? "[SIMULATED REFUND] " : "";
      const reasonText = `${simPrefix}Customer Return Refund #${returnReq.id} [${modeText}${refText}]${
        params.note ? ` - ${params.note}` : ""
      }`;

      await tx.refunds.create({
        data: {
          order_id: order.id,
          payment_id: paymentId,
          amount: refundAmount,
          reason: reasonText.slice(0, 255),
          status: "completed",
          processed_at: now,
          created_by: params.adminId ?? undefined,
          updated_by: params.adminId ?? undefined,
        },
      });

      // 4. Create PaymentTransaction audit record
      await tx.paymentTransaction.create({
        data: {
          paymentId,
          transaction_type: "refund",
          amount: refundAmount,
          status: params.isSimulated ? "simulated_refund" : "refunded",
          gatewayResponse: {
            isSimulated: Boolean(params.isSimulated),
            simulationNotice: params.isSimulated
              ? "LOCAL TEST SIMULATION ONLY - NO REAL FINANCIAL MOVEMENT"
              : undefined,
            isPrepaid: params.isPrepaidGateway,
            paymentMode: params.paymentMode,
            referenceId: params.referenceId || null,
            gatewayRefundId: params.gatewayRefundId || null,
            returnRequestId: String(returnReq.id),
            returnUuid: returnReq.uuid,
            note: params.note || null,
            processedAt: now.toISOString(),
          },
          created_by: params.adminId ?? undefined,
          updated_by: params.adminId ?? undefined,
        },
      });

      // 5. Restock inventory only for returned items if requested
      if (params.restockInventory) {
        for (const item of returnReq.return_items) {
          const vupId = item.order_items.variant_unit_price_id;
          if (!vupId) continue;

          const inv = await tx.inventory.findFirst({
            where: { variantUnitPriceId: vupId, is_active: true },
          });

          if (inv) {
            const newAvailable = Number(inv.quantity_available) + item.quantity;
            await tx.inventory.update({
              where: { id: BigInt(inv.id) },
              data: {
                quantity_available: newAvailable,
                updated_by: params.adminId ?? undefined,
              },
            });

            await tx.inventoryTransaction.create({
              data: {
                variant_unit_price_id: vupId,
                type: "in" as any,
                quantity: item.quantity,
                note: `RETURN: stock restored for return request #${returnReq.id}`,
                created_by: params.adminId ?? undefined,
                updated_by: params.adminId ?? undefined,
              },
            });
          }

          // Sync variant out_of_stock flag
          const vup = await tx.variantUnitPrice.findFirst({
            where: { id: vupId, deleted_at: null },
            select: { variant_id: true },
          });
          if (vup) {
            await tx.productVariant.updateMany({
              where: { id: vup.variant_id },
              data: { out_of_stock: false },
            });
          }
        }
      }

      // 6. Update return_requests status to "refunded"
      const updatedReturn = await tx.return_requests.update({
        where: { id: params.returnRequestId },
        data: {
          status: "refunded",
          updated_at: now,
          updated_by: params.adminId ?? undefined,
        },
        include: returnDetailInclude,
      });

      // 7. Calculate total refunds so far on this order
      const allRefunds = await tx.refunds.findMany({
        where: { order_id: order.id, is_active: true, status: "completed" },
        select: { amount: true },
      });
      const totalRefundedSum = allRefunds.reduce(
        (sum, r) => sum + Number(r.amount),
        0
      );

      const isFullyRefunded = totalRefundedSum >= totalOrderAmount - 0.01;

      // 8. Update payment and order status
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: isFullyRefunded ? "refunded" : "success",
          updated_by: params.adminId ?? undefined,
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          payment_status: isFullyRefunded ? "refunded" : "partial_refund",
          order_status: isFullyRefunded ? "returned" : undefined,
          updatedAt: now,
          updated_by: params.adminId ?? undefined,
        },
      });

      // 9. Record order status history
      const simStatusPrefix = params.isSimulated ? "[SIMULATED REFUND] " : "";
      await tx.order_status_history.create({
        data: {
          order_id: order.id,
          status: isFullyRefunded ? "returned" : order.order_status,
          note: `${simStatusPrefix}Admin processed ${isFullyRefunded ? "full" : "partial"} refund of ₹${refundAmount.toFixed(
            2
          )} for Return Request #${returnReq.id} via ${modeText}${refText}`,
          changed_by: params.adminId ?? undefined,
          created_by: params.adminId ?? undefined,
        },
      });

      return {
        returnRequest: updatedReturn,
        refundAmount,
        isFullyRefunded,
      };
    });
  },
};
