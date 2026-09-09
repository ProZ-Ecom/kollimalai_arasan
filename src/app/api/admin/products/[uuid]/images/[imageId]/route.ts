import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { productImageService } from "@/features/products/services/product-image.service";
import {
  updateAdminProductImageSchema,
  type UpdateAdminProductImageInput,
} from "@/features/products/validations/admin-product-image.schema";

export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      const productUuid = context.params?.uuid;
      const imageId = context.params?.imageId;

      if (!productUuid || !imageId) {
        throw ApiError.badRequest("Product UUID and Image ID are required");
      }

      const body = context.body as UpdateAdminProductImageInput;
      const adminEmail = context.session?.user?.email ?? undefined;

      const image = await productImageService.updateAdminProductImage(
        productUuid,
        imageId,
        body,
        adminEmail
      );

      return apiSuccess(image, "Product image updated successfully");
    },
  },
  {
    method: "PUT",
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: updateAdminProductImageSchema,
  }
);

export const DELETE = createApiHandler(
  {
    DELETE: async (_request, context) => {
      const productUuid = context.params?.uuid;
      const imageId = context.params?.imageId;

      if (!productUuid || !imageId) {
        throw ApiError.badRequest("Product UUID and Image ID are required");
      }

      const adminEmail = context.session?.user?.email ?? undefined;
      const result = await productImageService.deleteAdminProductImage(
        productUuid,
        imageId,
        adminEmail
      );

      return apiSuccess(null, result.message);
    },
  },
  {
    method: "DELETE",
    requireAuth: true,
    requiredRole: ["ADMIN"],
  }
);
