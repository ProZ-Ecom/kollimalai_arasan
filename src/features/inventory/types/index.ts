export type InventoryTransactionType =
  | "PURCHASE"
  | "SALE"
  | "RETURN"
  | "ADJUSTMENT"
  | "DAMAGE"
  | "TRANSFER";

export interface InventoryListItem {
  id: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  availableQuantity: number;
  productName: string;
  productSlug: string;
  variantName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryTransactionItem {
  id: number;
  inventoryId: number;
  type: string;
  quantity: number;
  referenceType: string | null;
  referenceId: number | null;
  notes: string | null;
  createdAt: Date;
  productName?: string;
}

export interface GetInventoryParams {
  page?: number;
  limit?: number;
  search?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetInventoryResult {
  data: InventoryListItem[];
  meta: PaginationMeta;
}

export interface AdjustStockInput {
  inventoryId: number;
  type: InventoryTransactionType;
  quantity: number;
  notes?: string;
}

export interface CreateInventoryInput {
  productId: number;
  variantId?: number;
  quantity: number;
  reorderLevel?: number;
}

export type LowStockResult = InventoryListItem[];
