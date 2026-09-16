import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { productService } from "@/features/products/services/product.service";
import {
  bulkDeleteAdminProductsSchema,
  type BulkDeleteAdminProductsInput,
} from "@/features/products/validations/admin-product.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as BulkDeleteAdminProductsInput;
      const adminEmail = context.session?.user?.email ?? undefined;

      const result = await productService.bulkDeleteAdminProducts(
        body.ids,
        adminEmail
      );

      return apiSuccess(result, result.message, 200);
    },
  },
  {
    method: "POST",
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: bulkDeleteAdminProductsSchema,
  }
);
