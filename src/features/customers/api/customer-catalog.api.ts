import { apiClient } from "@/lib/api/api-client";
import type {
  CustomerBrandDto,
  CustomerCategoryDto,
  CustomerProductListItemDto,
  CustomerProductDetailDto,
  CustomerVariantListItemDto,
  CustomerVariantDetailDto,
} from "../types/catalog.types";
import type {
  CustomerBrandListInput,
  CustomerCategoryListInput,
  CustomerProductListInput,
  CustomerVariantListInput,
  CustomerGlobalVariantListInput,
} from "../validations/catalog.schema";
import type { ApiResponse } from "@/lib/api/api-response";

export interface PaginationMeta {
  page: number;
  limit: number;
  pageSize?: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta?: PaginationMeta;
}

export const customerCatalogApi = {
  /**
   * Fetch customer brand list
   * Postman: POST /api/customer/brands
   */
  async getBrands(
    params?: CustomerBrandListInput
  ): Promise<PaginatedResponse<CustomerBrandDto>> {
    const response = await apiClient.post<CustomerBrandDto[]>(
      "/api/customer/brands",
      params || {}
    );
    return {
      data: response.data ?? [],
      meta: response.meta as PaginationMeta | undefined,
    };
  },

  /**
   * Fetch single brand by UUID
   * Postman: GET /api/customer/brands/:uuid
   */
  async getBrand(uuid: string): Promise<CustomerBrandDto> {
    const response = await apiClient.get<CustomerBrandDto>(
      `/api/customer/brands/${uuid}`
    );
    return response.data!;
  },

  /**
   * Fetch customer categories list
   * Postman: POST /api/customer/categories
   */
  async getCategories(
    params?: CustomerCategoryListInput
  ): Promise<PaginatedResponse<CustomerCategoryDto>> {
    const response = await apiClient.post<CustomerCategoryDto[]>(
      "/api/customer/categories",
      params || {}
    );
    return {
      data: response.data ?? [],
      meta: response.meta as PaginationMeta | undefined,
    };
  },

  /**
   * Fetch single category by UUID
   * Postman: GET /api/customer/categories/:uuid
   */
  async getCategory(uuid: string): Promise<CustomerCategoryDto> {
    const response = await apiClient.get<CustomerCategoryDto>(
      `/api/customer/categories/${uuid}`
    );
    return response.data!;
  },

  /**
   * Fetch customer products list with filters (brands, categories, min/max price, search, sorting)
   * Postman: POST /api/customer/products
   */
  async getProducts(
    params?: CustomerProductListInput
  ): Promise<PaginatedResponse<CustomerProductListItemDto>> {
    const response = await apiClient.post<CustomerProductListItemDto[]>(
      "/api/customer/products",
      params || {}
    );
    return {
      data: response.data ?? [],
      meta: response.meta as PaginationMeta | undefined,
    };
  },

  /**
   * Fetch customer product detail by product UUID
   * Postman: GET /api/customer/products/:productUuid
   */
  async getProduct(productUuid: string): Promise<CustomerProductDetailDto> {
    const response = await apiClient.get<CustomerProductDetailDto>(
      `/api/customer/products/${productUuid}`
    );
    return response.data!;
  },

  /**
   * Fetch related products for a given product (same category/brand)
   * Postman: GET /api/customer/products/:productUuid/related
   */
  async getRelatedProducts(
    productUuid: string,
    limit?: number
  ): Promise<CustomerProductListItemDto[]> {
    const response = await apiClient.get<CustomerProductListItemDto[]>(
      `/api/customer/products/${productUuid}/related${limit ? `?limit=${limit}` : ""}`
    );
    return response.data ?? [];
  },

  /**
   * Fetch variants of a specific product with min/max price filter
   * Postman: POST /api/customer/products/:productUuid/variants
   */
  async getProductVariants(
    productUuid: string,
    params?: CustomerVariantListInput
  ): Promise<PaginatedResponse<CustomerVariantListItemDto>> {
    const response = await apiClient.post<CustomerVariantListItemDto[]>(
      `/api/customer/products/${productUuid}/variants`,
      params || {}
    );
    return {
      data: response.data ?? [],
      meta: response.meta as PaginationMeta | undefined,
    };
  },

  /**
   * Fetch single variant details
   * Postman: GET /api/customer/products/:productUuid/variants/:variantUuid
   */
  async getVariant(
    productUuid: string,
    variantUuid: string
  ): Promise<CustomerVariantDetailDto> {
    const response = await apiClient.get<CustomerVariantDetailDto>(
      `/api/customer/products/${productUuid}/variants/${variantUuid}`
    );
    return response.data!;
  },

  /**
   * Fetch all variants global catalog filter
   * Postman: POST /api/customer/variants
   */
  async getAllVariants(
    params?: CustomerGlobalVariantListInput
  ): Promise<PaginatedResponse<CustomerVariantListItemDto>> {
    const response = await apiClient.post<CustomerVariantListItemDto[]>(
      "/api/customer/variants",
      params || {}
    );
    return {
      data: response.data ?? [],
      meta: response.meta as PaginationMeta | undefined,
    };
  },

  /**
   * Fetch promotional banners
   * Postman: GET /api/customer/banners
   */
  async getBanners(position?: string) {
    const response = await apiClient.get<any[]>(
      `/api/customer/banners${position ? `?position=${position}` : ""}`
    );
    return response.data ?? [];
  },
};
