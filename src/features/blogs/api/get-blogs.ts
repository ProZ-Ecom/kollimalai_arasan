import { apiClient } from "@/lib/api/api-client";
import type { BlogListItem, GetBlogsResult } from "../types";

export async function getBlogs(params?: Record<string, string | number | boolean | undefined | null>) {
  const response = await apiClient.get<BlogListItem[]>("/api/blogs", { params });
  return {
    data: response.data!,
    meta: response.meta!,
  } satisfies GetBlogsResult;
}

export async function getBlog(slugOrId: string) {
  const response = await apiClient.get<BlogListItem>(`/api/blogs/${slugOrId}`);
  return response;
}

export async function createBlog(data: Record<string, unknown>) {
  const response = await apiClient.post<BlogListItem>("/api/blogs", data);
  return response;
}

export async function updateBlog(id: number, data: Record<string, unknown>) {
  const response = await apiClient.put<BlogListItem>(`/api/blogs/${id}`, data);
  return response;
}

export async function deleteBlog(id: number) {
  const response = await apiClient.delete<null>(`/api/blogs/${id}`);
  return response;
}
