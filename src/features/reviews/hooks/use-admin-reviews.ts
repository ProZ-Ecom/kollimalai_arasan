"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { adminReviewKeys, reviewKeys, productKeys } from "@/lib/api/query-keys";
import { toast } from "@/components/ui/Toast";
import {
  getAdminReviews,
  getAdminReviewById,
  updateReviewStatus,
  deleteAdminReview,
} from "../api/admin-reviews.api";
import type {
  AdminReviewListParams,
  ReviewResponse,
  ReviewModerateResult,
} from "../types/review.types";

/**
 * Hook to query paginated admin reviews with filters
 */
export function useAdminReviews(params?: AdminReviewListParams) {
  const page = Number(params?.page) || 1;
  const limit = Number(params?.limit) || 10;

  const queryParams: Record<string, string | number | boolean | undefined> = {
    page,
    limit,
    search: params?.search,
    isApproved: params?.isApproved,
    rating: params?.rating,
    variantId: params?.variantId,
    productId: params?.productId,
    sortBy: params?.sortBy ?? "createdAt",
    sortOrder: params?.sortOrder ?? "desc",
  };

  return useQuery({
    queryKey: adminReviewKeys.list(queryParams),
    queryFn: () => getAdminReviews(params),
    placeholderData: keepPreviousData,
    staleTime: 15 * 1000,
  });
}

/**
 * Hook to query a single review's full details
 */
export function useAdminReview(reviewId: string | null) {
  return useQuery({
    queryKey: adminReviewKeys.detail(reviewId ?? ""),
    queryFn: () => getAdminReviewById(reviewId!),
    enabled: Boolean(reviewId),
    staleTime: 15 * 1000,
  });
}

/**
 * Hook to approve or reject/unapprove a review
 */
export function useUpdateReviewStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    ReviewModerateResult,
    Error,
    { reviewId: string; isApproved: boolean }
  >({
    mutationFn: ({ reviewId, isApproved }) =>
      updateReviewStatus(reviewId, isApproved),
    onSuccess: (result, variables) => {
      const action = variables.isApproved ? "approved" : "unapproved";
      toast.show({
        title: "Review Updated",
        description: `Review has been successfully ${action}.`,
        variant: "success",
      });

      queryClient.invalidateQueries({ queryKey: adminReviewKeys.all });
      queryClient.invalidateQueries({ queryKey: adminReviewKeys.detail(variables.reviewId) });
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
    onError: (err: any) => {
      toast.show({
        title: "Action Failed",
        description: err?.message || "Failed to update review status",
        variant: "error",
      });
    },
  });
}

/**
 * Hook to permanently delete a review
 */
export function useDeleteAdminReview() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (reviewId: string) => deleteAdminReview(reviewId),
    onSuccess: (_result, reviewId) => {
      toast.show({
        title: "Review Deleted",
        description: "The review has been permanently removed.",
        variant: "success",
      });

      queryClient.invalidateQueries({ queryKey: adminReviewKeys.all });
      queryClient.removeQueries({ queryKey: adminReviewKeys.detail(reviewId) });
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
    onError: (err: any) => {
      toast.show({
        title: "Deletion Failed",
        description: err?.message || "Failed to delete review",
        variant: "error",
      });
    },
  });
}
