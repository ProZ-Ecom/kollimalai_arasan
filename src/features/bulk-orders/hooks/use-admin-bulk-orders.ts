"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { adminBulkOrderKeys } from "@/lib/api/query-keys";
import {
  getAdminBulkOrders,
  getAdminBulkOrderDetail,
} from "../api/admin-bulk-order.api";
import type { AdminBulkOrderListInput } from "../validations/bulk-order.schema";
import type {
  AdminBulkOrderListResponse,
  BulkOrderEnquiryResponse,
} from "../types";

export function useAdminBulkOrders(params?: Partial<AdminBulkOrderListInput>) {
  return useQuery<AdminBulkOrderListResponse>({
    queryKey: adminBulkOrderKeys.list(params as Record<string, unknown>),
    queryFn: () => getAdminBulkOrders(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useAdminBulkOrderDetail(uuid?: string | null) {
  return useQuery<BulkOrderEnquiryResponse>({
    queryKey: adminBulkOrderKeys.detail(uuid || ""),
    queryFn: () => getAdminBulkOrderDetail(uuid!),
    enabled: Boolean(uuid && uuid.trim().length > 0),
    staleTime: 10 * 1000,
  });
}
