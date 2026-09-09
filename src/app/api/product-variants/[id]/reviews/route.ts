import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { reviewService } from "@/features/reviews/services/review.service";
import {
  publicReviewQuerySchema,
  type PublicReviewQueryInput,
} from "@/features/reviews/validations/review.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const identifier = context.params?.id;
      if (!identifier) {
        throw ApiError.badRequest("Product variant identifier is required");
      }

      const query = (context.query || {}) as PublicReviewQueryInput;
      const result = await reviewService.getPublicVariantReviews(
        identifier,
        query
      );

      return apiSuccess(
        {
          variant: result.variant,
          reviews: result.reviews,
          ratingSummary: result.ratingSummary,
        },
        "Variant reviews fetched successfully",
        200,
        result.meta
      );
    },
  },
  {
    requireAuth: false,
    querySchema: publicReviewQuerySchema,
  }
);
