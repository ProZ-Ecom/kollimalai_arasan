import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { returnService } from "@/features/returns/services/return.service";
import { returnRepository } from "@/features/returns/repositories/return.repository";
import {
  returnOrderSchema,
  type ReturnOrderInput,
} from "@/features/orders/validations/order.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Authentication required");
      }

      const rawUuid = context.params?.uuid;
      if (!rawUuid) {
        throw ApiError.badRequest("Order UUID is required");
      }

      const body = (context.body || {}) as ReturnOrderInput;
      const order = await returnRepository.findOrderWithItems(rawUuid);
      if (!order) {
        throw ApiError.notFound("Order not found");
      }

      const result = await returnService.createCustomerReturnRequest(
        sessionUserId,
        {
          orderId: rawUuid,
          reason: body.note || "Return requested by customer",
          items: order.items.map((item) => ({
            orderItemId: item.uuid || String(item.id),
            quantity: item.quantity,
            reason: body.note || "Customer requested return",
          })),
        }
      );

      return apiSuccess(result, "Order return requested successfully", 201);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["CUSTOMER"],
    bodySchema: returnOrderSchema,
  }
);
