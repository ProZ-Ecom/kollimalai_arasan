import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { db } from "@/lib/db/prisma";
import { userRepository } from "@/features/users/repositories/user.repository";

/**
 * POST /api/customer/cart/validate-stock
 * Pre-checkout stock check called BEFORE opening Razorpay.
 * Returns 200 { valid: true } if all cart items have sufficient stock,
 * or 400 with a customer-friendly message if any item is out of stock.
 */
export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Authentication required");
      }

      const user = await userRepository.findById(sessionUserId);
      if (!user || !user.internalId) {
        throw ApiError.unauthorized("User not found");
      }

      const userId = user.internalId;

      // Load the active cart with inventory data
      const cart = await db.cart.findFirst({
        where: { userId, status: "active", is_active: true },
        include: {
          items: {
            where: { is_active: true },
            include: {
              variant_unit_price: {
                include: {
                  inventories: {
                    where: { is_active: true },
                    select: { quantity_available: true },
                  },
                  variant: {
                    select: { variant_name: true },
                  },
                },
              },
              product: { select: { name: true } },
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw ApiError.badRequest("Your cart is empty.");
      }

      const errors: string[] = [];

      for (const item of cart.items) {
        const vup = item.variant_unit_price;
        const productName = item.product?.name || "Item";
        const variantName = vup?.variant?.variant_name || productName;

        if (!vup || !vup.isActive || vup.deleted_at) {
          errors.push(`"${variantName}" is no longer available.`);
          continue;
        }

        const inv = vup.inventories;
        const available = inv ? Number(inv.quantity_available) : 0;

        if (available <= 0) {
          errors.push(`"${variantName}" is out of stock.`);
        } else if (item.quantity > available) {
          errors.push(
            `Only ${available} unit${available === 1 ? "" : "s"} left for "${variantName}". You have ${item.quantity} in your cart.`
          );
        }
      }

      if (errors.length > 0) {
        throw ApiError.badRequest(errors.join(" | "));
      }

      return apiSuccess({ valid: true }, "All items are in stock");
    },
  },
  { requireAuth: true }
);
