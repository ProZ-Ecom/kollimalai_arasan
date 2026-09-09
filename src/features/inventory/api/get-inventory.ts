import { apiClient } from "@/lib/api/api-client";
import type {
  GetInventoryParams,
  GetInventoryResult,
  AdjustStockInput,
  CreateInventoryInput,
  InventoryListItem,
  InventoryTransactionItem,
} from "../types";

export async function getInventory(params: GetInventoryParams) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.lowStock) searchParams.set("lowStock", "true");
  if (params.outOfStock) searchParams.set("outOfStock", "true");

  const response = await apiClient.get<GetInventoryResult>(
    `/api/inventory?${searchParams.toString()}`
  );
  return response;
}

export async function getInventoryItem(id: string) {
  const response = await apiClient.get<InventoryListItem>(
    `/api/inventory/${id}`
  );
  return response;
}

export async function adjustStock(input: AdjustStockInput) {
  const response = await apiClient.post(
    "/api/inventory/adjust",
    input
  );
  return response;
}

export async function createInventory(input: CreateInventoryInput) {
  const response = await apiClient.post<InventoryListItem>(
    "/api/inventory",
    input
  );
  return response;
}

export async function getLowStock() {
  const response = await apiClient.get<InventoryListItem[]>(
    "/api/inventory/low-stock"
  );
  return response;
}

export async function getTransactions(
  inventoryId: string,
  params?: { page?: number; limit?: number; type?: string }
) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.type) searchParams.set("type", params.type);

  const response = await apiClient.get<{
    data: InventoryTransactionItem[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }>(`/api/inventory/${inventoryId}/transactions?${searchParams.toString()}`);
  return response;
}
