import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { bannerPositionService } from "@/features/banners/services/banner-position.service";
import {
  updateBannerPositionSchema,
  bannerPositionUuidParamSchema,
  type UpdateBannerPositionInput,
} from "@/features/banners/validations/banner-position.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const rawUuid = context.params?.uuid;
      const parsedParam = bannerPositionUuidParamSchema.safeParse({
        uuid: rawUuid,
      });

      if (!parsedParam.success) {
        throw ApiError.badRequest("Invalid banner position UUID format");
      }

      const result = await bannerPositionService.getBannerPositionByUuid(
        parsedParam.data.uuid
      );

      return apiSuccess(result, "Banner position fetched successfully", 200);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
  }
);

export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      const rawUuid = context.params?.uuid;
      const parsedParam = bannerPositionUuidParamSchema.safeParse({
        uuid: rawUuid,
      });

      if (!parsedParam.success) {
        throw ApiError.badRequest("Invalid banner position UUID format");
      }

      const body = context.body as UpdateBannerPositionInput;
      const sessionUserId = context.session?.user?.id;

      const result = await bannerPositionService.updateBannerPosition(
        parsedParam.data.uuid,
        body,
        sessionUserId
      );

      return apiSuccess(result, "Banner position updated successfully", 200);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: updateBannerPositionSchema,
  }
);
