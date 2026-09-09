import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiFromError } from "@/lib/api/api-response";
import { cartService } from "@/features/cart/services/cart.service";
import { addCartItemSchema } from "@/features/cart/validations/cart.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      try {
        const userId = context.session?.user?.id;
        if (!userId) return apiFromError(new Error("Unauthorized"));
        const cart = await cartService.getCart(userId);
        return apiSuccess(cart, "Cart fetched successfully");
      } catch (error) {
        return apiFromError(error);
      }
    },
  },
  { requireAuth: true }
);

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      try {
        const userId = context.session?.user?.id;
        if (!userId) return apiFromError(new Error("Unauthorized"));
        const body = context.body as { variantId?: string; variantUnitPriceId?: string; quantity: number };
        const cart = await cartService.addItem(userId, {
          variantUnitPriceId: body.variantUnitPriceId,
          variantId: body.variantId,
          quantity: body.quantity ?? 1,
        });
        return apiSuccess(cart, "Item added to cart", 201);
      } catch (error) {
        return apiFromError(error);
      }
    },
  },
  { requireAuth: true, bodySchema: addCartItemSchema }
);

