"use client";

import { useQuery } from "@tanstack/react-query";
import { adminCustomerKeys } from "@/lib/api/query-keys";
import { getAdminCustomerWishlist } from "../api/admin-customers.api";

export function useAdminCustomerWishlist(uuid: string | null | undefined) {
  const cleanUuid = uuid?.trim() || "";

  return useQuery({
    queryKey: [...adminCustomerKeys.detail(cleanUuid), "wishlist"],
    queryFn: () => getAdminCustomerWishlist(cleanUuid),
    enabled: Boolean(cleanUuid),
    staleTime: 30 * 1000,
  });
}
