import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { faqService } from "@/features/faqs/services/faq.service";
import {
  publicFaqQuerySchema,
  type PublicFaqQueryInput,
} from "@/features/faqs/validations/faq.schema";

/**
 * Public storefront endpoint. Returns only ACTIVE FAQs, ordered by display
 * order, with the admin/audit columns stripped out by the repository formatter.
 */
export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      // This endpoint is unauthenticated, and the shared handler hands back the
      // raw params when a strict schema rejects them. Re-parse here so an
      // unexpected query string is dropped rather than passed through.
      const parsed = publicFaqQuerySchema.safeParse(context.query ?? {});
      const query: PublicFaqQueryInput = parsed.success ? parsed.data : {};

      const data = await faqService.getPublicFaqs(query);

      return apiSuccess(data, "FAQs fetched successfully", 200);
    },
  },
  {
    method: "GET",
    querySchema: publicFaqQuerySchema,
  }
);
