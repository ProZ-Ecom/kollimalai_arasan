import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiError } from "@/lib/api/api-response";
import { offerService } from "@/features/offers/services/offer.service";
import {
  offerStatusSchema,
  type OfferStatusInput,
} from "@/features/offers/validations/offer.schema";

export const PATCH = createApiHandler(
  {
    PATCH: async (_request, context) => {
      const id = context.params?.id;
      if (!id) return apiError("Offer ID is required", 400);
      const { isActive } = context.body as OfferStatusInput;
      const offer = await offerService.setOfferStatus(
        id,
        isActive,
        context.session?.user?.email ?? undefined
      );
      return apiSuccess(
        offer,
        `Offer ${isActive ? "activated" : "deactivated"} successfully`
      );
    },
  },
  {
    method: "PATCH",
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: offerStatusSchema,
  }
);
