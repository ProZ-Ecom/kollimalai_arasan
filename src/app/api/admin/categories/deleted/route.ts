import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { categoryService } from "@/features/categories/services/category.service";

export const GET = createApiHandler(
  {
    GET: async (request, _context) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get("page") ?? 1);
      const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
      const search = url.searchParams.get("search")?.trim() || undefined;

      const result = await categoryService.getDeletedAdminCategories({ page, pageSize, search });

      return apiSuccess(result.data, "Deleted categories fetched successfully", 200, result.meta);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
  }
);
