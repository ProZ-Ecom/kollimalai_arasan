import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { faqService } from "@/features/faqs/services/faq.service";

/** Distinct categories already in use — feeds the admin category filter. */
export const GET = createApiHandler(
  {
    GET: async () => {
      const categories = await faqService.getCategories();

      return apiSuccess(categories, "FAQ categories fetched successfully", 200);
    },
  },
  {
    method: "GET",
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
  }
);
