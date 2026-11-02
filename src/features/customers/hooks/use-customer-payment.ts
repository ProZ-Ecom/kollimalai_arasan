"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  customerPaymentApi,
  type VerifyPaymentResult,
  type ReconcilePaymentResult,
} from "../api/customer-payment.api";
import { CUSTOMER_ORDERS_QUERY_KEY } from "./use-customer-orders";
import { CUSTOMER_CART_QUERY_KEY } from "./use-customer-cart";
import type {
  CreateRazorpayOrderInput,
  VerifyRazorpayPaymentInput,
  ReconcileRazorpayPaymentInput,
  RazorpayOrderResponse,
} from "@/features/payment/validations/payment.schema";

export function useCreateRazorpayOrder() {
  return useMutation<RazorpayOrderResponse, Error, CreateRazorpayOrderInput>({
    mutationFn: (payload) => customerPaymentApi.createRazorpayOrder(payload),
  });
}

export function useVerifyRazorpayPayment() {
  const queryClient = useQueryClient();

  return useMutation<VerifyPaymentResult, Error, VerifyRazorpayPaymentInput>({
    mutationFn: (payload) => customerPaymentApi.verifyPayment(payload),
    onSuccess: () => {
      // Invalidate customer orders and cart caches
      queryClient.invalidateQueries({
        queryKey: CUSTOMER_ORDERS_QUERY_KEY,
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: CUSTOMER_CART_QUERY_KEY,
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["cart"],
        refetchType: "all",
      });
    },
  });
}

export function useReconcileRazorpayPayment() {
  const queryClient = useQueryClient();

  return useMutation<ReconcilePaymentResult, Error, ReconcileRazorpayPaymentInput>({
    mutationFn: (payload) => customerPaymentApi.reconcilePayment(payload),
    onSuccess: (data) => {
      if (data?.success || data?.alreadyProcessed) {
        queryClient.invalidateQueries({
          queryKey: CUSTOMER_ORDERS_QUERY_KEY,
          refetchType: "all",
        });
        queryClient.invalidateQueries({
          queryKey: CUSTOMER_CART_QUERY_KEY,
          refetchType: "all",
        });
        queryClient.invalidateQueries({
          queryKey: ["cart"],
          refetchType: "all",
        });
      }
    },
  });
}

