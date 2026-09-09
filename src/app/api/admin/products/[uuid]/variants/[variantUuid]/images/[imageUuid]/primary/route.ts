import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { variantImageService } from "@/features/variants/services/variant-image.service";

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

      const image = await variantImageService.setPrimaryVariantImage(
        productUuid,
        variantUuid,
        imageUuid
      );

      return apiSuccess(image, "Primary variant image updated successfully");
    },
  },
  {
    method: "PUT",
    requireAuth: true,
    requiredRole: ["ADMIN"],
  }
);
