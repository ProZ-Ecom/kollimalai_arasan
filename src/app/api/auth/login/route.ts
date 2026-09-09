import { cookies } from "next/headers";
import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { loginSchema } from "@/features/auth/validations/auth.schema";
import { authService } from "@/features/auth/services/auth.service";
import type { LoginInput } from "@/features/auth/types";

const IS_PROD = process.env.NODE_ENV === "production";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as LoginInput;

      const authData = await authService.authenticateUser(body);

      // Set Server-Side HttpOnly Cookies
      const cookieStore = await cookies();

      if (authData.accessToken) {
        cookieStore.set("access_token", authData.accessToken, {
          httpOnly: true,
          secure: IS_PROD,
          sameSite: "lax",
          path: "/",
          maxAge: 15 * 60, // 15 minutes
        });
      }

      if (authData.refreshToken) {
        cookieStore.set("refresh_token", authData.refreshToken, {
          httpOnly: true,
          secure: IS_PROD,
          sameSite: "lax",
          path: "/",
          maxAge: 30 * 24 * 60 * 60, // 30 days
        });
      }

      return apiSuccess(
        {
          user: authData.user,
        },
        "Login successful"
      );
    },
  },
  {
    method: "POST",
    bodySchema: loginSchema,
  }
);
