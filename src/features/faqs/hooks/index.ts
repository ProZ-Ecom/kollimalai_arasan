"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "@/components/ui/Toast";
import { faqApi } from "../api/faq.api";
import type {
  CreateFaqPayload,
  UpdateFaqPayload,
  FaqListQueryInput,
  PublicFaqQueryInput,
  UpdateFaqOrderInput,
  UpdateFaqStatusInput,
} from "../validations/faq.schema";

export const FAQ_KEYS = {
  all: ["faqs"] as const,
  lists: () => [...FAQ_KEYS.all, "list"] as const,
  list: (params?: FaqListQueryInput) =>
    [...FAQ_KEYS.lists(), params] as const,
  details: () => [...FAQ_KEYS.all, "detail"] as const,
  detail: (id: string) => [...FAQ_KEYS.details(), id] as const,
  categories: () => [...FAQ_KEYS.all, "categories"] as const,
  public: (params?: PublicFaqQueryInput) =>
    [...FAQ_KEYS.all, "public", params] as const,
};

/** Storefront FAQ page — active FAQs, already sorted by display order. */
export function usePublicFaqs(
  params?: PublicFaqQueryInput,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: FAQ_KEYS.public(params),
    queryFn: () => faqApi.getFaqs(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useAdminFaqs(
  params?: FaqListQueryInput,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: FAQ_KEYS.list(params),
    queryFn: () => faqApi.getAdminFaqs(params),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useFaq(id: string | null) {
  return useQuery({
    queryKey: FAQ_KEYS.detail(id ?? ""),
    queryFn: () => faqApi.getFaqById(id!),
    enabled: !!id,
  });
}

export function useFaqCategories() {
  return useQuery({
    queryKey: FAQ_KEYS.categories(),
    queryFn: () => faqApi.getFaqCategories(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFaqPayload) => faqApi.createFaq(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAQ_KEYS.all });
    },
  });
}

export function useUpdateFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFaqPayload }) =>
      faqApi.updateFaq(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: FAQ_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: FAQ_KEYS.detail(variables.id),
      });
    },
  });
}

export function useDeleteFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => faqApi.deleteFaq(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAQ_KEYS.all });
    },
  });
}

export function useUpdateFaqStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFaqStatusInput }) =>
      faqApi.updateFaqStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAQ_KEYS.all });
    },
  });
}

export function useUpdateFaqOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateFaqOrderInput) => faqApi.updateFaqOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAQ_KEYS.all });
    },
  });
}
