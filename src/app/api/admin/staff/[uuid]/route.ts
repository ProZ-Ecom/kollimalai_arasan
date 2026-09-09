import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { staffService } from "@/features/staff/services/staff.service";
import {
  updateStaffSchema,
  staffUuidParamSchema,
  type UpdateStaffInput,
} from "@/features/staff/validations/staff.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const rawUuid = context.params?.uuid;
      const parsedParam = staffUuidParamSchema.safeParse({ uuid: rawUuid });
      if (!parsedParam.success) {
        throw ApiError.badRequest("Invalid staff UUID format");
      }

      const result = await staffService.getStaffByUuid(parsedParam.data.uuid);

      return apiSuccess(
        result,
        "Staff member fetched successfully",
        200
      );
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
      const rawUuid = context.params?.uuid;
      const parsedParam = staffUuidParamSchema.safeParse({ uuid: rawUuid });
      if (!parsedParam.success) {
        throw ApiError.badRequest("Invalid staff UUID format");
      }

      const body = context.body as UpdateStaffInput;
      const adminEmail = context.session?.user?.email;
      const result = await staffService.updateStaff(
        parsedParam.data.uuid,
        body,
        adminEmail
      );

      return apiSuccess(
        result,
        "Staff member updated successfully",
        200
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: updateStaffSchema,
  }
);
