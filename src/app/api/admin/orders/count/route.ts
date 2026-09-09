import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { orderService } from "@/features/orders/services/order.service";
import {
  adminOrdersListSchema,
  type AdminOrdersListInput,
} from "@/features/orders/validations/order.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = (context.body || {}) as AdminOrdersListInput;
      const result = await orderService.countAdminOrders(body);

      return apiSuccess(result, "Orders count fetched successfully", 200);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: adminOrdersListSchema,
  }
);
