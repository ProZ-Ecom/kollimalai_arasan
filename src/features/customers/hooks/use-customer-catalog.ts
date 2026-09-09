"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { customerCatalogApi } from "../api/customer-catalog.api";
import type {
  CustomerBrandListInput,
  CustomerCategoryListInput,
  CustomerProductListInput,
  CustomerVariantListInput,
  CustomerGlobalVariantListInput,
} from "../validations/catalog.schema";

export const CUSTOMER_CATALOG_QUERY_KEYS = {
  all: ["customer", "catalog"] as const,
  products: (params?: CustomerProductListInput) =>
    [...CUSTOMER_CATALOG_QUERY_KEYS.all, "products", params ?? {}] as const,
  product: (uuid: string) =>
    [...CUSTOMER_CATALOG_QUERY_KEYS.all, "product", uuid] as const,
  productVariants: (uuid: string, params?: CustomerVariantListInput) =>
    [...CUSTOMER_CATALOG_QUERY_KEYS.all, "product-variants", uuid, params ?? {}] as const,
  relatedProducts: (uuid: string, limit?: number) =>
    [...CUSTOMER_CATALOG_QUERY_KEYS.all, "related-products", uuid, limit ?? null] as const,
  variant: (productUuid: string, variantUuid: string) =>
    [...CUSTOMER_CATALOG_QUERY_KEYS.all, "variant", productUuid, variantUuid] as const,
  categories: (params?: CustomerCategoryListInput) =>
    [...CUSTOMER_CATALOG_QUERY_KEYS.all, "categories", params ?? {}] as const,
  category: (uuid: string) =>
    [...CUSTOMER_CATALOG_QUERY_KEYS.all, "category", uuid] as const,
  brands: (params?: CustomerBrandListInput) =>
    [...CUSTOMER_CATALOG_QUERY_KEYS.all, "brands", params ?? {}] as const,
  brand: (uuid: string) =>
    [...CUSTOMER_CATALOG_QUERY_KEYS.all, "brand", uuid] as const,
  globalVariants: (params?: CustomerGlobalVariantListInput) =>
    [...CUSTOMER_CATALOG_QUERY_KEYS.all, "global-variants", params ?? {}] as const,
  banners: (position?: string) =>
    [...CUSTOMER_CATALOG_QUERY_KEYS.all, "banners", position ?? "all"] as const,
};

/**
 * Fetch customer products with filters (brandIds, categoryIds, minPrice, maxPrice, search, sortBy, sortOrder)
 */
export function useCustomerProducts(
  params?: CustomerProductListInput,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: CUSTOMER_CATALOG_QUERY_KEYS.products(params),
    queryFn: () => customerCatalogApi.getProducts(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60, // 1 minute
    ...options,
  });
}

/**
 * Fetch single product details by product UUID
 */
export function useCustomerProduct(
  productUuid: string | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: CUSTOMER_CATALOG_QUERY_KEYS.product(productUuid ?? ""),
    queryFn: () => customerCatalogApi.getProduct(productUuid!),
    enabled: !!productUuid && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch related products (same category/brand) for a given product
 */
export function useCustomerRelatedProducts(
  productUuid: string | null,
  limit?: number,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: CUSTOMER_CATALOG_QUERY_KEYS.relatedProducts(productUuid ?? "", limit),
    queryFn: () => customerCatalogApi.getRelatedProducts(productUuid!, limit),
    enabled: !!productUuid && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch categories list for filters and navigation
 */
export function useCustomerCategories(
  params?: CustomerCategoryListInput,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: CUSTOMER_CATALOG_QUERY_KEYS.categories(params),
    queryFn: () => customerCatalogApi.getCategories(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Fetch brands list for filters
 */
export function useCustomerBrands(
  params?: CustomerBrandListInput,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: CUSTOMER_CATALOG_QUERY_KEYS.brands(params),
    queryFn: () => customerCatalogApi.getBrands(params),
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

/**
 * Fetch variants of a specific product
 */
export function useCustomerProductVariants(
  productUuid: string | null,
  params?: CustomerVariantListInput,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: CUSTOMER_CATALOG_QUERY_KEYS.productVariants(productUuid ?? "", params),
    queryFn: () => customerCatalogApi.getProductVariants(productUuid!, params),
    enabled: !!productUuid && (options?.enabled ?? true),
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetch single variant details
 */
export function useCustomerVariant(
  productUuid: string | null,
  variantUuid: string | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: CUSTOMER_CATALOG_QUERY_KEYS.variant(productUuid ?? "", variantUuid ?? ""),
    queryFn: () => customerCatalogApi.getVariant(productUuid!, variantUuid!),
    enabled: !!productUuid && !!variantUuid && (options?.enabled ?? true),
  });
}

/**
 * Fetch global variants list
 */
export function useCustomerGlobalVariants(
  params?: CustomerGlobalVariantListInput,
  options?: { enabled?: boolean; placeholderData?: any }
) {
  return useQuery({
    queryKey: CUSTOMER_CATALOG_QUERY_KEYS.globalVariants(params),
    queryFn: () => customerCatalogApi.getAllVariants(params),
    ...options,
  });
}

/**
 * Fetch active promotional banners
 */
export function useCustomerBanners(
  position?: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: CUSTOMER_CATALOG_QUERY_KEYS.banners(position),
    queryFn: () => customerCatalogApi.getBanners(position),
    staleTime: 1000 * 60 * 10,
    ...options,
  });
}
