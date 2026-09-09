import { customerWishlistApi } from "@/features/customers/api/customer-wishlist.api";
import type { CustomerWishlistResponse } from "../types/wishlist.types";

export async function getWishlist(): Promise<CustomerWishlistResponse> {
  try {
    return await customerWishlistApi.getWishlist();
  } catch {
    return { items: [], totalItems: 0 };
  }
}

export async function getWishlistCount(): Promise<number> {
  try {
    return await customerWishlistApi.getWishlistCount();
  } catch {
    return 0;
  }
}

export async function addToWishlist(
  data: string | { productId?: number; variantId?: string; variantUnitPriceId?: string }
): Promise<any> {
  const id = typeof data === "string" ? data : data.variantUnitPriceId || data.variantId;
  if (!id) {
    throw new Error("No variant or unit price selected");
  }
  return await customerWishlistApi.addToWishlist(id);
}

export async function removeFromWishlist(id: number | string): Promise<void> {
  await customerWishlistApi.removeFromWishlist(String(id));
}

export async function moveWishlistItemToCart(
  variantUnitPriceId: string
): Promise<{ success: boolean; message: string }> {
  try {
    return await customerWishlistApi.moveToCart(variantUnitPriceId);
  } catch (error: any) {
    return { success: false, message: error?.message || "Failed to move item to cart" };
  }
}

export async function checkWishlistStatus(
  _productId: number | string
): Promise<{ isInWishlist: boolean }> {
  return { isInWishlist: false };
}
