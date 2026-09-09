import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { adminCustomerService } from "@/features/customers/services/admin-customer.service";
import {
  adminCustomerListSchema,
  type AdminCustomerListInput,
} from "@/features/customers/validations/admin-customer.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = (context.body || {}) as AdminCustomerListInput;
      const result = await adminCustomerService.countAdminCustomers(body);

      return apiSuccess(result, "Customers count fetched successfully", 200);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: adminCustomerListSchema,
  }
);
