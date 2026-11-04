import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { returnService } from "@/features/returns/services/return.service";
import {
  adminProcessReturnRefundSchema,
  type AdminProcessReturnRefundInput,
} from "@/features/returns/validations/return.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Authentication required");
      }

      const rawUuid = context.params?.uuid;
      if (!rawUuid) {
        throw ApiError.badRequest("Return request UUID is required");
      }

      const body = (context.body || {}) as AdminProcessReturnRefundInput;
      const result = await returnService.processReturnRefund(
        sessionUserId,
        rawUuid,
        body
      );

      return apiSuccess(
        result,
        result.message || "Return refund processed successfully",
        200
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: adminProcessReturnRefundSchema,
  }
);

