import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { inventoryService } from "@/features/inventory/services/inventory.service";

export const GET = createApiHandler({
  GET: async (request, context) => {
    const id = Number(context.params?.id);
    const searchParams = context.searchParams;
    const page = searchParams?.get("page") ? Number(searchParams.get("page")) : 1;
    const limit = searchParams?.get("limit") ? Number(searchParams.get("limit")) : 20;
    const type = searchParams?.get("type") || undefined;

    const result = await inventoryService.getTransactions(id, {
      page,
      limit,
      type,
    });
    return apiSuccess(result);
  },
});
