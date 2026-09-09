"use client";

import { useQuery } from "@tanstack/react-query";
import { adminCustomerKeys } from "@/lib/api/query-keys";
import { getAdminCustomerDetail } from "../api/admin-customers.api";

export function useAdminCustomerDetail(id: string) {
  const cleanId = id?.trim();

  return useQuery({
    queryKey: adminCustomerKeys.detail(cleanId),
    queryFn: () => getAdminCustomerDetail(cleanId),
    enabled: Boolean(cleanId && cleanId !== "default"),
    staleTime: 30 * 1000,
  });
}
