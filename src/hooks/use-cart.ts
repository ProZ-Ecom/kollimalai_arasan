"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  customerCartApi,
  CUSTOMER_CART_QUERY_KEY,
  type AddCartItemPayload,
} from "@/features/customers";

export function useCart() {
  return useQuery({
    queryKey: CUSTOMER_CART_QUERY_KEY,
    queryFn: () => customerCartApi.getCart(),
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddCartItemPayload) => customerCartApi.addItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_CART_QUERY_KEY });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      variantUuid,
      quantity,
    }: {
      variantUuid: string;
      quantity: number;
    }) => customerCartApi.updateQuantity(variantUuid, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_CART_QUERY_KEY });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variantUuid: string) =>
      customerCartApi.removeItem(variantUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_CART_QUERY_KEY });
    },
  });
}

