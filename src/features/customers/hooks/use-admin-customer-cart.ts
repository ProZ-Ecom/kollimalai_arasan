"use client";

import { useQuery } from "@tanstack/react-query";
import { adminCustomerKeys } from "@/lib/api/query-keys";
import { getAdminCustomerCart } from "../api/admin-customers.api";

export function useAdminCustomerCart(uuid: string | null | undefined) {
  const cleanUuid = uuid?.trim() || "";

  return useQuery({
    queryKey: [...adminCustomerKeys.detail(cleanUuid), "cart"],
    queryFn: () => getAdminCustomerCart(cleanUuid),
    enabled: Boolean(cleanUuid),
    staleTime: 30 * 1000,
  });
}
