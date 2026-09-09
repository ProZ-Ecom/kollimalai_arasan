import { apiClient } from "@/lib/api/api-client";
import type {
  CustomerWishlistResponse,
  CustomerWishlistItemDto,
} from "@/features/wishlist/types/wishlist.types";

export const customerWishlistApi = {
  /**
   * Fetch customer wishlist
   * Postman: GET /api/customer/wishlist
   */
  async getWishlist(): Promise<CustomerWishlistResponse> {
    const response = await apiClient.get<CustomerWishlistResponse>(
      "/api/customer/wishlist"
    );
    return response.data ?? { items: [], totalItems: 0 };
  },

  /**
   * Fetch customer wishlist count
   * Postman: GET /api/customer/wishlist/count
   */
  async getWishlistCount(): Promise<number> {
    const response = await apiClient.get<{ count: number }>(
      "/api/customer/wishlist/count"
    );
    return response.data?.count ?? 0;
  },

  /**
   * Add variant or unit price to wishlist
   * Postman: POST /api/customer/wishlist
   */
  async addToWishlist(
    identifier: string | { variantUnitPriceId?: string; variantId?: string }
  ): Promise<CustomerWishlistItemDto> {
    const payload =
      typeof identifier === "string"
        ? { variantUnitPriceId: identifier }
        : identifier;
    const response = await apiClient.post<CustomerWishlistItemDto>(
      "/api/customer/wishlist",
      payload
    );
    return response.data!;
  },

  /**
   * Remove variant from wishlist
   * Postman: DELETE /api/customer/wishlist/:variantUuid
   */
  async removeFromWishlist(variantUuid: string): Promise<void> {
    await apiClient.delete(`/api/customer/wishlist/${variantUuid}`);
  },

  /**
   * Move variant from wishlist to cart
   * Postman: POST /api/customer/wishlist/:variantUuid/move-to-cart
   */
  async moveToCart(variantUuid: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `/api/customer/wishlist/${variantUuid}/move-to-cart`,
      {}
    );
    return response.data!;
  },
};
