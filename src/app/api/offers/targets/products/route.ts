import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { offerService } from "@/features/offers/services/offer.service";
import {
  offerTargetQuerySchema,
  type OfferTargetQueryInput,
} from "@/features/offers/validations/offer.schema";

/** Products for the offer form's Category -> Product dropdown. */
export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const query = context.query as OfferTargetQueryInput;
      const products = await offerService.getSelectableProducts(query);
      return apiSuccess(products, "Products fetched successfully");
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    querySchema: offerTargetQuerySchema,
  }
);
