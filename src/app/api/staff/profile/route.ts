import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { staffService } from "@/features/staff/services/staff.service";
import {
  updateStaffProfileSchema,
  type UpdateStaffProfileInput,
} from "@/features/staff/validations/staff.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Unauthorized");
      }

      const result = await staffService.getStaffProfile(sessionUserId);

      return apiSuccess(
        result,
        "Staff profile fetched successfully",
        200
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["STAFF"],
  }
);

export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Unauthorized");
      }

      const body = context.body as UpdateStaffProfileInput;
      const result = await staffService.updateStaffProfile(
        sessionUserId,
        body
      );

      return apiSuccess(
        result,
        "Staff profile updated successfully",
        200
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["STAFF"],
    bodySchema: updateStaffProfileSchema,
  }
);
