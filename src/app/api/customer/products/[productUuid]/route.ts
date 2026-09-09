import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { catalogService } from "@/features/customers/services/catalog.service";
import { uuidParamSchema } from "@/features/customers/validations/catalog.schema";

export const GET = createApiHandler({
  GET: async (_request, context) => {
    const productUuid = context.params?.productUuid || context.params?.uuid;
    if (!productUuid) {
      throw ApiError.badRequest("Product UUID is required");
    }

    const validUuid = uuidParamSchema.parse(productUuid);
    const product = await catalogService.getProductByUuid(validUuid);

    return apiSuccess(product, "Product fetched successfully", 200);
  },
});
