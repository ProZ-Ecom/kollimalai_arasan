import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { variantService } from "@/features/variants/services/variant.service";
import {
  updateAdminVariantSchema,
  type UpdateAdminVariantInput,
} from "@/features/variants/validations/admin-variant.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const productUuid = context.params?.uuid;
      const variantUuid = context.params?.variantUuid;
      if (!productUuid || !variantUuid) {
        throw ApiError.badRequest("Product UUID and Variant UUID are required");
      }

      const variant = await variantService.getAdminVariantByUuid(
        productUuid,
        variantUuid
      );
      return apiSuccess(variant, "Variant fetched successfully");
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
  }
);

export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      const productUuid = context.params?.uuid;
      const variantUuid = context.params?.variantUuid;
      if (!productUuid || !variantUuid) {
        throw ApiError.badRequest("Product UUID and Variant UUID are required");
      }

      const body = context.body as UpdateAdminVariantInput;
      const adminEmail = context.session?.user?.email ?? undefined;

      const variant = await variantService.updateAdminVariant(
        productUuid,
        variantUuid,
        body,
        adminEmail
      );

      return apiSuccess(variant, "Variant updated successfully");
    },
  },
  {
    method: "PUT",
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: updateAdminVariantSchema,
  }
);

export const DELETE = createApiHandler(
  {
    DELETE: async (_request, context) => {
      const productUuid = context.params?.uuid;
      const variantUuid = context.params?.variantUuid;
      if (!productUuid || !variantUuid) {
        throw ApiError.badRequest("Product UUID and Variant UUID are required");
      }

      const adminEmail = context.session?.user?.email ?? undefined;
      const result = await variantService.deleteAdminVariant(
        productUuid,
        variantUuid,
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
