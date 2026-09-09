import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { cartService } from "@/features/cart/services/cart.service";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Please login to access your cart");
      }

      const result = await cartService.getCartCount(sessionUserId);
      return apiSuccess(result, "Cart count fetched successfully", 200);
    },
  },
  {
    requireAuth: true,
  }
);
