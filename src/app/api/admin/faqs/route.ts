import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiCreated } from "@/lib/api/api-response";
import { faqService } from "@/features/faqs/services/faq.service";
import {
  createFaqSchema,
  faqListQuerySchema,
  type CreateFaqInput,
  type FaqListQueryInput,
} from "@/features/faqs/validations/faq.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as CreateFaqInput;
      const result = await faqService.createFaq(body, context.session?.user?.id);

      return apiCreated(result, "FAQ created successfully");
    },
  },
  {
    method: "POST",
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: createFaqSchema,
  }
);

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const query = (context.query || {}) as FaqListQueryInput;
      const result = await faqService.getFaqs(query);

      return apiSuccess(
        result.data,
        "FAQs fetched successfully",
        200,
        result.meta
      );
    },
  },
  {
    method: "GET",
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    querySchema: faqListQuerySchema,
  }
);
