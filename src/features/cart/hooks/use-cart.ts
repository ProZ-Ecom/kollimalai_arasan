"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartKeys } from "@/lib/api/query-keys";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
} from "../api/get-cart";
import type { AddToCartInput, UpdateCartItemInput } from "../types";

export function useCart() {
  return useQuery({
    queryKey: cartKeys.all,
    queryFn: getCart,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddToCartInput) => addToCart(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      queryClient.invalidateQueries({ queryKey: ["customer", "cart"] });
      queryClient.invalidateQueries({ queryKey: ["customer", "wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}

export function useUpdateCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      ...data
    }: UpdateCartItemInput & { itemId: string | number }) =>
      updateCartItem(itemId, { quantity: data.quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      queryClient.invalidateQueries({ queryKey: ["customer", "cart"] });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string | number) => removeCartItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      queryClient.invalidateQueries({ queryKey: ["customer", "cart"] });
    },
  });
}

