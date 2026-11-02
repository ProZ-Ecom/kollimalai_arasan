import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { razorpayService } from "@/features/payment/services/razorpay.service";
import {
  reconcileRazorpayPaymentSchema,
  type ReconcileRazorpayPaymentInput,
} from "@/features/payment/validations/payment.schema";

/**
 * POST /api/customer/payment/reconcile
 * Checks if a pending or interrupted Razorpay payment was completed on Razorpay,
 * and recovers/creates the order automatically.
 */
export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Authentication required");
      }

      const body = (context.body || {}) as ReconcileRazorpayPaymentInput;
      const result = await razorpayService.reconcileOrder(sessionUserId, body);

      return apiSuccess(result, "Payment reconciliation completed");
    },
  },
  {
    requireAuth: true,
    bodySchema: reconcileRazorpayPaymentSchema,
  }
);
