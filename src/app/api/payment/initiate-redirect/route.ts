import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { razorpayService } from "@/features/payment/services/razorpay.service";
import { z } from "zod";

const schema = z.object({
  shippingAddressId: z.string().uuid("Invalid shippingAddressId UUID"),
  billingAddressId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

/**
 * POST /api/payment/initiate-redirect
 * Auth required. Creates a Razorpay order from the active cart, persists a
 * one-time 30-min token, and returns the payment app URL to redirect to.
 */
export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) throw ApiError.unauthorized("Authentication required");

      const userRole = (context.session?.user as any)?.role;
      if (userRole === "ADMIN" || userRole === "STAFF") {
        throw ApiError.forbidden("You are admin kindly comes with customer login");
      }

      const body = context.body as z.infer<typeof schema>;
      const result = await razorpayService.initiateRedirectPayment(sessionUserId, body);

      return apiSuccess(result, "Payment redirect initiated");
    },
  },
  {
    requireAuth: true,
    bodySchema: schema,
  }
);
