import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { cartService } from "@/features/cart/services/cart.service";
import {
  updateCartItemSchema,
  type UpdateCartItemInput,
} from "@/features/cart/validations/cart.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Please login to access your cart");
      }

      const variantUuid = context.params?.variantUuid;
      if (!variantUuid) {
        throw ApiError.badRequest("variantUuid is required");
      }

      const item = await cartService.getCartItem(sessionUserId, variantUuid);

      return apiSuccess(item, "Cart item fetched successfully", 200);
    },
  },
  {
    requireAuth: true,
  }
);

export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Please login to access your cart");
      }

      const variantUuid = context.params?.variantUuid;
      if (!variantUuid) {
        throw ApiError.badRequest("variantUuid is required");
      }

      const body = context.body as UpdateCartItemInput;
      const cart = await cartService.updateItemQuantity(
        sessionUserId,
        variantUuid,
        body
      );

      return apiSuccess(cart, "Cart item updated successfully", 200);
    },
  },
  {
    requireAuth: true,
    bodySchema: updateCartItemSchema,
  }
);

export const DELETE = createApiHandler(
  {
    DELETE: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Please login to access your cart");
      }

      const variantUuid = context.params?.variantUuid;
      if (!variantUuid) {
        throw ApiError.badRequest("variantUuid is required");
      }

      const cart = await cartService.removeItem(sessionUserId, variantUuid);

      return apiSuccess(cart, "Cart item removed successfully", 200);
    },
  },
  {
    requireAuth: true,
  }
);
