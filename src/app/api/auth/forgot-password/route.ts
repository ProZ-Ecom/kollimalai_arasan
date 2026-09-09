import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { forgotPasswordSchema } from "@/features/auth/validations/auth.schema";
import { otpService } from "@/features/auth/services/otp.service";
import type { ForgotPasswordInput } from "@/features/auth/types";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as ForgotPasswordInput;
      const result = await otpService.sendForgotPasswordOtp(body.email);
      return apiSuccess(null, result.message);
    },
  },
  {
    method: "POST",
    bodySchema: forgotPasswordSchema,
  }
);
