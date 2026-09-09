import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { returnService } from "@/features/returns/services/return.service";
import { returnUuidParamSchema } from "@/features/returns/validations/return.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const adminSessionUserId = context.session?.user?.id;
      if (!adminSessionUserId) {
        throw ApiError.unauthorized("Authentication required");
      }

      const rawUuid = context.params?.uuid;
      const parsedParam = returnUuidParamSchema.safeParse({ uuid: rawUuid });
      if (!parsedParam.success) {
        throw ApiError.badRequest("Invalid return UUID format");
      }

      const result = await returnService.completePickup(
        adminSessionUserId,
        parsedParam.data.uuid
      );

      return apiSuccess(
        result,
        "Return pickup completed and order marked as returned",
        200
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
  }
);
