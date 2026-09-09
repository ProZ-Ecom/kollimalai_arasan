import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { deliveryService } from "@/features/delivery/services/delivery.service";
import {
  deliveryUuidParamSchema,
  markDeliveredSchema,
  type MarkDeliveredInput,
} from "@/features/delivery/validations/delivery.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Unauthorized");
      }

      const rawUuid = context.params?.uuid;
      const parsedParam = deliveryUuidParamSchema.safeParse({ uuid: rawUuid });
      if (!parsedParam.success) {
        throw ApiError.badRequest("Invalid delivery UUID format");
      }

      const body = (context.body || {}) as MarkDeliveredInput;
      const result = await deliveryService.markDelivered(
        sessionUserId,
        parsedParam.data.uuid,
        body
      );

      return apiSuccess(
        result,
        "Order delivered successfully",
        200
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["STAFF"],
    bodySchema: markDeliveredSchema,
  }
);
