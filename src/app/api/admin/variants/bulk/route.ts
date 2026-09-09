import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { variantUnitPriceService } from "@/features/variants/services/variant-unit-price.service";
import {
  bulkEditVariantsSchema,
  type BulkEditVariantsInput,
} from "@/features/variants/validations/admin-variant.schema";

// NOTE: item ids in the body are VariantUnitPrice UUIDs (price/stock now live
// on the unit-price row, not the item-level variant).
export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      const body = context.body as BulkEditVariantsInput;
      const adminEmail = context.session?.user?.email ?? undefined;

      const updatedVariants = await variantUnitPriceService.bulkUpdateUnitPrices(
        body,
        adminEmail
      );

      return apiSuccess(
        updatedVariants,
        "Variants updated successfully in bulk",
        200
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: bulkEditVariantsSchema,
  }
);
