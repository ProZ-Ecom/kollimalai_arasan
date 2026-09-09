import { apiClient } from "@/lib/api/api-client";
import type {
  ApplicableOfferResponse,
  GetOffersParams,
  GetOffersResult,
  OfferItemTarget,
  OfferListItem,
  OfferProductTarget,
  SaveOfferInput,
  UpdateOfferInput,
} from "../types";

type QueryValue = string | number | boolean | undefined | null;

/** Drop empty filters so they never reach the API as `?level=`. */
function toQueryParams(params?: Record<string, QueryValue>): Record<string, QueryValue> {
  if (!params) return {};
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
}

export async function getOffers(params?: GetOffersParams): Promise<GetOffersResult> {
  const response = await apiClient.get<OfferListItem[]>("/api/offers", {
    params: toQueryParams(params as Record<string, QueryValue>),
  });
  return {
    data: response.data ?? [],
    meta: response.meta ?? { page: 1, limit: 10, total: 0, totalPages: 1 },
  };
}

export async function getOffer(id: string) {
  const response = await apiClient.get<OfferListItem>(`/api/offers/${id}`);
  return response.data;
}

export async function createOffer(data: SaveOfferInput | Record<string, unknown>) {
  return apiClient.post<OfferListItem>("/api/offers", data);
}

export async function updateOffer(
  id: string,
  data: UpdateOfferInput | Record<string, unknown>
) {
  return apiClient.put<OfferListItem>(`/api/offers/${id}`, data);
}

export async function updateOfferStatus(id: string, isActive: boolean) {
  return apiClient.patch<OfferListItem>(`/api/offers/${id}/status`, { isActive });
}

export async function deleteOffer(id: string) {
  return apiClient.delete<null>(`/api/offers/${id}`);
}

// --- Dependent dropdowns ----------------------------------------------------

export async function getOfferProductTargets(params: {
  categoryId?: string;
  search?: string;
  limit?: number;
}) {
  const response = await apiClient.get<OfferProductTarget[]>("/api/offers/targets/products", {
    params: toQueryParams(params),
  });
  return response.data ?? [];
}

export async function getOfferItemTargets(params: {
  productId?: string;
  categoryId?: string;
  search?: string;
  limit?: number;
}) {
  const response = await apiClient.get<OfferItemTarget[]>("/api/offers/targets/items", {
    params: toQueryParams(params),
  });
  return response.data ?? [];
}

/**
 * Categories for the offer filters and the form's first dropdown.
 *
 * `GET /api/admin/categories` returns `AdminCategoryResponse` rows, whose `id`
 * is the public UUID - which is what the offer APIs filter on. The shared
 * `useCategories` hook types the same endpoint as `CategoryListItem` (a
 * numeric `id`), so offers fetches it directly rather than inheriting that
 * mismatch.
 */
export async function getOfferCategoryOptions(limit = 100) {
  const response = await apiClient.get<Array<{ id: string; name: string }>>(
    "/api/admin/categories",
    { params: { pageSize: limit } }
  );
  return response.data ?? [];
}

// --- Customer-facing --------------------------------------------------------

export async function getOffersForProduct(productId: string) {
  const response = await apiClient.get<OfferListItem[]>(`/api/offers/products/${productId}`);
  return response.data ?? [];
}

export async function getOffersForItem(itemId: string) {
  const response = await apiClient.get<OfferListItem[]>(`/api/offers/items/${itemId}`);
  return response.data ?? [];
}

export async function getApplicableOffer(
  itemId: string,
  params?: { quantity?: number; cartValue?: number }
) {
  const response = await apiClient.get<ApplicableOfferResponse>(
    `/api/offers/applicable/${itemId}`,
    { params: toQueryParams(params) }
  );
  return response.data;
}
