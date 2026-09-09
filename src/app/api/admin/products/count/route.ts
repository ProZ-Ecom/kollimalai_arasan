import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { productService } from "@/features/products/services/product.service";
import {
  adminProductListSchema,
  type AdminProductListInput,
} from "@/features/products/validations/admin-product.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = (context.body || {}) as AdminProductListInput;
      const result = await productService.countAdminProducts(body);

      return apiSuccess(result, "Products count fetched successfully", 200);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: adminProductListSchema,
  }
);
