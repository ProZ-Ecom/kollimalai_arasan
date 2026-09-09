import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { orderService } from "@/features/orders/services/order.service";
import {
  updateOrderStatusSchema,
  type UpdateOrderStatusSchemaInput,
} from "@/features/orders/validations/order.schema";

export const PATCH = createApiHandler(
  {
    PATCH: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Unauthorized");
      }

      const uuid = context.params?.uuid;
      if (!uuid || typeof uuid !== "string") {
        throw ApiError.badRequest("Invalid order UUID");
      }

      const body = context.body as UpdateOrderStatusSchemaInput;
      const result = await orderService.setOrderStatus(
        sessionUserId,
        uuid,
        body
      );

      return apiSuccess(result, "Order status updated successfully", 200);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: updateOrderStatusSchema,
  }
);
