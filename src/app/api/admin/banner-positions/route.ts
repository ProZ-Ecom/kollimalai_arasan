import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { bannerPositionService } from "@/features/banners/services/banner-position.service";
import {
  createBannerPositionSchema,
  bannerPositionListQuerySchema,
  type CreateBannerPositionInput,
  type BannerPositionListQueryInput,
} from "@/features/banners/validations/banner-position.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as CreateBannerPositionInput;
      const sessionUserId = context.session?.user?.id;
      const result = await bannerPositionService.createBannerPosition(
        body,
        sessionUserId
      );

      return apiSuccess(result, "Banner position created successfully", 200);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: createBannerPositionSchema,
  }
);

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const query = (context.query || {}) as BannerPositionListQueryInput;
      const result = await bannerPositionService.getBannerPositions(query);

      return apiSuccess(
        result.data,
        "Banner positions fetched successfully",
        200,
        result.meta
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    querySchema: bannerPositionListQuerySchema,
  }
);
