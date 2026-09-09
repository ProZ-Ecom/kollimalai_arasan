import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { variantUnitPriceService } from "@/features/variants/services/variant-unit-price.service";
import {
  updateVariantUnitPriceSchema,
  type UpdateVariantUnitPriceInput,
} from "@/features/variants/validations/admin-variant-unit-price.schema";

export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      const variantUuid = context.params?.variantUuid;
      const unitPriceUuid = context.params?.unitPriceUuid;

      if (!variantUuid || !unitPriceUuid) {
        throw ApiError.badRequest("Variant UUID and Unit Price UUID are required");
      }

      const body = context.body as UpdateVariantUnitPriceInput;
      const adminEmail = context.session?.user?.email ?? undefined;

      const unitPrice = await variantUnitPriceService.updateUnitPrice(
        variantUuid,
        unitPriceUuid,
        body,
        adminEmail
      );

      return apiSuccess(unitPrice, "Variant unit price updated successfully");
    },
  },
  {
    method: "PUT",
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: updateVariantUnitPriceSchema,
  }
);

export const DELETE = createApiHandler(
  {
    DELETE: async (_request, context) => {
      const variantUuid = context.params?.variantUuid;
      const unitPriceUuid = context.params?.unitPriceUuid;

      if (!variantUuid || !unitPriceUuid) {
        throw ApiError.badRequest("Variant UUID and Unit Price UUID are required");
      }

      const adminEmail = context.session?.user?.email ?? undefined;
      const result = await variantUnitPriceService.deleteUnitPrice(
        variantUuid,
        unitPriceUuid,
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
