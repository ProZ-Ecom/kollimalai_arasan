import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { companyService } from "@/features/company/services/company.service";

export const POST = createApiHandler(
  {
    POST: async (request, context) => {
      const formData = await request.formData();
      const adminEmail = context.session?.user?.email;

      const result = await companyService.uploadLogo(formData, adminEmail);
      return apiSuccess(result, "Company logo uploaded successfully", 200);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
  }
);
