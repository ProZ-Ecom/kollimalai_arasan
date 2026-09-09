import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { otpService } from "@/features/auth/services/otp.service";
import {
  resendForgotPasswordOtpSchema,
  type ResendForgotPasswordOtpInput,
} from "@/features/auth/validations/auth.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as ResendForgotPasswordOtpInput;
      const result = await otpService.resendForgotPasswordOtp(body.email);
      return apiSuccess(result.data, result.message, 200);
    },
  },
  {
    method: "POST",
    bodySchema: resendForgotPasswordOtpSchema,
  }
);
