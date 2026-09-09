import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { staffService } from "@/features/staff/services/staff.service";
import {
  adminStaffListSchema,
  type AdminStaffListInput,
} from "@/features/staff/validations/staff.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = (context.body || {}) as AdminStaffListInput;
      const result = await staffService.countStaff(body);

      return apiSuccess(result, "Staff count fetched successfully", 200);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: adminStaffListSchema,
  }
);
