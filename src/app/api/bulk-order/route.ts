import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { bulkOrderService } from "@/features/bulk-orders/services/bulk-order.service";
import {
  createBulkOrderSchema,
  type CreateBulkOrderInput,
} from "@/features/bulk-orders/validations/bulk-order.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as CreateBulkOrderInput;
      const result = await bulkOrderService.submitBulkOrderEnquiry(body);

      return apiSuccess(
        result,
        "Your bulk order enquiry has been submitted successfully. We will get back to you soon.",
        201
      );
    },
  },
  {
    requireAuth: false,
    bodySchema: createBulkOrderSchema,
  }
);
