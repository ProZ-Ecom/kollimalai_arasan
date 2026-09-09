import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiCreated } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { variantImageService } from "@/features/variants/services/variant-image.service";
import {
  createAdminVariantImagesSchema,
  type CreateAdminVariantImagesInput,
} from "@/features/variants/validations/admin-variant-image.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const productUuid = context.params?.uuid;
      const variantUuid = context.params?.variantUuid;
      if (!productUuid || !variantUuid) {
        throw ApiError.badRequest("Product UUID and Variant UUID are required");
      }

      const images = await variantImageService.getAdminVariantImages(
        productUuid,
        variantUuid
      );

      return apiSuccess(images, "Variant images fetched successfully");
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
      const variantUuid = context.params?.variantUuid;
      if (!productUuid || !variantUuid) {
        throw ApiError.badRequest("Product UUID and Variant UUID are required");
      }

      const body = context.body as CreateAdminVariantImagesInput;
      const adminEmail = context.session?.user?.email ?? undefined;

      const images = await variantImageService.createAdminVariantImages(
        productUuid,
        variantUuid,
        body,
        adminEmail
      );

      return apiCreated(images, "Variant images created successfully");
    },
  },
  {
    method: "POST",
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: createAdminVariantImagesSchema,
  }
);
