import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { catalogService } from "@/features/customers/services/catalog.service";
import {
  customerRelatedVariantsQuerySchema,
  variantIdParamSchema,
} from "@/features/customers/validations/catalog.schema";

/**
 * GET /api/products/related/:variantId?page=1&limit=10
 *
 * Products related to the given variant, resolved through the product's
 * category/subcategory and brand relationships. The source product (and so the
 * source variant) is never included, and each related product is represented by
 * exactly one variant, so the page contains no duplicate products or variants.
 *
 * Query params are validated here rather than through the handler's
 * `querySchema` option, which falls back to the raw search params on a parse
 * failure instead of rejecting the request.
 */
export const GET = createApiHandler({
  GET: async (_request, context) => {
    const rawVariantId = context.params?.variantId;
    if (!rawVariantId) {
      throw ApiError.badRequest("Variant ID is required");
    }

    const variantIdResult = variantIdParamSchema.safeParse(rawVariantId);
    if (!variantIdResult.success) {
      throw ApiError.badRequest(
        variantIdResult.error.issues[0]?.message ?? "Invalid variant ID"
      );
    }

    const rawQuery: Record<string, string> = {};
    context.searchParams?.forEach((value, key) => {
      rawQuery[key] = value;
    });

    const queryResult = customerRelatedVariantsQuerySchema.safeParse(rawQuery);
    if (!queryResult.success) {
      throw ApiError.validation(
        queryResult.error.issues.map(
          (issue) => `${issue.path.join(".")}: ${issue.message}`
        )
      );
    }

    const result = await catalogService.getRelatedVariants(
      variantIdResult.data,
      queryResult.data
    );

    return apiSuccess(
      result.data,
      result.data.length > 0
        ? "Related products fetched successfully"
        : "No related products found",
      200,
      result.meta
    );
  },
});
