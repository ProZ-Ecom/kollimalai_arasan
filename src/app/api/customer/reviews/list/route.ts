import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { reviewService } from "@/features/reviews/services/review.service";
import {
  customerReviewListSchema,
  type CustomerReviewListInput,
} from "@/features/reviews/validations/review.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Authentication required");
      }

      const body = (context.body || {}) as CustomerReviewListInput;
      const result = await reviewService.getCustomerReviews(
        sessionUserId,
        body
      );

      return apiSuccess(
        result.data,
        "Customer reviews fetched successfully",
        200,
        result.meta
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["CUSTOMER"],
    bodySchema: customerReviewListSchema,
  }
);
