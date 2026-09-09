import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { returnService } from "@/features/returns/services/return.service";
import {
  customerReturnListSchema,
  type CustomerReturnListInput,
} from "@/features/returns/validations/return.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Authentication required");
      }

      const body = (context.body || {}) as CustomerReturnListInput;
      const result = await returnService.getCustomerReturnRequests(
        sessionUserId,
        body
      );

      return apiSuccess(
        result.data,
        "Customer return requests fetched successfully",
        200,
        result.meta
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["CUSTOMER"],
    bodySchema: customerReturnListSchema,
  }
);
