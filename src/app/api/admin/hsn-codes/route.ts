import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiCreated } from "@/lib/api/api-response";
import { hsnCodeService } from "@/features/hsn-codes/services/hsn-code.service";
import {
  createAdminHsnCodeSchema,
  adminHsnCodesQuerySchema,
  type CreateAdminHsnCodeInput,
  type AdminHsnCodesQueryInput,
} from "@/features/hsn-codes/validations/admin-hsn-code.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const query = context.query as AdminHsnCodesQueryInput;
      const result = await hsnCodeService.getAdminHsnCodes({
        page: query?.page ?? 1,
        pageSize: query?.pageSize ?? 10,
        search: query?.search,
      });

      return apiSuccess(result.data, "HSN codes fetched successfully", 200, result.meta);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
    querySchema: adminHsnCodesQuerySchema,
  }
);

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as CreateAdminHsnCodeInput;
      const adminEmail = context.session?.user?.email ?? undefined;

      const hsnCode = await hsnCodeService.createAdminHsnCode(body, adminEmail);

      return apiCreated(hsnCode, "HSN code created successfully");
    },
  },
  {
    method: "POST",
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: createAdminHsnCodeSchema,
  }
);
