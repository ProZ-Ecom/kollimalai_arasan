import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { companyService } from "@/features/company/services/company.service";

export const GET = createApiHandler(
  {
    GET: async () => {
      try {
        const result = await companyService.getCompany();
        return apiSuccess(result, "Company details fetched successfully", 200);
      } catch (err: unknown) {
        const error = err as { statusCode?: number; status?: number; message?: string };
        if (
          error?.statusCode === 404 ||
          error?.status === 404 ||
          error?.message?.includes("not found")
        ) {
          return apiSuccess(null, "Company settings not found", 200);
        }
        throw err;
      }
    },
  },
  {
    requireAuth: false,
  }
);
