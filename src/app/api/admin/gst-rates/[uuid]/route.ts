import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { gstRateService } from "@/features/gst-rates/services/gst-rate.service";
import {
  updateAdminGstRateSchema,
  type UpdateAdminGstRateInput,
} from "@/features/gst-rates/validations/admin-gst-rate.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const uuid = context.params?.uuid;
      if (!uuid) {
        throw ApiError.badRequest("GST rate UUID is required");
      }

      const gstRate = await gstRateService.getAdminGstRateByUuid(uuid);
      return apiSuccess(gstRate, "GST rate fetched successfully");
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
  }
);

export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      const uuid = context.params?.uuid;
      if (!uuid) {
        throw ApiError.badRequest("GST rate UUID is required");
      }

      const body = context.body as UpdateAdminGstRateInput;
      const adminEmail = context.session?.user?.email ?? undefined;

      const gstRate = await gstRateService.updateAdminGstRate(uuid, body, adminEmail);
      return apiSuccess(gstRate, "GST rate updated successfully");
    },
  },
  {
    method: "PUT",
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: updateAdminGstRateSchema,
  }
);

export const DELETE = createApiHandler(
  {
    DELETE: async (_request, context) => {
      const uuid = context.params?.uuid;
      if (!uuid) {
        throw ApiError.badRequest("GST rate UUID is required");
      }

      const adminEmail = context.session?.user?.email ?? undefined;
      const result = await gstRateService.deleteAdminGstRate(uuid, adminEmail);

      return apiSuccess(null, result.message);
    },
  },
  {
    method: "DELETE",
    requireAuth: true,
    requiredRole: ["ADMIN"],
  }
);
