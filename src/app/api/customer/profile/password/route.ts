import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { customerProfileService } from "@/features/customers/services/customer-profile.service";
import {
  changeCustomerPasswordSchema,
  type ChangeCustomerPasswordInput,
} from "@/features/customers/validations/customer-profile.schema";

export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Authentication required");
      }

      const body = context.body as ChangeCustomerPasswordInput;
      const result = await customerProfileService.changeCustomerPassword(
        sessionUserId,
        body
      );

      return apiSuccess(
        null,
        result.message || "Password changed successfully",
        200
      );
    },
  },
  {
    requireAuth: true,
    bodySchema: changeCustomerPasswordSchema,
  }
);
