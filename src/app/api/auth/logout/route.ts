import { cookies } from "next/headers";
import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";

export const POST = createApiHandler(
  {
    POST: async () => {
      const cookieStore = await cookies();
      cookieStore.delete("access_token");
      cookieStore.delete("refresh_token");
      cookieStore.delete("reset_token");

      return apiSuccess(null, "Logged out successfully");
    },
  },
  {
    method: "POST",
  }
);
