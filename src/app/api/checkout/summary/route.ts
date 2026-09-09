import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiFromError } from "@/lib/api/api-response";
import { orderService } from "@/features/orders/services/order.service";
import { checkoutSummarySchema } from "@/features/orders/validations/order.schema";
import type { CheckoutSummarySchemaInput } from "@/features/orders/validations/order.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      try {
        const userId = parseInt((context.session?.user as { id?: string })?.id ?? "0");
        if (!userId) return apiFromError(new Error("Unauthorized"));
        const body = context.body as CheckoutSummarySchemaInput;
        const summary = await orderService.getCheckoutSummary(
          userId,
          body.deliveryMethod,
          body.couponCode
        );
        return apiSuccess(summary, "Checkout summary fetched successfully");
      } catch (error) {
        return apiFromError(error);
      }
    },
  },
  { requireAuth: true, bodySchema: checkoutSummarySchema }
);
