import { z } from "zod";
import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { catalogService } from "@/features/customers/services/catalog.service";

const popularQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).optional().default(10),
});

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const query = (context.query || {}) as { limit?: number };
      const limit = query.limit ?? 10;
      const result = await catalogService.getPopularSearchesAndCategories(limit);

      return apiSuccess(
        result,
        "Popular searches and categories fetched successfully",
        200
      );
    },
  },
  {
    querySchema: popularQuerySchema,
  }
);
