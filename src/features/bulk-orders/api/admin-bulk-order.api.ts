import { apiClient } from "@/lib/api/api-client";
import type {
  AdminBulkOrderListParams,
  AdminBulkOrderListResponse,
  AdminBulkOrderListItem,
  BulkOrderEnquiryResponse,
  BulkOrderEnquiryStatus,
} from "../types";
import type {
  AdminBulkOrderListInput,
  UpdateBulkOrderStatusInput,
} from "../validations/bulk-order.schema";

/**
 * Fetch paginated list of bulk order enquiries for admin
 * POST /api/admin/bulk-orders/list
 */
export async function getAdminBulkOrders(
  params?: Partial<AdminBulkOrderListInput>
): Promise<AdminBulkOrderListResponse> {
  const response = await apiClient.post<AdminBulkOrderListItem[]>(
    "/api/admin/bulk-orders/list",
    params ?? {
      page: 1,
      pageSize: 20,
      sortBy: "createdAt",
      sortOrder: "desc",
    }
  );

  return {
    data: response.data ?? [],
    meta: (response.meta as AdminBulkOrderListResponse["meta"]) ?? {
      page: params?.page ?? 1,
      limit: params?.pageSize ?? 20,
      pageSize: params?.pageSize ?? 20,
      total: response.data?.length ?? 0,
      totalPages: 1,
    },
  };
}

/**
 * Fetch single bulk order enquiry detail
 * GET /api/admin/bulk-orders/:uuid
 */
export async function getAdminBulkOrderDetail(
  uuid: string
): Promise<BulkOrderEnquiryResponse> {
  const cleanUuid = uuid.trim();
  const response = await apiClient.get<BulkOrderEnquiryResponse>(
    `/api/admin/bulk-orders/${encodeURIComponent(cleanUuid)}`
  );

  return response.data;
}

/**
 * Update bulk order enquiry status ("new" | "contacted" | "closed") and/or admin comment
 * PUT /api/admin/bulk-orders/:uuid/status
 */
export async function updateBulkOrderStatus(
  uuid: string,
  status: BulkOrderEnquiryStatus,
  comment?: string
): Promise<BulkOrderEnquiryResponse> {
  const cleanUuid = uuid.trim();
  const response = await apiClient.put<BulkOrderEnquiryResponse>(
    `/api/admin/bulk-orders/${encodeURIComponent(cleanUuid)}/status`,
    { status, comment }
  );

  return response.data;
}
