import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { cartService } from "@/features/cart/services/cart.service";
import {
  addCartItemSchema,
  type AddCartItemInput,
} from "@/features/cart/validations/cart.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Please login to add items to your cart");
      }

      const body = context.body as AddCartItemInput;
      const cart = await cartService.addItem(sessionUserId, body);
      return apiSuccess(cart, "Item added to cart successfully", 200);
    },
  },
  {
    requireAuth: true,
    bodySchema: addCartItemSchema,
  }
);
