import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { catalogService } from "@/features/customers/services/catalog.service";
import { uuidParamSchema } from "@/features/customers/validations/catalog.schema";

export const GET = createApiHandler({
  GET: async (_request, context) => {
    const uuid = context.params?.uuid;
    if (!uuid) {
      throw ApiError.badRequest("Brand UUID is required");
    }

    const validUuid = uuidParamSchema.parse(uuid);
    const brand = await catalogService.getBrandByUuid(validUuid);

    return apiSuccess(brand, "Brand fetched successfully", 200);
  },
});
