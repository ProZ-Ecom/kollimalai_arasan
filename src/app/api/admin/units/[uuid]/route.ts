import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { unitService } from "@/features/units/services/unit.service";
import {
  updateAdminUnitSchema,
  type UpdateAdminUnitInput,
} from "@/features/units/validations/admin-unit.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const uuid = context.params?.uuid;
      if (!uuid) {
        throw ApiError.badRequest("Unit UUID is required");
      }

      const unit = await unitService.getAdminUnitByUuid(uuid);
      return apiSuccess(unit, "Unit fetched successfully");
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
        throw ApiError.badRequest("Unit UUID is required");
      }

      const body = context.body as UpdateAdminUnitInput;
      const adminEmail = context.session?.user?.email ?? undefined;

      const unit = await unitService.updateAdminUnit(uuid, body, adminEmail);
      return apiSuccess(unit, "Unit updated successfully");
    },
  },
  {
    method: "PUT",
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: updateAdminUnitSchema,
  }
);

export const DELETE = createApiHandler(
  {
    DELETE: async (_request, context) => {
      const uuid = context.params?.uuid;
      if (!uuid) {
        throw ApiError.badRequest("Unit UUID is required");
      }

      const adminEmail = context.session?.user?.email ?? undefined;
      const result = await unitService.deleteAdminUnit(uuid, adminEmail);

      return apiSuccess(null, result.message);
    },
  },
  {
    method: "DELETE",
    requireAuth: true,
    requiredRole: ["ADMIN"],
  }
);
