"use client";

import { useQuery } from "@tanstack/react-query";
import { adminCustomerKeys } from "@/lib/api/query-keys";
import { getAdminCustomerAddresses } from "../api/admin-customers.api";

export function useAdminCustomerAddresses(uuid?: string | null) {
  const cleanUuid = uuid?.trim() || "";

  return useQuery({
    queryKey: [...adminCustomerKeys.detail(cleanUuid), "addresses"] as const,
    queryFn: () => getAdminCustomerAddresses(cleanUuid),
    enabled: Boolean(cleanUuid && cleanUuid !== "default"),
    staleTime: 30 * 1000,
  });
}
