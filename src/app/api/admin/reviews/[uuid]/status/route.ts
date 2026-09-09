import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { reviewService } from "@/features/reviews/services/review.service";
import {
  moderateReviewSchema,
  reviewUuidParamSchema,
  type ModerateReviewInput,
} from "@/features/reviews/validations/review.schema";

export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      const adminSessionUserId = context.session?.user?.id;
      if (!adminSessionUserId) {
        throw ApiError.unauthorized("Authentication required");
      }

      const rawUuid = context.params?.uuid;
      const parsedParam = reviewUuidParamSchema.safeParse({ uuid: rawUuid });
      if (!parsedParam.success) {
        throw ApiError.badRequest("Invalid review UUID format");
      }

      const body = context.body as ModerateReviewInput;
      const result = await reviewService.moderateReview(
        adminSessionUserId,
        parsedParam.data.uuid,
        body
      );

      return apiSuccess(
        result,
        "Review status updated successfully",
        200
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: moderateReviewSchema,
  }
);
