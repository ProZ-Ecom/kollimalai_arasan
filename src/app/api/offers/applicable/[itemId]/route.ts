import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiError } from "@/lib/api/api-response";
import { offerService } from "@/features/offers/services/offer.service";

/**
 * The single best valid offer for a pack size, with the price it produces.
 * The price is always recomputed here from the stored base price - this is
 * the authority the storefront and cart quote from.
 */
export const GET = createApiHandler({
  GET: async (_request, context) => {
    const itemId = context.params?.itemId;
    if (!itemId) return apiError("Item ID is required", 400);

    const quantityParam = context.searchParams?.get("quantity");
    const cartValueParam = context.searchParams?.get("cartValue");

    const quantity = quantityParam ? Number(quantityParam) : 1;
    const cartValue = cartValueParam ? Number(cartValueParam) : undefined;

    if (!Number.isFinite(quantity) || quantity < 1) {
      return apiError("Quantity must be a positive number", 400);
    }

    const result = await offerService.getApplicableOffer(itemId, {
      quantity,
      cartValue: Number.isFinite(cartValue) ? cartValue : undefined,
    });

    return apiSuccess(result, "Applicable offer fetched successfully");
  },
});
