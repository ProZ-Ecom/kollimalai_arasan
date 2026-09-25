import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { inventoryService } from "@/features/inventory/services/inventory.service";

export const GET = createApiHandler({
  GET: async () => {
    const stats = await inventoryService.getStats();
    return apiSuccess(stats);
  },
});
