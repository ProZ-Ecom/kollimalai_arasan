import { apiClient } from "@/lib/api/api-client";
import type { AddressItem, CreateAddressInput, UpdateAddressInput } from "../types";

export async function getAddresses(): Promise<AddressItem[]> {
  const response = await apiClient.get<AddressItem[]>("/api/addresses");
  return response.data!;
}

export async function getAddress(id: number): Promise<AddressItem> {
  const response = await apiClient.get<AddressItem>(`/api/addresses/${id}`);
  return response.data!;
}

export async function createAddress(data: CreateAddressInput): Promise<AddressItem> {
  const response = await apiClient.post<AddressItem>("/api/addresses", data);
  return response.data!;
}

export async function updateAddress(
  id: number,
  data: UpdateAddressInput
): Promise<AddressItem> {
  const response = await apiClient.put<AddressItem>(`/api/addresses/${id}`, data);
  return response.data!;
}

export async function deleteAddress(id: number): Promise<{ success: boolean }> {
  const response = await apiClient.delete<{ success: boolean }>(`/api/addresses/${id}`);
  return response.data!;
}

export async function setDefaultAddress(id: number): Promise<AddressItem[]> {
  const response = await apiClient.patch<AddressItem[]>(`/api/addresses/${id}/default`);
  return response.data!;
}
