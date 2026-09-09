import { apiClient } from "@/lib/api/api-client";
import type { UserListItem, GetUserResult } from "../types";

export async function getUsers(params?: Record<string, string | number | boolean | undefined | null>) {
  const response = await apiClient.get<UserListItem[]>("/api/users", { params });
  return {
    data: response.data!,
    meta: response.meta!,
  } satisfies GetUserResult;
}

export async function getUser(id: string | number) {
  const response = await apiClient.get<UserListItem>(`/api/users/${id}`);
  return response;
}

export async function createUser(data: Record<string, unknown>) {
  const response = await apiClient.post<UserListItem>("/api/users", data);
  return response;
}

export async function updateUser(id: string | number, data: Record<string, unknown>) {
  const response = await apiClient.put<UserListItem>(`/api/users/${id}`, data);
  return response;
}

export async function deleteUser(id: string | number) {
  const response = await apiClient.delete<null>(`/api/users/${id}`);
  return response;
}

export async function resetPassword(id: string | number, data: { password: string }) {
  const response = await apiClient.put<null>(`/api/users/${id}/password`, data);
  return response;
}
