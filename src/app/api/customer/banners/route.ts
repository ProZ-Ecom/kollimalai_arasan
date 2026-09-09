import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { bannerService } from "@/features/banners/services/banner.service";
import {
  customerBannerQuerySchema,
  type CustomerBannerQueryInput,
} from "@/features/banners/validations/banner.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const query = (context.query || {}) as CustomerBannerQueryInput;
      const banners = await bannerService.getCustomerActiveBanners(query);

      return apiSuccess(banners, "Banners fetched successfully", 200);
    },
  },
  {
    querySchema: customerBannerQuerySchema,
  }
);
