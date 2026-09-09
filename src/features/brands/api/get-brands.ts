import { apiClient } from "@/lib/api/api-client";
import type { BrandListItem, BrandDetail, GetBrandsResult } from "../types";

export async function getBrands(params?: Record<string, string | number | boolean | undefined | null>) {
  const page = Number(params?.page) || 1;
  const limit = Number(params?.limit ?? params?.pageSize) || 10;
  const response = await apiClient.get<BrandListItem[]>("/api/brands", { params });
  const total = response.meta?.total ?? response.data?.length ?? 0;
  const totalPages = response.meta?.totalPages ?? Math.max(1, Math.ceil(total / limit));
  return {
    data: response.data ?? [],
    meta: {
      page: response.meta?.page ?? page,
      limit: response.meta?.limit ?? limit,
      pageSize: response.meta?.pageSize ?? limit,
      total,
      totalPages,
    },
  } satisfies GetBrandsResult;
}

export async function getBrand(uuid: string) {
  const response = await apiClient.get<BrandDetail>(`/api/admin/brands/${uuid}`);
  return response;
}

export async function createBrand(data: Record<string, unknown>) {
  const response = await apiClient.post<BrandDetail>("/api/admin/brands", data);
  return response;
}

export async function updateBrand(uuid: string, data: Record<string, unknown>) {
  const response = await apiClient.put<BrandDetail>(`/api/admin/brands/${uuid}`, data);
  return response;
}

export async function deleteBrand(uuid: string) {
  const response = await apiClient.delete<null>(`/api/admin/brands/${uuid}`);
  return response;
}
