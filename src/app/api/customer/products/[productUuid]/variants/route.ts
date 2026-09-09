import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { catalogService } from "@/features/customers/services/catalog.service";
import {
  customerVariantListSchema,
  uuidParamSchema,
  type CustomerVariantListInput,
} from "@/features/customers/validations/catalog.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const productUuid = context.params?.productUuid;
      if (!productUuid) {
        throw ApiError.badRequest("Product UUID is required");
      }

      const validProductUuid = uuidParamSchema.parse(productUuid);
      const body = (context.body || {}) as CustomerVariantListInput;

      const result = await catalogService.getVariants(validProductUuid, body);

      return apiSuccess(result.data, "Variants fetched successfully", 200, result.meta);
    },
  },
  {
    bodySchema: customerVariantListSchema,
  }
);
