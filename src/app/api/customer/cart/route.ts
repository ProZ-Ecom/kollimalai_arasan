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

      const cart = await cartService.getCart(sessionUserId);
      return apiSuccess(cart, "Cart fetched successfully", 200);
    },
  },
  {
    requireAuth: true,
  }
);

export const DELETE = createApiHandler(
  {
    DELETE: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Please login to access your cart");
      }

      await cartService.clearCart(sessionUserId);
      return apiSuccess(null, "Cart cleared successfully", 200);
    },
  },
  {
    requireAuth: true,
  }
);
