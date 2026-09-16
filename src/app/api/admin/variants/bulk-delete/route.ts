import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { variantService } from "@/features/variants/services/variant.service";
import {
  bulkDeleteAdminVariantsSchema,
  type BulkDeleteAdminVariantsInput,
} from "@/features/variants/validations/admin-variant.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as BulkDeleteAdminVariantsInput;
      const adminEmail = context.session?.user?.email ?? undefined;

      const result = await variantService.bulkDeleteAdminVariants(
        body.ids,
        adminEmail
      );

      return apiSuccess(result, result.message, 200);
    },
  },
  {
    method: "POST",
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: bulkDeleteAdminVariantsSchema,
  }
);
