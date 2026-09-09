import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { returnService } from "@/features/returns/services/return.service";
import {
  adminReturnListSchema,
  type AdminReturnListInput,
} from "@/features/returns/validations/return.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = (context.body || {}) as AdminReturnListInput;
      const result = await returnService.getAdminReturnRequests(body);

      return apiSuccess(
        result.data,
        "Return requests fetched successfully",
        200,
        result.meta
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: adminReturnListSchema,
  }
);
