import { z } from "zod";
import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { customerProfileService } from "@/features/customers/services/customer-profile.service";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Authentication required");
      }

      const body = context.body as z.infer<typeof changePasswordSchema>;
      const result = await customerProfileService.changePassword(
        sessionUserId,
        body.currentPassword,
        body.newPassword
      );

      return apiSuccess(result, result.message, 200);
    },
  },
  {
    requireAuth: true,
    bodySchema: changePasswordSchema,
  }
);
