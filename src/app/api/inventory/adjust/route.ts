import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { inventoryService } from "@/features/inventory/services/inventory.service";
import { adjustStockSchema } from "@/features/inventory/validations/inventory.schema";

export const POST = createApiHandler({
  POST: async (_request, context) => {
    const input = adjustStockSchema.parse(context.body);
    const result = await inventoryService.adjustStock(input);
    return apiSuccess(result);
  },
}, { requireAuth: true, requiredRole: ["ADMIN", "STAFF"] });
