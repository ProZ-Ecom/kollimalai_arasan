import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { otpService } from "@/features/auth/services/otp.service";
import {
  resendRegisterOtpSchema,
  type ResendRegisterOtpInput,
} from "@/features/auth/validations/auth.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as ResendRegisterOtpInput;
      const result = await otpService.resendRegistrationEmailOtp(body.email);
      return apiSuccess(result.data, result.message, 200);
    },
  },
  {
    method: "POST",
    bodySchema: resendRegisterOtpSchema,
  }
);
