import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getInventory,
  getInventoryStats,
  getInventoryItem,
  adjustStock,
  createInventory,
  getLowStock,
  getTransactions,
  getAllTransactions,
} from "../api/get-inventory";
import type {
  GetInventoryParams,
  AdjustStockInput,
  CreateInventoryInput,
} from "../types";

export const inventoryKeys = {
  all: ["inventory"] as const,
  stats: () => [...inventoryKeys.all, "stats"] as const,
  list: (params: GetInventoryParams) =>
    [...inventoryKeys.all, "list", params] as const,
  detail: (id: string | number) => [...inventoryKeys.all, "detail", String(id)] as const,
  lowStock: () => [...inventoryKeys.all, "lowStock"] as const,
  transactions: (inventoryId: string | number, params?: any) =>
    [...inventoryKeys.all, "transactions", String(inventoryId), params] as const,
  allTransactions: (params?: any) =>
    [...inventoryKeys.all, "all-transactions", params] as const,
};

export function useInventoryStats() {
  return useQuery({
    queryKey: inventoryKeys.stats(),
    queryFn: () => getInventoryStats(),
  });
}

export function useInventory(params: GetInventoryParams) {
  return useQuery({
    queryKey: inventoryKeys.list(params),
    queryFn: () => getInventory(params),
  });
}

export function useInventoryItem(id: string | number) {
  return useQuery({
    queryKey: inventoryKeys.detail(id),
    queryFn: () => getInventoryItem(id),
    enabled: !!id,
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AdjustStockInput) => adjustStock(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useCreateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInventoryInput) => createInventory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useLowStock() {
  return useQuery({
    queryKey: inventoryKeys.lowStock(),
    queryFn: () => getLowStock(),
  });
}

export function useInventoryTransactions(
  inventoryId: string | number,
  params?: { page?: number; limit?: number; type?: string }
) {
  return useQuery({
    queryKey: inventoryKeys.transactions(inventoryId, params),
    queryFn: () => getTransactions(inventoryId, params),
    enabled: !!inventoryId,
  });
}

export function useAllInventoryTransactions(params?: {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: inventoryKeys.allTransactions(params),
    queryFn: () => getAllTransactions(params),
  });
}
