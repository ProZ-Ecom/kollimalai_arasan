import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiFromError } from "@/lib/api/api-response";
import { orderService } from "@/features/orders/services/order.service";
import { cancelOrderSchema, type CancelOrderInput } from "@/features/orders/validations/order.schema";

export const PATCH = createApiHandler(
  {
    PATCH: async (_request, context) => {
      try {
        const userId = (context.session?.user as { id?: string })?.id ?? "";
        if (!userId) return apiFromError(new Error("Unauthorized"));
        const id = context.params?.id ?? "";
        const body = (context.body as CancelOrderInput) ?? {};
        const order = await orderService.cancelOrder(userId, id, body.note);
        return apiSuccess(order, "Order cancelled successfully");
      } catch (error) {
        return apiFromError(error);
      }
    },
  },
  { requireAuth: true, bodySchema: cancelOrderSchema }
);
