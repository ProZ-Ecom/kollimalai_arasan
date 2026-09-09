import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { faqService } from "@/features/faqs/services/faq.service";
import {
  faqIdParamSchema,
  updateFaqStatusSchema,
  type UpdateFaqStatusInput,
} from "@/features/faqs/validations/faq.schema";

export const PATCH = createApiHandler(
  {
    PATCH: async (_request, context) => {
      const parsedParam = faqIdParamSchema.safeParse({
        id: context.params?.id,
      });

      if (!parsedParam.success) {
        throw ApiError.badRequest("Invalid FAQ id");
      }

      const body = context.body as UpdateFaqStatusInput;
      const result = await faqService.updateFaqStatus(
        parsedParam.data.id,
        body,
        context.session?.user?.id
      );

      return apiSuccess(result, "FAQ status updated successfully", 200);
    },
  },
  {
    method: "PATCH",
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: updateFaqStatusSchema,
  }
);
