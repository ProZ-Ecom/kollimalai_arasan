import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiError } from "@/lib/api/api-response";
import { offerService } from "@/features/offers/services/offer.service";
import {
  updateOfferSchema,
  type UpdateOfferSchemaOutput,
} from "@/features/offers/validations/offer.schema";

export const GET = createApiHandler({
  GET: async (_request, context) => {
    const id = context.params?.id;
    if (!id) return apiError("Offer ID is required", 400);
    const offer = await offerService.getOffer(id);
    return apiSuccess(offer, "Offer fetched successfully");
  },
});

export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      const id = context.params?.id;
      if (!id) return apiError("Offer ID is required", 400);
      const body = context.body as UpdateOfferSchemaOutput;
      const offer = await offerService.updateOffer(
        id,
        {
          ...body,
          startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
          endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
        },
        context.session?.user?.email ?? undefined
      );
      return apiSuccess(offer, "Offer updated successfully");
    },
  },
  {
    method: "PUT",
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: updateOfferSchema,
  }
);

export const DELETE = createApiHandler(
  {
    DELETE: async (_request, context) => {
      const id = context.params?.id;
      if (!id) return apiError("Offer ID is required", 400);
      await offerService.deleteOffer(id, context.session?.user?.email ?? undefined);
      return apiSuccess(null, "Offer deleted successfully");
    },
  },
  {
    method: "DELETE",
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
  }
);
