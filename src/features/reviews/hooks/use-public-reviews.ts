"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";
import type {
  PublicReviewItem,
  RatingSummary,
  PublicReviewsResponse,
} from "../types/review.types";

export type { PublicReviewsResponse };

export function usePublicProductReviews(
  productIdOrSlug?: string | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ["products", productIdOrSlug, "reviews"],
    queryFn: async () => {
      if (!productIdOrSlug) return null;
      const response = await apiClient.get<PublicReviewsResponse>(
        `/api/products/${encodeURIComponent(productIdOrSlug)}/reviews`
      );
      return response.data ?? {
        reviews: [],
        ratingSummary: {
          averageRating: 0,
          totalReviews: 0,
          ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      };
    },
    enabled: Boolean(productIdOrSlug) && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

export function usePublicVariantReviews(
  variantIdOrSlug?: string | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ["variants", variantIdOrSlug, "reviews"],
    queryFn: async () => {
      if (!variantIdOrSlug) return null;
      const response = await apiClient.get<PublicReviewsResponse>(
        `/api/product-variants/${encodeURIComponent(variantIdOrSlug)}/reviews`
      );
      return response.data ?? {
        reviews: [],
        ratingSummary: {
          averageRating: 0,
          totalReviews: 0,
          ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      };
    },
    enabled: Boolean(variantIdOrSlug) && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

