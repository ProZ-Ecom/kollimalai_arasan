import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { adminCustomerService } from "@/features/customers/services/admin-customer.service";
import {
  adminCustomerOrdersSchema,
  type AdminCustomerOrdersInput,
} from "@/features/customers/validations/admin-customer.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const uuid = context.params?.uuid;
      if (!uuid || typeof uuid !== "string") {
        throw ApiError.badRequest("Invalid customer UUID");
      }

      const body = (context.body || {}) as AdminCustomerOrdersInput;
      const result = await adminCustomerService.getCustomerOrders(uuid, body);

      return apiSuccess(
        result.data,
        "Customer orders fetched successfully",
        200,
        result.meta
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: adminCustomerOrdersSchema,
  }
);
