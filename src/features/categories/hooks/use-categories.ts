"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { categoryKeys } from "@/lib/api/query-keys";
import {
  getCategories,
  getCategory,
  getCustomerCategories,
  getCustomerCategory,
} from "../api/get-categories";
import type {
  GetCategoriesParams,
  CustomerCategoryListParams,
} from "../types";

export function useCustomerCategories(params?: CustomerCategoryListParams) {
  const queryParams: Record<string, string | number | boolean | undefined> = {
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? 20,
    search: params?.search,
    sortBy: params?.sortBy ?? "name",
    sortOrder: params?.sortOrder ?? "asc",
  };

  return useQuery({
    queryKey: categoryKeys.list({ ...queryParams, type: "customer" }),
    queryFn: () => getCustomerCategories(params),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

export function useCustomerCategory(uuid: string | null) {
  return useQuery({
    queryKey: categoryKeys.detail(uuid ? `customer-${uuid}` : ""),
    queryFn: () => getCustomerCategory(uuid!),
    enabled: !!uuid,
  });
}

export function useCategories(
  params?: GetCategoriesParams,
  options?: { enabled?: boolean }
) {
  const queryParams: Record<string, string | number | boolean | undefined> = {};

  if (params?.page !== undefined) {
    queryParams.page = params.page;
  }

  if (params?.pageSize !== undefined) {
    queryParams.pageSize = params.pageSize;
  }

  if (params?.search) {
    queryParams.search = params.search;
  }

  if (params?.parentId !== undefined && params?.parentId !== null) {
    queryParams.parentId = params.parentId;
  }

  return useQuery({
    queryKey: categoryKeys.list(queryParams),
    queryFn: () => getCategories(queryParams),
    placeholderData: keepPreviousData,
    enabled: options?.enabled,
  });
}

export function useCategory(slugOrId: string | null) {
  return useQuery({
    queryKey: categoryKeys.detail(slugOrId ?? ""),
    queryFn: () => getCategory(slugOrId!),
    enabled: !!slugOrId,
  });
}