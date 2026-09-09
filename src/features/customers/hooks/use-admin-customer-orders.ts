"use client";

import { useQuery } from "@tanstack/react-query";
import { adminCustomerKeys } from "@/lib/api/query-keys";
import { getAdminCustomerOrders } from "../api/admin-customers.api";
import type { AdminCustomerOrdersInput } from "../validations/admin-customer.schema";

export function useAdminCustomerOrders(
  uuid?: string | null,
  params?: Partial<AdminCustomerOrdersInput>
) {
  const cleanUuid = uuid?.trim() || "";

  return useQuery({
    queryKey: [...adminCustomerKeys.detail(cleanUuid), "orders", params] as const,
    queryFn: () => getAdminCustomerOrders(cleanUuid, params),
    enabled: Boolean(cleanUuid && cleanUuid !== "default"),
    staleTime: 30 * 1000,
  });
}
