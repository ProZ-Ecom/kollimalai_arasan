import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { categoryService } from "@/features/categories/services/category.service";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const uuid = context.params?.uuid;
      if (!uuid) {
        throw ApiError.badRequest("Category UUID is required");
      }

      const adminEmail = context.session?.user?.email ?? undefined;
      const result = await categoryService.restoreAdminCategory(uuid, adminEmail);

      return apiSuccess(null, result.message);
    },
  },
  {
    method: "POST",
    requireAuth: true,
    requiredRole: ["ADMIN"],
  }
);
