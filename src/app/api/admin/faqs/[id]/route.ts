import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { faqService } from "@/features/faqs/services/faq.service";
import {
  faqIdParamSchema,
  updateFaqSchema,
  type UpdateFaqInput,
} from "@/features/faqs/validations/faq.schema";

function parseFaqId(rawId: string | undefined): number {
  const parsed = faqIdParamSchema.safeParse({ id: rawId });
  if (!parsed.success) {
    throw ApiError.badRequest("Invalid FAQ id");
  }
  return parsed.data.id;
}

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const id = parseFaqId(context.params?.id);
      const result = await faqService.getFaqById(id);

      return apiSuccess(result, "FAQ fetched successfully", 200);
    },
  },
  {
    method: "GET",
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
  }
);

export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      const id = parseFaqId(context.params?.id);
      const body = context.body as UpdateFaqInput;
      const result = await faqService.updateFaq(
        id,
        body,
        context.session?.user?.id
      );

      return apiSuccess(result, "FAQ updated successfully", 200);
    },
  },
  {
    method: "PUT",
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: updateFaqSchema,
  }
);

export const DELETE = createApiHandler(
  {
    DELETE: async (_request, context) => {
      const id = parseFaqId(context.params?.id);
      await faqService.deleteFaq(id);

      return apiSuccess(null, "FAQ deleted successfully", 200);
    },
  },
  {
    method: "DELETE",
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
  }
);
