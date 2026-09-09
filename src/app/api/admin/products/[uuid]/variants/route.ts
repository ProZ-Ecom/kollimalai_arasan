import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiCreated } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { variantService } from "@/features/variants/services/variant.service";
import {
  createAdminVariantSchema,
  adminVariantsQuerySchema,
  type CreateAdminVariantInput,
  type AdminVariantsQueryInput,
} from "@/features/variants/validations/admin-variant.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const productUuid = context.params?.uuid;
      if (!productUuid) {
        throw ApiError.badRequest("Product UUID is required");
      }

      const query = context.query as AdminVariantsQueryInput;
      const result = await variantService.getAdminVariants(productUuid, {
        page: query?.page ?? 1,
        pageSize: query?.pageSize ?? 10,
        search: query?.search,
      });

      return apiSuccess(result.data, "Variants fetched successfully", 200, result.meta);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
    querySchema: adminVariantsQuerySchema,
  }
);

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const productUuid = context.params?.uuid;
      if (!productUuid) {
        throw ApiError.badRequest("Product UUID is required");
      }

      const body = context.body as CreateAdminVariantInput;
      const adminEmail = context.session?.user?.email ?? undefined;

      const variant = await variantService.createAdminVariant(
        productUuid,
        body,
        adminEmail
      );

      return apiCreated(variant, "Variant created successfully");
    },
  },
  {
    method: "POST",
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: createAdminVariantSchema,
  }
);
