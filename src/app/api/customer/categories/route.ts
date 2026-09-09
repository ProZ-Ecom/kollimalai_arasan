import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { catalogService } from "@/features/customers/services/catalog.service";
import {
  customerCategoryListSchema,
  type CustomerCategoryListInput,
} from "@/features/customers/validations/catalog.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = (context.body || {}) as CustomerCategoryListInput;
      const result = await catalogService.getCategories(body);
      return apiSuccess(result.data, "Categories fetched successfully", 200, result.meta);
    },
  },
  {
    bodySchema: customerCategoryListSchema,
  }
);
