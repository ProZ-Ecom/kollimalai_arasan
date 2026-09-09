import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { variantImageService } from "@/features/variants/services/variant-image.service";
import {
  updateAdminVariantImageSchema,
  type UpdateAdminVariantImageInput,
} from "@/features/variants/validations/admin-variant-image.schema";

export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      const productUuid = context.params?.uuid;
      const variantUuid = context.params?.variantUuid;
      const imageUuid = context.params?.imageUuid;

      if (!productUuid || !variantUuid || !imageUuid) {
        throw ApiError.badRequest(
          "Product UUID, Variant UUID, and Image UUID are required"
        );
      }

      const body = context.body as UpdateAdminVariantImageInput;
      const adminEmail = context.session?.user?.email ?? undefined;

      const image = await variantImageService.updateAdminVariantImage(
        productUuid,
        variantUuid,
        imageUuid,
        body,
        adminEmail
      );

      return apiSuccess(image, "Variant image updated successfully");
    },
  },
  {
    method: "PUT",
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: updateAdminVariantImageSchema,
  }
);

export const DELETE = createApiHandler(
  {
    DELETE: async (_request, context) => {
      const productUuid = context.params?.uuid;
      const variantUuid = context.params?.variantUuid;
      const imageUuid = context.params?.imageUuid;

      if (!productUuid || !variantUuid || !imageUuid) {
        throw ApiError.badRequest(
          "Product UUID, Variant UUID, and Image UUID are required"
        );
      }

      const adminEmail = context.session?.user?.email ?? undefined;
      const result = await variantImageService.deleteAdminVariantImage(
        productUuid,
        variantUuid,
        imageUuid,
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
