import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { offerService } from "@/features/offers/services/offer.service";
import {
  offerTargetQuerySchema,
  type OfferTargetQueryInput,
} from "@/features/offers/validations/offer.schema";

/**
 * Sellable pack sizes for the offer form's Product -> Item dropdown, with the
 * SKU, price and stock the admin needs to choose between them.
 */
export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const query = context.query as OfferTargetQueryInput;
      const items = await offerService.getSelectableItems(query);
      return apiSuccess(items, "Items fetched successfully");
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    querySchema: offerTargetQuerySchema,
  }
);
