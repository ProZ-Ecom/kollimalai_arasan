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
      const variantUuid = context.params?.variantUuid;
      if (!variantUuid || typeof variantUuid !== "string") {
        throw ApiError.badRequest("Invalid variant UUID");
      }

      const variant = await variantService.getVariantByUuid(variantUuid);
      return apiSuccess(variant, "Variant fetched successfully", 200);
    },
    PUT: async (_request, context) => {
      const variantUuid = context.params?.variantUuid;
      if (!variantUuid || typeof variantUuid !== "string") {
        throw ApiError.badRequest("Invalid variant UUID");
      }

      const body = context.body as UpdateAdminVariantInput;
      const adminEmail = context.session?.user?.email ?? undefined;

      const variant = await variantService.updateVariantByUuid(
        variantUuid,
        body,
        adminEmail
      );

      return apiSuccess(variant, "Variant updated successfully", 200);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: updateAdminVariantSchema,
  }
);
