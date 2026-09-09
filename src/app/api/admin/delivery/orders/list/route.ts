import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { deliveryService } from "@/features/delivery/services/delivery.service";
import {
  adminDeliveryOrdersListSchema,
  type AdminDeliveryOrdersListInput,
} from "@/features/delivery/validations/delivery.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = (context.body || {}) as AdminDeliveryOrdersListInput;
      const result = await deliveryService.getAdminDeliveryOrders(body);

      return apiSuccess(
        result.data,
        "Delivery orders fetched successfully",
        200,
        result.meta
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: adminDeliveryOrdersListSchema,
  }
);
