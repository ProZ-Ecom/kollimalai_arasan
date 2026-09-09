import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { catalogService } from "@/features/customers/services/catalog.service";
import {
  customerGlobalVariantListSchema,
  type CustomerGlobalVariantListInput,
} from "@/features/customers/validations/catalog.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = (context.body || {}) as CustomerGlobalVariantListInput;
      const result = await catalogService.getGlobalVariants(body);

      return apiSuccess(result.data, "Variants fetched successfully", 200, result.meta);
    },
  },
  {
    bodySchema: customerGlobalVariantListSchema,
  }
);
