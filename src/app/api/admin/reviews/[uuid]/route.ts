import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { reviewService } from "@/features/reviews/services/review.service";
import { reviewUuidParamSchema } from "@/features/reviews/validations/review.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const rawUuid = context.params?.uuid;
      const parsedParam = reviewUuidParamSchema.safeParse({ uuid: rawUuid });
      if (!parsedParam.success) {
        throw ApiError.badRequest("Invalid review UUID format");
      }

      const result = await reviewService.getAdminReviewByUuid(
        parsedParam.data.uuid
      );

      return apiSuccess(
        result,
        "Review details fetched successfully",
        200
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
  }
);

export const DELETE = createApiHandler(
  {
    DELETE: async (_request, context) => {
      const adminSessionUserId = context.session?.user?.id;
      if (!adminSessionUserId) {
        throw ApiError.unauthorized("Authentication required");
      }

      const rawUuid = context.params?.uuid;
      const parsedParam = reviewUuidParamSchema.safeParse({ uuid: rawUuid });
      if (!parsedParam.success) {
        throw ApiError.badRequest("Invalid review UUID format");
      }

      await reviewService.deleteAdminReview(
        adminSessionUserId,
        parsedParam.data.uuid
      );

      return apiSuccess(
        null,
        "Review deleted successfully",
        200
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
  }
);
