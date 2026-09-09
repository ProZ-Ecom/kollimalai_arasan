import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { hsnCodeService } from "@/features/hsn-codes/services/hsn-code.service";
import {
  updateAdminHsnCodeSchema,
  type UpdateAdminHsnCodeInput,
} from "@/features/hsn-codes/validations/admin-hsn-code.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const uuid = context.params?.uuid;
      if (!uuid) {
        throw ApiError.badRequest("HSN code UUID is required");
      }

      const hsnCode = await hsnCodeService.getAdminHsnCodeByUuid(uuid);
      return apiSuccess(hsnCode, "HSN code fetched successfully");
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
        throw ApiError.badRequest("HSN code UUID is required");
      }

      const body = context.body as UpdateAdminHsnCodeInput;
      const adminEmail = context.session?.user?.email ?? undefined;

      const hsnCode = await hsnCodeService.updateAdminHsnCode(uuid, body, adminEmail);
      return apiSuccess(hsnCode, "HSN code updated successfully");
    },
  },
  {
    method: "PUT",
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: updateAdminHsnCodeSchema,
  }
);

export const DELETE = createApiHandler(
  {
    DELETE: async (_request, context) => {
      const uuid = context.params?.uuid;
      if (!uuid) {
        throw ApiError.badRequest("HSN code UUID is required");
      }

      const adminEmail = context.session?.user?.email ?? undefined;
      const result = await hsnCodeService.deleteAdminHsnCode(uuid, adminEmail);

      return apiSuccess(null, result.message);
    },
  },
  {
    method: "DELETE",
    requireAuth: true,
    requiredRole: ["ADMIN"],
  }
);
