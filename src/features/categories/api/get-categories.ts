import { apiClient } from "@/lib/api/api-client";
import type {
  CategoryListItem,
  CategoryDetail,
  CustomerCategoryDto,
  CustomerCategoryListParams,
} from "../types";

export async function getCustomerCategories(params?: CustomerCategoryListParams) {
  const response = await apiClient.post<CustomerCategoryDto[]>(
    "/api/customer/categories",
    params ?? { page: 1, pageSize: 20, sortBy: "name", sortOrder: "asc" }
  );
  return response;
}

export async function getCustomerCategory(uuid: string) {
  const response = await apiClient.get<CustomerCategoryDto>(
    `/api/customer/categories/${uuid}`
  );
  return response;
}

export async function getCategories(params?: Record<string, string | number | boolean | undefined | null>) {
  const response = await apiClient.get<CategoryListItem[]>("/api/admin/categories", { params });
  return response;
}

export async function getCategory(slugOrId: string) {
  const response = await apiClient.get<CategoryDetail>(`/api/admin/categories/${slugOrId}`);
  return response;
}

export async function createCategory( data: Record<string, unknown>) {
  const response = await apiClient.post<CategoryDetail>("/api/admin/categories", data);
  return response;
}

export async function updateCategory(id: number, data: Record<string, unknown>) {
  const response = await apiClient.put<CategoryDetail>(`/api/admin/categories/${id}`, data);
  return response;
}

export async function deleteCategory(id: number) {
  const response = await apiClient.delete<null>(`/api/admin/categories/${id}`);
  return response;
}
