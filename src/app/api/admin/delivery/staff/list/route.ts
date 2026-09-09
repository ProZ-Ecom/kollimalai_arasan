import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { deliveryService } from "@/features/delivery/services/delivery.service";
import {
  adminDeliveryStaffListSchema,
  type AdminDeliveryStaffListInput,
} from "@/features/delivery/validations/delivery.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = (context.body || {}) as AdminDeliveryStaffListInput;
      const result = await deliveryService.getAdminDeliveryStaff(body);

      return apiSuccess(
        result.data,
        "Delivery staff fetched successfully",
        200,
        result.meta
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: adminDeliveryStaffListSchema,
  }
);
