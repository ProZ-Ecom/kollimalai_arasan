import { apiClient } from "@/lib/api/api-client";
import type { CreateReviewInput } from "../validations/review.schema";
import type { ReviewResponse } from "../types/review.types";

export const customerReviewsApi = {
  /**
   * Submit a customer review for a variant / order item
   * POST /api/customer/reviews
   */
  async submitReview(data: CreateReviewInput): Promise<ReviewResponse> {
    const response = await apiClient.post<ReviewResponse>(
      "/api/customer/reviews",
      data
    );
    return response.data!;
  },
};
