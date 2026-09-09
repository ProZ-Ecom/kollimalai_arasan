import { cookies } from "next/headers";
import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { verifyOtpSchema } from "@/features/auth/validations/auth.schema";
import { otpService } from "@/features/auth/services/otp.service";
import type { VerifyOtpInput } from "@/features/auth/types";

const IS_PROD = process.env.NODE_ENV === "production";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as VerifyOtpInput;

      const result = await otpService.verifyOtp(body.email, body.otp);

      if (result.resetToken) {
        const cookieStore = await cookies();
        cookieStore.set("reset_token", result.resetToken, {
          httpOnly: true,
          secure: IS_PROD,
          sameSite: "lax",
          path: "/",
          maxAge: 5 * 60, // 5 minutes
        });
      }

      return apiSuccess(
        { resetToken: result.resetToken },
        "OTP verified successfully. You can now reset your password."
      );
    },
  },
  {
    method: "POST",
    bodySchema: verifyOtpSchema,
  }
);
