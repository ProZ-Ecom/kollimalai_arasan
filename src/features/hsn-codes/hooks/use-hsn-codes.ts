"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { hsnCodeKeys } from "@/lib/api/query-keys";
import { getHsnCodes, getHsnCode } from "../api/get-hsn-codes";
import type { GetAdminHsnCodesParams } from "../types";

export function useHsnCodes(
  params?: GetAdminHsnCodesParams,
  options?: { enabled?: boolean }
) {
  const queryParams: Record<
    string,
    string | number | boolean | undefined
  > = {};

  if (params?.search) queryParams.search = params.search;
  if (params?.page) queryParams.page = params.page;
  if (params?.pageSize) queryParams.pageSize = params.pageSize;

  return useQuery({
    queryKey: hsnCodeKeys.list(queryParams),
    queryFn: () => getHsnCodes(queryParams),
    placeholderData: keepPreviousData,
    enabled: options?.enabled,
  });
}

export function useHsnCode(id: string | null) {
  return useQuery({
    queryKey: hsnCodeKeys.detail(id ?? ""),
    queryFn: () => getHsnCode(id!),
    enabled: !!id,
  });
}