import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { reviewService } from "@/features/reviews/services/review.service";
import {
  createReviewSchema,
  type CreateReviewInput,
} from "@/features/reviews/validations/review.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Authentication required");
      }

      const body = context.body as CreateReviewInput;
      const result = await reviewService.createCustomerReview(
        sessionUserId,
        body
      );

      return apiSuccess(
        result,
        "Review submitted successfully",
        201
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["CUSTOMER"],
    bodySchema: createReviewSchema,
  }
);
