"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { adminCustomerKeys } from "@/lib/api/query-keys";
import { getAdminCustomers } from "../api/admin-customers.api";
import type { AdminCustomerListInput } from "../validations/admin-customer.schema";

export function useAdminCustomers(params?: Partial<AdminCustomerListInput>) {
  const queryParams: Record<string, unknown> = {
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? 20,
    sortBy: params?.sortBy ?? "createdAt",
    sortOrder: params?.sortOrder ?? "desc",
  };

  if (params?.search) queryParams.search = params.search;
  if (params?.status) queryParams.status = params.status;
  if (params?.isActive !== undefined) queryParams.isActive = params.isActive;
  if (params?.isBlocked !== undefined) queryParams.isBlocked = params.isBlocked;
  if (params?.gender) queryParams.gender = params.gender;
  if (params?.isWhatsapp !== undefined) queryParams.isWhatsapp = params.isWhatsapp;
  if (params?.emailVerified !== undefined) queryParams.emailVerified = params.emailVerified;
  if (params?.phoneVerified !== undefined) queryParams.phoneVerified = params.phoneVerified;

  return useQuery({
    queryKey: adminCustomerKeys.list(queryParams),
    queryFn: () => getAdminCustomers(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}
