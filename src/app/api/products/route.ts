import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiCreated, apiError } from "@/lib/api/api-response";
import { productService } from "@/features/products/services/product.service";
import { getProductsQuerySchema, createProductSchema } from "@/features/products/validations/product.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const query = context.query as ReturnType<typeof getProductsQuerySchema.parse>;

      const result = await productService.getAdminProducts({
        page: query.page,
        pageSize: query.limit,
        search: query.search,
      });

      return apiSuccess(result.data, "Products fetched successfully", 200, result.meta);
    },
  },
  { querySchema: getProductsQuerySchema }
);

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as ReturnType<typeof createProductSchema.parse>;
      const product = await productService.createProduct(body);
      return apiCreated(product, "Product created successfully");
    },
  },
  {
    method: "POST",
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: createProductSchema,
  }
);
