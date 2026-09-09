"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { customerWishlistApi } from "../api/customer-wishlist.api";

export const CUSTOMER_WISHLIST_QUERY_KEY = ["customer", "wishlist"] as const;

export function useCustomerWishlist(options?: { enabled?: boolean }) {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  return useQuery({
    queryKey: CUSTOMER_WISHLIST_QUERY_KEY,
    queryFn: () => customerWishlistApi.getWishlist(),
    staleTime: 1000 * 30, // 30 seconds
    enabled: isAuthenticated && (options?.enabled ?? true),
  });
}

export function useCustomerWishlistCount(options?: { enabled?: boolean }) {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  return useQuery({
    queryKey: [...CUSTOMER_WISHLIST_QUERY_KEY, "count"],
    queryFn: () => customerWishlistApi.getWishlistCount(),
    staleTime: 0,
    enabled: isAuthenticated && (options?.enabled ?? true),
  });
}

export function useAddCustomerWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variantId: string) => customerWishlistApi.addToWishlist(variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_WISHLIST_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["customer", "cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useRemoveCustomerWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variantUuid: string) =>
      customerWishlistApi.removeFromWishlist(variantUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_WISHLIST_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["customer", "cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useMoveCustomerWishlistToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variantUuid: string) =>
      customerWishlistApi.moveToCart(variantUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_WISHLIST_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["customer", "cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}
