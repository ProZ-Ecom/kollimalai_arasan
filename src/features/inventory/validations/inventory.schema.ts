import { z } from "zod";

const inventoryTransactionTypeEnum = z.enum([
  "PURCHASE",
  "SALE",
  "RETURN",
  "ADJUSTMENT",
  "DAMAGE",
  "TRANSFER",
]);

export const getInventoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  lowStock: z.coerce.boolean().optional(),
  lowStockThreshold: z.coerce.number().int().min(1).optional(),
  reserved: z.coerce.boolean().optional(),
  outOfStock: z.coerce.boolean().optional(),
});

export const adjustStockSchema = z.object({
  inventoryId: z.coerce.number(),
  type: inventoryTransactionTypeEnum.default("ADJUSTMENT"),
  quantity: z.number().int().default(0),
  reorderLevel: z.number().int().min(0).optional(),
  releaseReserved: z.boolean().optional(),
  notes: z.string().optional(),
});

export const createInventorySchema = z.object({
  productId: z.coerce.number(),
  variantId: z.coerce.number().optional(),
  quantity: z.number().int().min(0),
  reorderLevel: z.number().int().min(0).optional(),
});

export type GetInventoryQuery = z.infer<typeof getInventoryQuerySchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
