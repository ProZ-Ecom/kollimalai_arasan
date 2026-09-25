export type InventoryTransactionType =
  | "PURCHASE"
  | "SALE"
  | "RETURN"
  | "ADJUSTMENT"
  | "DAMAGE"
  | "TRANSFER";

export interface InventoryListItem {
  id: number;
  variantUnitPriceId?: number;
  productId: number;
  variantId: number | null;
  sku: string;
  basePrice: number;
  imageUrl: string | null;
  unitLabel: string;
  quantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  availableQuantity: number;
  warehouseLocation: string | null;
  productName: string;
  productSlug: string;
  variantName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryStats {
  totalSkus: number;
  totalUnits: number;
  reservedUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
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
  sku?: string;
  unitLabel?: string;
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
  warehouseLocation?: string;
}

export type LowStockResult = InventoryListItem[];
