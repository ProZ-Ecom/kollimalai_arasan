"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { gstRateKeys } from "@/lib/api/query-keys";
import { getGstRates, getGstRate } from "../api/get-gst-rates";
import type { GetAdminGstRatesParams } from "../types";

export function useGstRates(params?: GetAdminGstRatesParams) {
  const queryParams: Record<
    string,
    string | number | boolean | undefined
  > = {};

  if (params?.search) queryParams.search = params.search;
  if (params?.page) queryParams.page = params.page;
  if (params?.pageSize) queryParams.pageSize = params.pageSize;

  return useQuery({
    queryKey: gstRateKeys.list(queryParams),
    queryFn: () => getGstRates(queryParams),
    placeholderData: keepPreviousData,
  });
}

export function useGstRate(uuid: string | null) {
  return useQuery({
    queryKey: gstRateKeys.detail(uuid ?? ""),
    queryFn: () => getGstRate(uuid!),
    enabled: !!uuid,
  });
}