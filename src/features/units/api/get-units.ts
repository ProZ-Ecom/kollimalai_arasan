import { apiClient } from "@/lib/api/api-client";
import type { AdminUnitResponse } from "../types";

export async function getUnits(
  params?: Record<string, string | number | boolean | undefined | null>
) {
  const response = await apiClient.get<AdminUnitResponse[]>(
    "/api/admin/units",
    { params }
  );

  return {
    data: response.data ?? [],
    meta: response.meta,
  };
}

export async function getUnit(uuid: string) {
  return apiClient.get<AdminUnitResponse>(
    `/api/admin/units/${uuid}`
  );
}

export async function createUnit(data: Record<string, unknown>) {
  return apiClient.post<AdminUnitResponse>(
    "/api/admin/units",
    data
  );
}

export async function updateUnit(
  uuid: string,
  data: Record<string, unknown>
) {
  return apiClient.put<AdminUnitResponse>(
    `/api/admin/units/${uuid}`,
    data
  );
}

export async function deleteUnit(uuid: string) {
  return apiClient.delete(
    `/api/admin/units/${uuid}`
  );
}