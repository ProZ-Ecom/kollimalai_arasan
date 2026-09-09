"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";
import type { ProductWithRelations, ApiResponse } from "@/types";

interface UseProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
}

export function useProducts(params: UseProductsParams = {}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () =>
      apiClient.get<ProductWithRelations[]>("/api/products", { params: params as Record<string, string | number | boolean | undefined> }),
  });
}

export function useProduct(slugOrId: string) {
  return useQuery({
    queryKey: ["product", slugOrId],
    queryFn: () =>
      apiClient.get<ProductWithRelations>(`/api/products/${slugOrId}`),
    enabled: !!slugOrId,
  });
}
