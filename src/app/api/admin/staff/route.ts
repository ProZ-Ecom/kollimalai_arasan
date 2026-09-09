import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { staffService } from "@/features/staff/services/staff.service";
import {
  createStaffSchema,
  type CreateStaffInput,
} from "@/features/staff/validations/staff.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as CreateStaffInput;
      const adminEmail = context.session?.user?.email;
      const result = await staffService.createStaff(body, adminEmail);

      return apiSuccess(
        result,
        "Staff member created successfully",
        201
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: createStaffSchema,
  }
);
