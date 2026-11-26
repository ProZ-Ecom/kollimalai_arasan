import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { readQuery } from "@/features/reports/lib/report-filters";
import { salesReportService } from "@/features/reports/services/sales-report.service";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const q = readQuery(context.searchParams, [
        "dateFrom",
        "dateTo",
        "coupon",
      ]);
      return apiSuccess(await salesReportService.summary(q));
    },
  },
  { requireAuth: true, requiredRole: ["ADMIN"] }
);
