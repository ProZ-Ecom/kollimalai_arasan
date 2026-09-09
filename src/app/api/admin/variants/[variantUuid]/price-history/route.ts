import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { variantUnitPriceService } from "@/features/variants/services/variant-unit-price.service";
import {
  variantPriceHistoryQuerySchema,
  type VariantPriceHistoryQueryInput,
} from "@/features/variants/validations/admin-variant.schema";

// NOTE: `variantUuid` here is the VariantUnitPrice UUID (a variant's price
// history is now tracked per (unit, price) combination, not per item). The
// route segment name is kept for backward compatibility with existing
// frontend callers.
export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const unitPriceUuid = context.params?.variantUuid;
      if (!unitPriceUuid || typeof unitPriceUuid !== "string") {
        throw ApiError.badRequest("Invalid variant unit price UUID");
      }

      const query = (context.query || {}) as Record<string, any>;
      const parsed = variantPriceHistoryQuerySchema.safeParse({
        page: query.page ? Number(query.page) : 1,
        pageSize: query.pageSize ? Number(query.pageSize) : 20,
        fromDate: query.fromDate,
        toDate: query.toDate,
        sortOrder: query.sortOrder || "desc",
      });

      const params = parsed.success ? parsed.data : {};
      const result = await variantUnitPriceService.getPriceHistory(
        unitPriceUuid,
        params
      );
      const meta = result.meta
        ? {
            page: result.meta.page,
            limit: result.meta.pageSize,
            total: result.meta.total,
            totalPages: result.meta.totalPages,
          }
        : undefined;

      return apiSuccess(
        result.data,
        "Variant price history fetched successfully",
        200,
        meta
      );
    },
    POST: async (_request, context) => {
      const unitPriceUuid = context.params?.variantUuid;
      if (!unitPriceUuid || typeof unitPriceUuid !== "string") {
        throw ApiError.badRequest("Invalid variant unit price UUID");
      }

      const body = (context.body || {}) as VariantPriceHistoryQueryInput;
      const result = await variantUnitPriceService.getPriceHistory(
        unitPriceUuid,
        body
      );

      const meta = result.meta
        ? {
            page: result.meta.page,
            limit: result.meta.pageSize,
            total: result.meta.total,
            totalPages: result.meta.totalPages,
          }
        : undefined;

      return apiSuccess(
        result.data,
        "Variant price history fetched successfully",
        200,
        meta
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
  }
);
