import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { otpService } from "@/features/auth/services/otp.service";
import {
  verifyEmailOtpSchema,
  type VerifyEmailOtpInput,
} from "@/features/auth/validations/auth.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as VerifyEmailOtpInput;

      const result = await otpService.verifyRegistrationEmailOtp(
        body.email,
        body.otp
      );

      return apiSuccess(result.data, result.message, 200);
    },
  },
  {
    method: "POST",
    bodySchema: verifyEmailOtpSchema,
  }
);
