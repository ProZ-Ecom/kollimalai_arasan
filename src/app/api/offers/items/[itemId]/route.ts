import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiError } from "@/lib/api/api-response";
import { offerService } from "@/features/offers/services/offer.service";

/**
 * Every offer that reaches this pack size - both the item-level offers naming
 * it and the product-level offers covering its product.
 */
export const GET = createApiHandler({
  GET: async (_request, context) => {
    const itemId = context.params?.itemId;
    if (!itemId) return apiError("Item ID is required", 400);
    const activeOnly = context.searchParams?.get("all") !== "true";
    const offers = await offerService.getOffersForItem(itemId, activeOnly);
    return apiSuccess(offers, "Item offers fetched successfully");
  },
});
