import { apiClient } from "@/lib/api/api-client";
import type { AdminHsnCodeResponse } from "../types";

export async function getHsnCodes(
  params?: Record<string, string | number | boolean | undefined | null>
) {
  const response = await apiClient.get<AdminHsnCodeResponse[]>(
    "/api/admin/hsn-codes",
    { params }
  );

  return {
    data: response.data ?? [],
    meta: response.meta,
  };
}

export async function getHsnCode(id: string) {
  return apiClient.get<AdminHsnCodeResponse>(`/api/admin/hsn-codes/${id}`);
}

export async function createHsnCode(data: Record<string, unknown>) {
  return apiClient.post<AdminHsnCodeResponse>("/api/admin/hsn-codes", data);
}

export async function updateHsnCode(
  id: string,
  data: Record<string, unknown>
) {
  return apiClient.put<AdminHsnCodeResponse>(
    `/api/admin/hsn-codes/${id}`,
    data
  );
}

export async function deleteHsnCode(id: string) {
  return apiClient.delete(`/api/admin/hsn-codes/${id}`);
}