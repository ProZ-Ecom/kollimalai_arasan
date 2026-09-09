import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { adminCustomerService } from "@/features/customers/services/admin-customer.service";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const uuid = context.params?.uuid;
      if (!uuid || typeof uuid !== "string") {
        throw ApiError.badRequest("Invalid customer UUID");
      }

      const addresses = await adminCustomerService.getCustomerAddresses(uuid);

      return apiSuccess(
        addresses,
        "Customer addresses fetched successfully",
        200
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
  }
);
