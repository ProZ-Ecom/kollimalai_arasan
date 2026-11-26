import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { readQuery } from "@/features/reports/lib/report-filters";
import { revenueReportService } from "@/features/reports/services/revenue-report.service";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const q = readQuery(context.searchParams, [
        "dateFrom",
        "dateTo",
        "paymentMethod",
      ]);
      return apiSuccess(await revenueReportService.summary(q));
    },
  },
  { requireAuth: true, requiredRole: ["ADMIN"] }
);
