import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { productImageService } from "@/features/products/services/product-image.service";

export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      const productUuid = context.params?.uuid;
      const imageId = context.params?.imageId;

      if (!productUuid || !imageId) {
        throw ApiError.badRequest("Product UUID and Image ID are required");
      }

      const image = await productImageService.setPrimaryProductImage(
        productUuid,
        imageId
      );

      return apiSuccess(image, "Primary product image updated successfully");
    },
  },
  {
    method: "PUT",
    requireAuth: true,
    requiredRole: ["ADMIN"],
  }
);
