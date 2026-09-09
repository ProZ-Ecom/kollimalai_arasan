import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { reviewService } from "@/features/reviews/services/review.service";
import {
  updateReviewSchema,
  reviewUuidParamSchema,
  type UpdateReviewInput,
} from "@/features/reviews/validations/review.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Authentication required");
      }

      const rawUuid = context.params?.uuid;
      const parsedParam = reviewUuidParamSchema.safeParse({ uuid: rawUuid });
      if (!parsedParam.success) {
        throw ApiError.badRequest("Invalid review UUID format");
      }

      const result = await reviewService.getCustomerReviewByUuid(
        sessionUserId,
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
    requiredRole: ["CUSTOMER"],
  }
);

export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Authentication required");
      }

      const rawUuid = context.params?.uuid;
      const parsedParam = reviewUuidParamSchema.safeParse({ uuid: rawUuid });
      if (!parsedParam.success) {
        throw ApiError.badRequest("Invalid review UUID format");
      }

      const body = context.body as UpdateReviewInput;
      const result = await reviewService.updateCustomerReview(
        sessionUserId,
        parsedParam.data.uuid,
        body
      );

      return apiSuccess(
        result,
        "Review updated successfully",
        200
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["CUSTOMER"],
    bodySchema: updateReviewSchema,
  }
);

export const DELETE = createApiHandler(
  {
    DELETE: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Authentication required");
      }

      const rawUuid = context.params?.uuid;
      const parsedParam = reviewUuidParamSchema.safeParse({ uuid: rawUuid });
      if (!parsedParam.success) {
        throw ApiError.badRequest("Invalid review UUID format");
      }

      await reviewService.deleteCustomerReview(
        sessionUserId,
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
    requiredRole: ["CUSTOMER"],
  }
);
