import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { deliveryService } from "@/features/delivery/services/delivery.service";
import {
  assignDeliverySchema,
  type AssignDeliveryInput,
} from "@/features/delivery/validations/delivery.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as AssignDeliveryInput;
      const adminEmail = context.session?.user?.email;
      const result = await deliveryService.assignDelivery(body, adminEmail);

      return apiSuccess(
        result,
        "Delivery assigned successfully",
        201
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: assignDeliverySchema,
  }
);
