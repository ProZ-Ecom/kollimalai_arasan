import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiCreated } from "@/lib/api/api-response";
import { gstRateService } from "@/features/gst-rates/services/gst-rate.service";
import {
  createAdminGstRateSchema,
  adminGstRatesQuerySchema,
  type CreateAdminGstRateInput,
  type AdminGstRatesQueryInput,
} from "@/features/gst-rates/validations/admin-gst-rate.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const query = context.query as AdminGstRatesQueryInput;
      const result = await gstRateService.getAdminGstRates({
        page: query?.page ?? 1,
        pageSize: query?.pageSize ?? 10,
        search: query?.search,
      });

      return apiSuccess(result.data, "GST rates fetched successfully", 200, result.meta);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
    querySchema: adminGstRatesQuerySchema,
  }
);

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as CreateAdminGstRateInput;
      const adminEmail = context.session?.user?.email ?? undefined;

      const gstRate = await gstRateService.createAdminGstRate(body, adminEmail);

      return apiCreated(gstRate, "GST rate created successfully");
    },
  },
  {
    method: "POST",
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: createAdminGstRateSchema,
  }
);
