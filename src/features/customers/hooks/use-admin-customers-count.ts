"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { adminCustomerKeys } from "@/lib/api/query-keys";
import { countAdminCustomers } from "../api/admin-customers.api";
import type { AdminCustomerListInput } from "../validations/admin-customer.schema";
import type { AdminCustomersCountResponse } from "../types/admin-customer.types";

export function useAdminCustomersCount(
  params?: Partial<AdminCustomerListInput>
) {
  const queryParams: Record<string, unknown> = {};

  if (params?.search) queryParams.search = params.search;
  if (params?.status) queryParams.status = params.status;
  if (params?.isActive !== undefined) queryParams.isActive = params.isActive;
  if (params?.isBlocked !== undefined) queryParams.isBlocked = params.isBlocked;
  if (params?.gender) queryParams.gender = params.gender;
  if (params?.isWhatsapp !== undefined) queryParams.isWhatsapp = params.isWhatsapp;
  if (params?.emailVerified !== undefined) queryParams.emailVerified = params.emailVerified;
  if (params?.phoneVerified !== undefined) queryParams.phoneVerified = params.phoneVerified;

  return useQuery<AdminCustomersCountResponse>({
    queryKey: [...adminCustomerKeys.all, "count", queryParams] as const,
    queryFn: () => countAdminCustomers(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}
