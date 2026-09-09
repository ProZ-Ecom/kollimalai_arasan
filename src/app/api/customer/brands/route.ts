import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { catalogService } from "@/features/customers/services/catalog.service";
import {
  customerBrandListSchema,
  type CustomerBrandListInput,
} from "@/features/customers/validations/catalog.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = (context.body || {}) as CustomerBrandListInput;
      const result = await catalogService.getBrands(body);
      return apiSuccess(result.data, "Brands fetched successfully", 200, result.meta);
    },
  },
  {
    bodySchema: customerBrandListSchema,
  }
);
