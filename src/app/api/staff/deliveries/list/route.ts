import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { deliveryService } from "@/features/delivery/services/delivery.service";
import {
  staffDeliveryListSchema,
  type StaffDeliveryListInput,
} from "@/features/delivery/validations/delivery.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Unauthorized");
      }

      const body = (context.body || {}) as StaffDeliveryListInput;
      const result = await deliveryService.getStaffDeliveries(
        sessionUserId,
        body
      );

      return apiSuccess(
        result.data,
        "Staff deliveries fetched successfully",
        200,
        result.meta
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["STAFF","ADMIN"],
    bodySchema: staffDeliveryListSchema,
  }
);
