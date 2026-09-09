import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { bannerService } from "@/features/banners/services/banner.service";
import {
  updateBannerSchema,
  bannerUuidParamSchema,
  type UpdateBannerInput,
} from "@/features/banners/validations/banner.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const rawUuid = context.params?.uuid;
      const parsedParam = bannerUuidParamSchema.safeParse({
        uuid: rawUuid,
      });

      if (!parsedParam.success) {
        throw ApiError.badRequest("Invalid banner UUID format");
      }

      const result = await bannerService.getBannerByUuid(parsedParam.data.uuid);

      return apiSuccess(result, "Banner fetched successfully", 200);
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
      const parsedParam = bannerUuidParamSchema.safeParse({
        uuid: rawUuid,
      });

      if (!parsedParam.success) {
        throw ApiError.badRequest("Invalid banner UUID format");
      }

      const body = context.body as UpdateBannerInput;
      const sessionUserId = context.session?.user?.id;

      const result = await bannerService.updateBanner(
        parsedParam.data.uuid,
        body,
        sessionUserId
      );

      return apiSuccess(result, "Banner updated successfully", 200);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: updateBannerSchema,
  }
);

export const DELETE = createApiHandler(
  {
    DELETE: async (_request, context) => {
      const rawUuid = context.params?.uuid;
      const parsedParam = bannerUuidParamSchema.safeParse({
        uuid: rawUuid,
      });

      if (!parsedParam.success) {
        throw ApiError.badRequest("Invalid banner UUID format");
      }

      await bannerService.deleteBanner(parsedParam.data.uuid);

      return apiSuccess(null, "Banner deleted successfully", 200);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
  }
);
