import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { bulkOrderService } from "@/features/bulk-orders/services/bulk-order.service";
import { bulkOrderUuidParamSchema } from "@/features/bulk-orders/validations/bulk-order.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const rawUuid = context.params?.uuid;
      const parsedParam = bulkOrderUuidParamSchema.safeParse({ uuid: rawUuid });
      if (!parsedParam.success) {
        throw ApiError.badRequest("Invalid Bulk Order Enquiry UUID format");
      }

      const result = await bulkOrderService.getAdminBulkOrderByUuid(
        parsedParam.data.uuid
      );

      return apiSuccess(result, "Bulk order enquiry fetched successfully", 200);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
  }
);
