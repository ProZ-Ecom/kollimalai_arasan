import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { returnService } from "@/features/returns/services/return.service";
import {
  createReturnRequestSchema,
  type CreateReturnRequestInput,
} from "@/features/returns/validations/return.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Authentication required");
      }

      const body = context.body as CreateReturnRequestInput;
      const result = await returnService.createCustomerReturnRequest(
        sessionUserId,
        body
      );

      return apiSuccess(
        result,
        "Return request submitted successfully",
        201
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["CUSTOMER"],
    bodySchema: createReturnRequestSchema,
  }
);
