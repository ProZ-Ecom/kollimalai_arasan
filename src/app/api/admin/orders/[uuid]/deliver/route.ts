import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { orderService } from "@/features/orders/services/order.service";
import { z } from "zod";

const deliverOrderSchema = z
  .object({
    note: z.string().max(255).optional(),
  })
  .optional();

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Authentication required");
      }

      const uuid = context.params?.uuid;
      if (!uuid) {
        throw ApiError.badRequest("Order UUID is required");
      }

      const body = context.body as { note?: string } | undefined;
      const order = await orderService.deliverAdminOrder(sessionUserId, uuid, body);

      return apiSuccess(order, "Order marked as delivered successfully", 200);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: deliverOrderSchema,
  }
);
