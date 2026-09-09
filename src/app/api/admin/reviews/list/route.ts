import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { reviewService } from "@/features/reviews/services/review.service";
import {
  adminReviewListSchema,
  type AdminReviewListInput,
} from "@/features/reviews/validations/review.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = (context.body || {}) as AdminReviewListInput;
      const result = await reviewService.getAdminReviews(body);

      return apiSuccess(
        result.data,
        "Reviews fetched successfully",
        200,
        result.meta
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: adminReviewListSchema,
  }
);
