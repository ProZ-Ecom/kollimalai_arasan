import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiError } from "@/lib/api/api-response";
import { productService } from "@/features/products/services/product.service";
import { updateProductSchema } from "@/features/products/validations/product.schema";

export const GET = createApiHandler({
  GET: async (_request, context) => {
    const id = context.params?.id;
    if (!id) return apiError("Product ID is required", 400);
    const product = await productService.getProduct(id);
    return apiSuccess(product, "Product fetched successfully");
  },
});

export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      const id = context.params?.id;
      if (!id) return apiError("Product ID is required", 400);
      const body = context.body as ReturnType<typeof updateProductSchema.parse>;
      const product = await productService.updateProduct(parseInt(id), body);
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
    await productService.deleteProduct(parseInt(id));
    return apiSuccess(null, "Product deleted successfully");
  },
}, {
  method: "DELETE",
  requireAuth: true,
  requiredRole: ["ADMIN", "STAFF"],
});
