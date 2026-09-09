import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { catalogService } from "@/features/customers/services/catalog.service";
import {
  customerRelatedProductsQuerySchema,
  uuidParamSchema,
  type CustomerRelatedProductsQueryInput,
} from "@/features/customers/validations/catalog.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const productUuid = context.params?.productUuid;
      if (!productUuid) {
        throw ApiError.badRequest("Product UUID is required");
      }

      const validProductUuid = uuidParamSchema.parse(productUuid);
      const query = context.query as CustomerRelatedProductsQueryInput;

      const products = await catalogService.getRelatedProducts(
        validProductUuid,
        query?.limit ?? 8
      );

      return apiSuccess(products, "Related products fetched successfully", 200);
    },
  },
  {
    querySchema: customerRelatedProductsQuerySchema,
  }
);
