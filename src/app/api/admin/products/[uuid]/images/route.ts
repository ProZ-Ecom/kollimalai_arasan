import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiCreated } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { productImageService } from "@/features/products/services/product-image.service";
import {
  createAdminProductImagesSchema,
  type CreateAdminProductImagesInput,
} from "@/features/products/validations/admin-product-image.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const productUuid = context.params?.uuid;
      if (!productUuid) {
        throw ApiError.badRequest("Product UUID is required");
      }

      const images = await productImageService.getAdminProductImages(productUuid);

      return apiSuccess(images, "Product images fetched successfully");
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
  }
);

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const productUuid = context.params?.uuid;
      if (!productUuid) {
        throw ApiError.badRequest("Product UUID is required");
      }

      const body = context.body as CreateAdminProductImagesInput;
      const adminEmail = context.session?.user?.email ?? undefined;

      const images = await productImageService.createAdminProductImages(
        productUuid,
        body,
        adminEmail
      );

      return apiCreated(images, "Product images created successfully");
    },
  },
  {
    method: "POST",
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: createAdminProductImagesSchema,
  }
);
