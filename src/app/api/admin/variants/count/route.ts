import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { variantService } from "@/features/variants/services/variant.service";
import {
  adminVariantListSchema,
  type AdminVariantListInput,
} from "@/features/variants/validations/admin-variant.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = (context.body || {}) as AdminVariantListInput;
      const result = await variantService.countAdminVariants(body);

      return apiSuccess(result, "Variants count fetched successfully", 200);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: adminVariantListSchema,
  }
);
