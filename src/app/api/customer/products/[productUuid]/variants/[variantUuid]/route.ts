import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { catalogService } from "@/features/customers/services/catalog.service";
import { uuidParamSchema } from "@/features/customers/validations/catalog.schema";

export const GET = createApiHandler({
  GET: async (_request, context) => {
    const productUuid = context.params?.productUuid;
    const variantUuid = context.params?.variantUuid;

    if (!productUuid || !variantUuid) {
      throw ApiError.badRequest("Product UUID and Variant UUID are required");
    }

    const validProductUuid = uuidParamSchema.parse(productUuid);
    const validVariantUuid = uuidParamSchema.parse(variantUuid);

    const variant = await catalogService.getVariantByUuids(
      validProductUuid,
      validVariantUuid
    );

    return apiSuccess(variant, "Variant fetched successfully", 200);
  },
});
