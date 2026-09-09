import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiFromError } from "@/lib/api/api-response";
import { cartService } from "@/features/cart/services/cart.service";
import { updateCartItemSchema } from "@/features/cart/validations/cart.schema";

export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      try {
        const userId = context.session?.user?.id;
        if (!userId) return apiFromError(new Error("Unauthorized"));
        const itemId = context.params?.itemId ?? "";
        const body = context.body as { quantity: number };
        const cart = await cartService.updateItemQuantity(
          userId,
          itemId,
          { quantity: body.quantity }
        );
        return apiSuccess(cart, "Cart updated successfully");
      } catch (error) {
        return apiFromError(error);
      }
    },
  },
  { requireAuth: true, bodySchema: updateCartItemSchema }
);

export const DELETE = createApiHandler(
  {
    DELETE: async (_request, context) => {
      try {
        const userId = context.session?.user?.id;
        if (!userId) return apiFromError(new Error("Unauthorized"));
        const itemId = context.params?.itemId ?? "";
        const cart = await cartService.removeItem(userId, itemId);
        return apiSuccess(cart, "Item removed from cart");
      } catch (error) {
        return apiFromError(error);
      }
    },
  },
  { requireAuth: true }
);
