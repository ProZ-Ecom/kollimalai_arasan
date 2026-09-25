import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { inventoryService } from "@/features/inventory/services/inventory.service";
import { adjustStockSchema } from "@/features/inventory/validations/inventory.schema";

export const POST = createApiHandler(
  {
    POST: async (request, context) => {
      const body = context.body ?? (await request.json().catch(() => ({})));
      const input = adjustStockSchema.parse(body);
      const result = await inventoryService.adjustStock(input);
      return apiSuccess(result);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: adjustStockSchema,
  }
);

