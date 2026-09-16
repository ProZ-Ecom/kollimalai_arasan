import { z } from "zod";
import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { catalogService } from "@/features/customers/services/catalog.service";

const trackSearchSchema = z.object({
  keyword: z.string().trim().min(1, "Keyword is required"),
  type: z.enum(["search", "product", "variant", "category"]).optional().default("search"),
  entityId: z.string().trim().optional(),
  resultsCount: z.number().int().min(0).optional(),
});

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = (context.body || {}) as z.infer<typeof trackSearchSchema>;

      await catalogService.trackSearchVisit(body);

      return apiSuccess(
        { tracked: true },
        "Search visit tracked successfully",
        200
      );
    },
  },
  {
    bodySchema: trackSearchSchema,
  }
);
