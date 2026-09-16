import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { categoryService } from "@/features/categories/services/category.service";
import {
  bulkDeleteAdminCategoriesSchema,
  type BulkDeleteAdminCategoriesInput,
} from "@/features/categories/validations/admin-category.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as BulkDeleteAdminCategoriesInput;
      const adminEmail = context.session?.user?.email ?? undefined;

      const rawItems = [...(body.ids ?? []), ...(body.uuids ?? [])];
      const validItems = rawItems.filter(
        (item): item is string | number =>
          item !== null && item !== undefined && item !== ""
      );

      const result = await categoryService.bulkDeleteAdminCategories(
        validItems,
        adminEmail
      );

      return apiSuccess(result, result.message, 200);
    },
  },

  {
    method: "POST",
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: bulkDeleteAdminCategoriesSchema,
  }
);
