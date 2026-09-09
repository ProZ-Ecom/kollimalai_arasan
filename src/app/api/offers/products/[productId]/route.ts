import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiError } from "@/lib/api/api-response";
import { offerService } from "@/features/offers/services/offer.service";

/** Offers configured against a product. Defaults to live offers only. */
export const GET = createApiHandler({
  GET: async (_request, context) => {
    const productId = context.params?.productId;
    if (!productId) return apiError("Product ID is required", 400);
    const activeOnly = context.searchParams?.get("all") !== "true";
    const offers = await offerService.getOffersForProduct(productId, activeOnly);
    return apiSuccess(offers, "Product offers fetched successfully");
  },
});
