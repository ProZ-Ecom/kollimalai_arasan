import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { shipOrderViaShiprocket } from "@/features/orders/services/shiprocket-order.service";
import { z } from "zod";

const shiprocketDispatchSchema = z.object({
  notes: z.string().max(500).optional(),
  pickupLocation: z.string().optional(),
  courierId: z.number().optional(),
});

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Unauthorized");
      }

      const uuid = context.params?.uuid;
      if (!uuid || typeof uuid !== "string") {
        throw ApiError.badRequest("Invalid order UUID");
      }

      try {
        const body = (context.body || {}) as z.infer<typeof shiprocketDispatchSchema>;
        const result = await shipOrderViaShiprocket(sessionUserId, uuid, body);

        return apiSuccess(result, result.message || "Order dispatched via Shiprocket", 200);
      } catch (err: any) {
        if (err instanceof ApiError) throw err;
        throw ApiError.badRequest(err.message || "Shiprocket dispatch failed");
      }
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: shiprocketDispatchSchema,
  }
);
