import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { bulkOrderService } from "@/features/bulk-orders/services/bulk-order.service";
import {
  bulkOrderUuidParamSchema,
  updateBulkOrderStatusSchema,
  type UpdateBulkOrderStatusInput,
} from "@/features/bulk-orders/validations/bulk-order.schema";

export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      const rawUuid = context.params?.uuid;
      const parsedParam = bulkOrderUuidParamSchema.safeParse({ uuid: rawUuid });
      if (!parsedParam.success) {
        throw ApiError.badRequest("Invalid Bulk Order Enquiry UUID format");
      }

      const body = context.body as UpdateBulkOrderStatusInput;
      const adminEmail = context.session?.user?.email;

      const result = await bulkOrderService.updateBulkOrderStatus(
        parsedParam.data.uuid,
        body.status,
        adminEmail,
        body.comment
      );

      return apiSuccess(
        result,
        "Bulk order enquiry status updated successfully",
        200
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: updateBulkOrderStatusSchema,
  }
);
