import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { bulkOrderService } from "@/features/bulk-orders/services/bulk-order.service";
import {
  adminBulkOrderListSchema,
  type AdminBulkOrderListInput,
} from "@/features/bulk-orders/validations/bulk-order.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = (context.body || {}) as AdminBulkOrderListInput;
      const result = await bulkOrderService.getAdminBulkOrders(body);

      return apiSuccess(
        result.data,
        "Bulk order enquiries fetched successfully",
        200,
        result.meta
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: adminBulkOrderListSchema,
  }
);
