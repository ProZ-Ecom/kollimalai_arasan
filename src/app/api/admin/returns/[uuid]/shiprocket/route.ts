import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { createReturnPickupViaShiprocket } from "@/features/orders/services/shiprocket-return.service";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Unauthorized");
      }

      const uuid = context.params?.uuid;
      if (!uuid || typeof uuid !== "string") {
        throw ApiError.badRequest("Invalid return request UUID");
      }

      const result = await createReturnPickupViaShiprocket(sessionUserId, uuid);

      return apiSuccess(
        result,
        result.message || "Return pickup scheduled successfully",
        200
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
  }
);
