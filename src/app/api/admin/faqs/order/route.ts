import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { faqService } from "@/features/faqs/services/faq.service";
import {
  updateFaqOrderSchema,
  type UpdateFaqOrderInput,
} from "@/features/faqs/validations/faq.schema";

/**
 * Static segment, so it is matched ahead of `/api/admin/faqs/[id]` and never
 * reaches that handler as an id.
 */
export const PATCH = createApiHandler(
  {
    PATCH: async (_request, context) => {
      const body = context.body as UpdateFaqOrderInput;
      await faqService.updateFaqOrder(body, context.session?.user?.id);

      return apiSuccess(null, "FAQ order updated successfully", 200);
    },
  },
  {
    method: "PATCH",
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: updateFaqOrderSchema,
  }
);
