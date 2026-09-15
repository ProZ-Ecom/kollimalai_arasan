import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { deliveryService } from "@/features/delivery/services/delivery.service";
import { orderStatusTransitionSchema } from "@/features/orders/validations/order.schema";

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

      const result = await deliveryService.adminMarkOutForDelivery(
        sessionUserId,
        uuid
      );

      return apiSuccess(result, "Order marked as out for delivery", 200);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: orderStatusTransitionSchema,
  }
);
