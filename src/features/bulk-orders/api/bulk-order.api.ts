import { apiClient } from "@/lib/api/api-client";
import type { BulkOrderEnquiryResponse } from "../types";
import type { CreateBulkOrderInput } from "../validations/bulk-order.schema";

/**
 * Submit a bulk order enquiry (public, customer-facing form)
 * POST /api/bulk-order
 */
export async function submitBulkOrderEnquiry(
  input: CreateBulkOrderInput
): Promise<BulkOrderEnquiryResponse> {
  const response = await apiClient.post<BulkOrderEnquiryResponse>(
    "/api/bulk-order",
    input
  );

  return response.data;
}
