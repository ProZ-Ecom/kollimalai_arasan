import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiCreated } from "@/lib/api/api-response";
import { offerService } from "@/features/offers/services/offer.service";
import {
  getOffersQuerySchema,
  createOfferSchema,
  type GetOffersQueryInput,
  type CreateOfferSchemaOutput,
} from "@/features/offers/validations/offer.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const query = context.query as GetOffersQueryInput;
      const result = await offerService.getOffers(query);
      return apiSuccess(result.data, "Offers fetched successfully", 200, result.meta);
    },
  },
  { querySchema: getOffersQuerySchema }
);

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as CreateOfferSchemaOutput;
      const offer = await offerService.createOffer(
        body,
        context.session?.user?.email ?? undefined
      );
      return apiCreated(offer, "Offer created successfully");
    },
  },
  {
    method: "POST",
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: createOfferSchema,
  }
);
