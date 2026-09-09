export {
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resendOtpSchema,
  resendRegisterOtpSchema,
  resendForgotPasswordOtpSchema,
  resetPasswordSchema,
  sendEmailOtpSchema,
  verifyEmailOtpSchema,
  type LoginInput,
  type RefreshTokenInput,
  type ForgotPasswordInput,
  type VerifyOtpInput,
  type ResendOtpInput,
  type ResendRegisterOtpInput,
  type ResendForgotPasswordOtpInput,
  type ResetPasswordInput,
  type SendEmailOtpInput,
  type VerifyEmailOtpInput,
} from "@/features/auth/validations/auth.schema";

export {
  registerSchema,
  type RegisterInput,
} from "@/features/users/validations/user.schema";
