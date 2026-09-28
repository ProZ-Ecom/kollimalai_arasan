import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { inventoryService } from "@/features/inventory/services/inventory.service";

export const GET = createApiHandler({
  GET: async (request, context) => {
    const unitPriceUuid = context.searchParams?.get("unitPriceUuid");
    if (!unitPriceUuid) {
      throw ApiError.badRequest("unitPriceUuid is required");
    }
    const item = await inventoryService.getOrCreateByUnitPriceUuid(unitPriceUuid);
    return apiSuccess(item, "Inventory item fetched successfully");
  },
});
