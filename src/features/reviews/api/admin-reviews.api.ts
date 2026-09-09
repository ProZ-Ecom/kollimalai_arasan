import { apiClient } from "@/lib/api/api-client";
import type {
  ReviewResponse,
  ReviewModerateResult,
  AdminReviewListParams,
} from "../types/review.types";

export interface PaginatedReviewResult {
  data: ReviewResponse[];
  meta: {
    page: number;
    limit: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 1. List All Reviews (Admin / Staff)
 * Postman: POST /admin/reviews/list
 */
export async function getAdminReviews(
  params?: AdminReviewListParams
): Promise<PaginatedReviewResult> {
  const page = Number(params?.page) || 1;
  const limit = Number(params?.limit) || 10;

  const body: Record<string, unknown> = {
    page,
    limit,
    sortBy: params?.sortBy ?? "createdAt",
    sortOrder: params?.sortOrder ?? "desc",
  };

  if (params?.isApproved !== undefined && params?.isApproved !== null) {
    body.isApproved = params.isApproved;
  }

  if (params?.rating !== undefined && params?.rating !== null) {
    body.rating = Number(params.rating);
  }

  if (params?.search && params.search.trim()) {
    body.search = params.search.trim();
  }

  if (params?.variantId && params.variantId.trim()) {
    body.variantId = params.variantId.trim();
  }

  if (params?.productId && params.productId.trim()) {
    body.productId = params.productId.trim();
  }

  const response = await apiClient.post<ReviewResponse[]>(
    "/api/admin/reviews/list",
    body
  );

  const reviews = Array.isArray(response.data) ? response.data : [];
  const meta = response.meta ?? {
    page,
    limit,
    pageSize: limit,
    total: reviews.length,
    totalPages: Math.ceil(reviews.length / limit) || 1,
  };

  return {
    data: reviews,
    meta: {
      page: meta.page ?? page,
      limit: meta.limit ?? limit,
      pageSize: meta.pageSize ?? meta.limit ?? limit,
      total: meta.total ?? reviews.length,
      totalPages: meta.totalPages ?? (Math.ceil(reviews.length / limit) || 1),
    },
  };
}

/**
 * 2. Get Review Details (Admin / Staff)
 * Postman: GET /admin/reviews/{reviewId}
 */
export async function getAdminReviewById(
  reviewId: string
): Promise<ReviewResponse> {
  if (!reviewId) {
    throw new Error("Review ID is required");
  }

  const response = await apiClient.get<ReviewResponse>(
    `/api/admin/reviews/${encodeURIComponent(reviewId)}`
  );

  if (!response.data) {
    throw new Error("Failed to fetch review details");
  }

  return response.data;
}

/**
 * 3. Approve or Reject Review (Admin / Staff)
 * Postman: PUT /admin/reviews/{reviewId}/status
 * Body: { isApproved: boolean }
 */
export async function updateReviewStatus(
  reviewId: string,
  isApproved: boolean
): Promise<ReviewModerateResult> {
  if (!reviewId) {
    throw new Error("Review ID is required");
  }

  const response = await apiClient.put<ReviewModerateResult>(
    `/api/admin/reviews/${encodeURIComponent(reviewId)}/status`,
    { isApproved }
  );

  if (!response.data) {
    throw new Error("Failed to update review status");
  }

  return response.data;
}

/**
 * 4. Delete Review (Admin / Staff)
 * Postman: DELETE /admin/reviews/{reviewId}
 */
export async function deleteAdminReview(reviewId: string): Promise<void> {
  if (!reviewId) {
    throw new Error("Review ID is required");
  }

  await apiClient.delete<null>(
    `/api/admin/reviews/${encodeURIComponent(reviewId)}`
  );
}
