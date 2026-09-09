export type {
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  VerifyOtpInput,
  ResendOtpInput,
  ResendRegisterOtpInput,
  ResendForgotPasswordOtpInput,
  ResetPasswordInput,
  SendEmailOtpInput,
  VerifyEmailOtpInput,
} from "../validations/auth.schema";

export interface AuthTokensResult {
  user: {
    id: string; // Exposed UUID
    name: string;
    email: string;
    phone: string | null;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResult {
  accessToken: string;
}
