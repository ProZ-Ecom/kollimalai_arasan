import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiCreated } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { variantUnitPriceService } from "@/features/variants/services/variant-unit-price.service";
import {
  createVariantUnitPriceSchema,
  type CreateVariantUnitPriceInput,
} from "@/features/variants/validations/admin-variant-unit-price.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const variantUuid = context.params?.variantUuid;
      if (!variantUuid || typeof variantUuid !== "string") {
        throw ApiError.badRequest("Invalid variant UUID");
      }

      const unitPrices = await variantUnitPriceService.listByVariantUuid(variantUuid);

      return apiSuccess(unitPrices, "Variant unit prices fetched successfully");
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
  }
);

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const variantUuid = context.params?.variantUuid;
      if (!variantUuid || typeof variantUuid !== "string") {
        throw ApiError.badRequest("Invalid variant UUID");
      }

      const body = context.body as CreateVariantUnitPriceInput;
      const adminEmail = context.session?.user?.email ?? undefined;

      const unitPrice = await variantUnitPriceService.createUnitPrice(
        variantUuid,
        body,
        adminEmail
      );

      return apiCreated(unitPrice, "Variant unit price created successfully");
    },
  },
  {
    method: "POST",
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: createVariantUnitPriceSchema,
  }
);
