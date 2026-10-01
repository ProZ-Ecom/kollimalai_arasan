import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { razorpaySettlementsService } from "@/features/payment/services/razorpay-settlements.service";

/**
 * GET /api/admin/payments/settlements
 *
 * Returns combined Razorpay settlement, payment, and refund data
 * for the admin payments dashboard.
 *
 * Query Params:
 *   days (optional) — number of days to look back for payments/refunds (default: 30)
 */
export const GET = createApiHandler(
  {
    GET: async (request) => {
      const { searchParams } = new URL(request.url);
      const days = Math.min(
        Math.max(parseInt(searchParams.get("days") || "30", 10), 1),
        90
      );

      const data = await razorpaySettlementsService.getDashboardData(days);

      return apiSuccess(data, "Razorpay settlement data fetched successfully");
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
  }
);
