import { cookies } from "next/headers";
import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { resetPasswordSchema } from "@/features/auth/validations/auth.schema";
import { otpService } from "@/features/auth/services/otp.service";
import type { ResetPasswordInput } from "@/features/auth/types";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = { ...(context.body as ResetPasswordInput) };
      const cookieStore = await cookies();

      if (!body.resetToken) {
        body.resetToken = cookieStore.get("reset_token")?.value || "";
      }

      if (!body.resetToken) {
        throw ApiError.badRequest("Reset password token is missing or expired");
      }

      const result = await otpService.resetPassword(body);

      cookieStore.delete("reset_token");

      return apiSuccess(null, result.message);
    },
  },
  {
    method: "POST",
    bodySchema: resetPasswordSchema,
  }
);
