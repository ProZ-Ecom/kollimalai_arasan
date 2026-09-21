import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiError } from "@/lib/api/api-response";
import { productService } from "@/features/products/services/product.service";
import { updateProductSchema } from "@/features/products/validations/product.schema";

export const GET = createApiHandler({
  GET: async (_request, context) => {
    const id = context.params?.id;
    if (!id) return apiError("Product ID is required", 400);
    const product = await productService.getAdminProductByUuid(id);
    return apiSuccess(product, "Product fetched successfully");
  },
});

export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      const id = context.params?.id;
      if (!id) return apiError("Product ID is required", 400);
      const body = context.body as any;
      const adminEmail = context.session?.user?.email ?? undefined;
      const product = await productService.updateAdminProduct(id, body, adminEmail);
      return apiSuccess(product, "Product updated successfully");
    },
  },
  {
    method: "PUT",
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: updateProductSchema,
  }
);

export const DELETE = createApiHandler({
  DELETE: async (_request, context) => {
    const id = context.params?.id;
    if (!id) return apiError("Product ID is required", 400);
    const adminEmail = context.session?.user?.email ?? undefined;
    await productService.deleteAdminProduct(id, adminEmail);
    return apiSuccess(null, "Product deleted successfully");
  },
}, {
  method: "DELETE",
  requireAuth: true,
  requiredRole: ["ADMIN", "STAFF"],
});
