import { apiClient } from "@/lib/api/api-client";
import type {
  BannerDto,
  BannerListResponse,
  CreateBannerPayload,
  UpdateBannerPayload,
  BannerListQueryInput,
  BannerPositionDto,
  BannerPositionListResponse,
  CreateBannerPositionInput,
  UpdateBannerPositionInput,
  BannerPositionListQueryInput,
  CustomerBannerDto,
  CustomerBannerQueryInput,
} from "../types";

export const bannerApi = {
  // Storefront (public) banners
  async getCustomerBanners(
    params?: CustomerBannerQueryInput
  ): Promise<CustomerBannerDto[]> {
    const response = await apiClient.get<CustomerBannerDto[]>(
      "/api/customer/banners",
      {
        params: params as Record<
          string,
          string | number | boolean | undefined | null
        >,
      }
    );
    return response.data ?? [];
  },


  // Admin Banners
  async getBanners(params?: BannerListQueryInput): Promise<BannerListResponse> {
    const response = await apiClient.get<BannerDto[]>("/api/admin/banners", {
      params: params as Record<
        string,
        string | number | boolean | undefined | null
      >,
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

  async getBanner(uuid: string): Promise<BannerDto> {
    const response = await apiClient.get<BannerDto>(
      `/api/admin/banners/${uuid}`
    );
    return response.data!;
  },

  async createBanner(
    data: CreateBannerPayload
  ): Promise<BannerDto & { message?: string }> {
    const response = await apiClient.post<BannerDto>("/api/admin/banners", data);
    return {
      ...response.data!,
      message: response.message,
    };
  },

  async updateBanner(
    uuid: string,
    data: UpdateBannerPayload
  ): Promise<BannerDto & { message?: string }> {
    const response = await apiClient.put<BannerDto>(
      `/api/admin/banners/${uuid}`,
      data
    );
    return {
      ...response.data!,
      message: response.message,
    };
  },

  async deleteBanner(uuid: string): Promise<{ message?: string }> {
    const response = await apiClient.delete(`/api/admin/banners/${uuid}`);
    return {
      message: response.message,
    };
  },

  // Admin Banner Positions
  async getBannerPositions(
    params?: BannerPositionListQueryInput
  ): Promise<BannerPositionListResponse> {
    const response = await apiClient.get<BannerPositionDto[]>(
      "/api/admin/banner-positions",
      {
        params: params as Record<
          string,
          string | number | boolean | undefined | null
        >,
      }
    );
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

  async getBannerPosition(uuid: string): Promise<BannerPositionDto> {
    const response = await apiClient.get<BannerPositionDto>(
      `/api/admin/banner-positions/${uuid}`
    );
    return response.data!;
  },

  async createBannerPosition(
    data: CreateBannerPositionInput
  ): Promise<BannerPositionDto> {
    const response = await apiClient.post<BannerPositionDto>(
      "/api/admin/banner-positions",
      data
    );
    return response.data!;
  },

  async updateBannerPosition(
    uuid: string,
    data: UpdateBannerPositionInput
  ): Promise<BannerPositionDto> {
    const response = await apiClient.put<BannerPositionDto>(
      `/api/admin/banner-positions/${uuid}`,
      data
    );
    return response.data!;
  },

  async deleteBannerPosition(uuid: string): Promise<void> {
    await apiClient.delete(`/api/admin/banner-positions/${uuid}`);
  },
};

export const getBanners = bannerApi.getBanners;
export const getBanner = bannerApi.getBanner;
export const createBanner = bannerApi.createBanner;
export const updateBanner = bannerApi.updateBanner;
export const deleteBanner = bannerApi.deleteBanner;
export const getBannerPositions = bannerApi.getBannerPositions;

