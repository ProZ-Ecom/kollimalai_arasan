"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { wishlistKeys, cartKeys } from "@/lib/api/query-keys";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveWishlistItemToCart,
  getWishlistCount,
} from "../api/get-wishlist";

/**
 * Convenience wrapper for browsing pages that just need to know which pack
 * sizes (VariantUnitPrice UUIDs) are already in the signed-in user's
 * wishlist, e.g. to render a filled-in heart icon on a product card.
 */
export function useWishlistedUnitPriceIds(options?: { enabled?: boolean }) {
  const { data, isLoading } = useWishlist(options);
  const ids = useMemo(
    () => new Set((data?.items ?? []).map((item) => item.variantUnitPriceId)),
    [data]
  );
  return { wishlistedIds: ids, isLoading };
}

export function useWishlist(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: wishlistKeys.all,
    queryFn: getWishlist,
    enabled: options?.enabled,
  });
}

export function useWishlistCount(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...wishlistKeys.all, "count"],
    queryFn: getWishlistCount,
    enabled: options?.enabled,
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variantUnitPriceId: string) => addToWishlist(variantUnitPriceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
      queryClient.invalidateQueries({ queryKey: ["customer", "wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["customer", "cart"] });
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variantUnitPriceId: string) => removeFromWishlist(variantUnitPriceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
      queryClient.invalidateQueries({ queryKey: ["customer", "wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["customer", "cart"] });
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useMoveWishlistItemToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variantUnitPriceId: string) => moveWishlistItemToCart(variantUnitPriceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
      queryClient.invalidateQueries({ queryKey: ["customer", "wishlist"] });
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      queryClient.invalidateQueries({ queryKey: ["customer", "cart"] });
    },
  });
}
