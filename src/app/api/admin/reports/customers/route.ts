import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { readQuery } from "@/features/reports/lib/report-filters";
import { customersReportService } from "@/features/reports/services/customers-report.service";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const q = readQuery(context.searchParams, ["dateFrom", "dateTo"]);
      return apiSuccess(await customersReportService.summary(q));
    },
  },
  { requireAuth: true, requiredRole: ["ADMIN"] }
);
