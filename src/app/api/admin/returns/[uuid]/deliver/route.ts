import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { returnService } from "@/features/returns/services/return.service";
import { returnUuidParamSchema } from "@/features/returns/validations/return.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      try {
        const adminSessionUserId = context.session?.user?.id;
        if (!adminSessionUserId) {
          throw ApiError.unauthorized("Authentication required");
        }

        const rawUuid = context.params?.uuid;
        const parsedParam = returnUuidParamSchema.safeParse({ uuid: rawUuid });
        if (!parsedParam.success) {
          throw ApiError.badRequest("Invalid return UUID format");
        }

        const result = await returnService.markReturnDelivered(
          adminSessionUserId,
          parsedParam.data.uuid
        );

        return apiSuccess(
          result,
          result.message || "Return request status updated to delivered",
          200
        );
      } catch (error: any) {
        if (error instanceof ApiError) {
          throw error;
        }
        console.error("[POST /api/admin/returns/[uuid]/deliver] Error:", error);
        throw ApiError.badRequest(
          error?.message || "Failed to mark return request as delivered"
        );
      }
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
  }
);

