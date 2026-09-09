import { apiClient } from "@/lib/api/api-client";
import type { CouponListItem, GetCouponsResult } from "../types";

export async function getCoupons(params?: Record<string, string | number | boolean | undefined | null>) {
  const response = await apiClient.get<CouponListItem[]>("/api/coupons", { params });
  return {
    data: response.data!,
    meta: response.meta!,
  } satisfies GetCouponsResult;
}

export async function getCoupon(id: number) {
  const response = await apiClient.get<CouponListItem>(`/api/coupons/${id}`);
  return response;
}

export async function createCoupon(data: Record<string, unknown>) {
  const response = await apiClient.post<CouponListItem>("/api/coupons", data);
  return response;
}

export async function updateCoupon(id: number, data: Record<string, unknown>) {
  const response = await apiClient.put<CouponListItem>(`/api/coupons/${id}`, data);
  return response;
}

export async function deleteCoupon(id: number) {
  const response = await apiClient.delete<null>(`/api/coupons/${id}`);
  return response;
}
