import { apiClient } from "@/lib/api/api-client";
import type { CartResponse, AddToCartInput, UpdateCartItemInput } from "../types";

export async function getCart(): Promise<CartResponse> {
  const response = await apiClient.get<CartResponse>("/api/customer/cart");
  return response.data!;
}

export async function addToCart(data: AddToCartInput | { variantId: string; quantity?: number }): Promise<CartResponse> {
  const response = await apiClient.post<CartResponse>("/api/customer/cart/items", data);
  return response.data!;
}

export async function updateCartItem(
  itemId: string | number,
  data: UpdateCartItemInput
): Promise<CartResponse> {
  const response = await apiClient.put<CartResponse>(
    `/api/customer/cart/items/${itemId}`,
    data
  );
  return response.data!;
}

export async function removeCartItem(itemId: string | number): Promise<CartResponse> {
  const response = await apiClient.delete<CartResponse>(`/api/customer/cart/items/${itemId}`);
  return response.data!;
}

