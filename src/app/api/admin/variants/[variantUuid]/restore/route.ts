import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { variantRepository } from "@/features/variants/repositories/variant.repository";
import { userRepository } from "@/features/users/repositories/user.repository";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const variantUuid = context.params?.variantUuid;
      if (!variantUuid) throw ApiError.badRequest("Variant UUID is required");

      const adminEmail = context.session?.user?.email ?? undefined;
      let adminId: bigint | null = null;
      if (adminEmail) {
        const user = await userRepository.findByEmail(adminEmail);
        if (user) adminId = BigInt(user.internalId || user.id);
      }

      const restored = await variantRepository.restoreByUuid(variantUuid, adminId);
      if (!restored) throw ApiError.notFound("Deleted variant not found");

      return apiSuccess(null, "Item restored successfully.");
    },
  },
  { method: "POST", requireAuth: true, requiredRole: ["ADMIN"] }
);
