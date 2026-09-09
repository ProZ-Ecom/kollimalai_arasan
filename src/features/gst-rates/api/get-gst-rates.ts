import { apiClient } from "@/lib/api/api-client";
import type { AdminGstRateResponse } from "../types";

export async function getGstRates(
  params?: Record<string, string | number | boolean | undefined | null>
) {
  const response = await apiClient.get<AdminGstRateResponse[]>(
    "/api/admin/gst-rates",
    { params }
  );

  return {
    data: response.data ?? [],
    meta: response.meta,
  };
}

export async function getGstRate(id: string) {
  return apiClient.get<AdminGstRateResponse>(`/api/admin/gst-rates/${id}`);
}

export async function createGstRate(data: Record<string, unknown>) {
  return apiClient.post<AdminGstRateResponse>("/api/admin/gst-rates", data);
}

export async function updateGstRate(
  id: string,
  data: Record<string, unknown>
) {
  return apiClient.put<AdminGstRateResponse>(
    `/api/admin/gst-rates/${id}`,
    data
  );
}

export async function deleteGstRate(id: string) {
  return apiClient.delete(`/api/admin/gst-rates/${id}`);
}