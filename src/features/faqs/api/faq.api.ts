import { apiClient } from "@/lib/api/api-client";
import type {
  FaqDto,
  FaqListResponse,
  PublicFaqDto,
} from "../types/faq.types";
import type {
  CreateFaqPayload,
  UpdateFaqPayload,
  FaqListQueryInput,
  PublicFaqQueryInput,
  UpdateFaqOrderInput,
  UpdateFaqStatusInput,
} from "../validations/faq.schema";

type QueryParams = Record<string, string | number | boolean | undefined | null>;

export const faqApi = {
  // Storefront (public)
  async getFaqs(params?: PublicFaqQueryInput): Promise<PublicFaqDto[]> {
    const response = await apiClient.get<PublicFaqDto[]>("/api/faqs", {
      params: params as QueryParams,
    });
    return response.data ?? [];
  },

  // Admin
  async getAdminFaqs(params?: FaqListQueryInput): Promise<FaqListResponse> {
    const response = await apiClient.get<FaqDto[]>("/api/admin/faqs", {
      params: params as QueryParams,
    });
    return {
      data: response.data ?? [],
      meta: response.meta ?? {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        total: (response.data ?? []).length,
        totalPages: 1,
      },
    };
  },

  async getFaqById(id: string): Promise<FaqDto> {
    const response = await apiClient.get<FaqDto>(`/api/admin/faqs/${id}`);
    return response.data!;
  },

  async getFaqCategories(): Promise<string[]> {
    const response = await apiClient.get<string[]>(
      "/api/admin/faqs/categories"
    );
    return response.data ?? [];
  },

  async createFaq(
    data: CreateFaqPayload
  ): Promise<FaqDto & { message?: string }> {
    const response = await apiClient.post<FaqDto>("/api/admin/faqs", data);
    return { ...response.data!, message: response.message };
  },

  async updateFaq(
    id: string,
    data: UpdateFaqPayload
  ): Promise<FaqDto & { message?: string }> {
    const response = await apiClient.put<FaqDto>(
      `/api/admin/faqs/${id}`,
      data
    );
    return { ...response.data!, message: response.message };
  },

  async deleteFaq(id: string): Promise<{ message?: string }> {
    const response = await apiClient.delete(`/api/admin/faqs/${id}`);
    return { message: response.message };
  },

  async updateFaqStatus(
    id: string,
    data: UpdateFaqStatusInput
  ): Promise<FaqDto & { message?: string }> {
    const response = await apiClient.patch<FaqDto>(
      `/api/admin/faqs/${id}/status`,
      data
    );
    return { ...response.data!, message: response.message };
  },

  async updateFaqOrder(
    data: UpdateFaqOrderInput
  ): Promise<{ message?: string }> {
    const response = await apiClient.patch("/api/admin/faqs/order", data);
    return { message: response.message };
  },
};
