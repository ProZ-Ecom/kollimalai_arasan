import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { bannerService } from "@/features/banners/services/banner.service";
import {
  createBannerSchema,
  bannerListQuerySchema,
  type CreateBannerInput,
  type BannerListQueryInput,
} from "@/features/banners/validations/banner.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as CreateBannerInput;
      const sessionUserId = context.session?.user?.id;
      const result = await bannerService.createBanner(body, sessionUserId);

      return apiSuccess(result, "Banner created successfully", 200);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: createBannerSchema,
  }
);

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const query = (context.query || {}) as BannerListQueryInput;
      const result = await bannerService.getBanners(query);

      return apiSuccess(
        result.data,
        "Banners fetched successfully",
        200,
        result.meta
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    querySchema: bannerListQuerySchema,
  }
);
