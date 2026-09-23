import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { productRepository } from "@/features/products/repositories/product.repository";
import { userRepository } from "@/features/users/repositories/user.repository";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const uuid = context.params?.uuid;
      if (!uuid) throw ApiError.badRequest("Product UUID is required");

      const adminEmail = context.session?.user?.email ?? undefined;
      let adminId: bigint | null = null;
      if (adminEmail) {
        const user = await userRepository.findByEmail(adminEmail);
        if (user) adminId = BigInt(user.internalId || user.id);
      }

      const restored = await productRepository.restoreByUuid(uuid, adminId);
      if (!restored) throw ApiError.notFound("Deleted product not found");

      return apiSuccess(null, "Product restored successfully. Associated items have also been restored.");
    },
  },
  { method: "POST", requireAuth: true, requiredRole: ["ADMIN"] }
);
