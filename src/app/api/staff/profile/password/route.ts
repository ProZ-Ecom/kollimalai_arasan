import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { staffService } from "@/features/staff/services/staff.service";
import {
  changeStaffPasswordSchema,
  type ChangeStaffPasswordInput,
} from "@/features/staff/validations/staff.schema";

export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Unauthorized");
      }

      const body = context.body as ChangeStaffPasswordInput;
      const result = await staffService.changeStaffPassword(
        sessionUserId,
        body
      );

      return apiSuccess(
        null,
        result.message || "Password changed successfully",
        200
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["STAFF"],
    bodySchema: changeStaffPasswordSchema,
  }
);
