import { db } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/api-error";
import { inventoryRepository } from "../repositories/inventory.repository";
import type {
  GetInventoryParams,
  InventoryListItem,
  AdjustStockInput,
  CreateInventoryInput,
  InventoryTransactionItem,
} from "../types";

function mapToInventoryListItem(item: any): InventoryListItem {
  return {
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
    reservedQuantity: item.reservedQuantity,
    reorderLevel: item.reorderLevel,
    availableQuantity: item.quantity - item.reservedQuantity,
    productName: item.product.name,
    productSlug: item.product.slug,
    variantName: item.variant?.name,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export const inventoryService = {
  async getInventory(params: GetInventoryParams) {
    const { data, total } = await inventoryRepository.findAll(params);

    return {
      data: data.map(mapToInventoryListItem),
      meta: {
        page: params.page || 1,
        limit: params.limit || 10,
        total,
        totalPages: Math.ceil(total / (params.limit || 10)),
      },
    };
  },

  async getInventoryItem(id: number) {
    const item = await inventoryRepository.findById(id);
    if (!item) {
      throw ApiError.notFound("Inventory item not found");
    }
    return mapToInventoryListItem(item);
  },

  async adjustStock(input: AdjustStockInput) {
    const inventory = await inventoryRepository.findById(input.inventoryId);
    if (!inventory) {
      throw ApiError.notFound("Inventory item not found");
    }

    const newQuantity = inventory.quantity + input.quantity;

    if (
      (input.type === "SALE" || input.type === "TRANSFER") &&
      newQuantity < 0
    ) {
      throw ApiError.badRequest(
        `Insufficient stock. Available: ${inventory.quantity}, Requested: ${Math.abs(input.quantity)}`
      );
    }

    const transaction = await db.$transaction(async (tx) => {
      const txn = await tx.inventoryTransaction.create({
        data: {
          inventory: { connect: { id: input.inventoryId } },
          type: input.type,
          quantity: input.quantity,
          notes: input.notes ?? undefined,
        },
      });
      await tx.inventory.update({
        where: { id: input.inventoryId },
        data: { quantity: newQuantity },
      });
      return txn;
    });

    return transaction;
  },

  async createInventory(input: CreateInventoryInput) {
    const existing = await inventoryRepository.findByProductAndVariant(
      input.productId,
      input.variantId
    );

    if (existing) {
      throw ApiError.conflict(
        "Inventory record already exists for this product variant"
      );
    }

    const inventory = await inventoryRepository.create({
      product: { connect: { id: input.productId } },
      variant: input.variantId
        ? { connect: { id: input.variantId } }
        : undefined,
      quantity: input.quantity,
      reorderLevel: input.reorderLevel ?? 10,
    });

    return mapToInventoryListItem(inventory);
  },

  async getLowStock() {
    const items = await db.inventory.findMany({
      where: {
        quantity: { gt: 0 },
      },
      include: {
        product: { select: { name: true, slug: true } },
        variant: { select: { name: true } },
      },
    });

    const lowStockItems = items.filter(
      (item) => item.quantity <= item.reorderLevel
    );

    return lowStockItems.map(mapToInventoryListItem);
  },

  async getOutOfStock() {
    const items = await db.inventory.findMany({
      where: { quantity: 0 },
      include: {
        product: { select: { name: true, slug: true } },
        variant: { select: { name: true } },
      },
    });

    return items.map(mapToInventoryListItem);
  },

  async getTransactions(
    inventoryId: number,
    params: { page?: number; limit?: number; type?: string }
  ) {
    const inventory = await inventoryRepository.findById(inventoryId);
    if (!inventory) {
      throw ApiError.notFound("Inventory item not found");
    }

    const { data, total } =
      await inventoryRepository.findTransactionsByInventoryId(inventoryId, {
        page: params.page,
        limit: params.limit,
        type: params.type as any,
      });

    const mapped: InventoryTransactionItem[] = data.map((t) => ({
      id: t.id,
      inventoryId: t.inventoryId,
      type: t.type,
      quantity: t.quantity,
      referenceType: t.referenceType,
      referenceId: t.referenceId,
      notes: t.notes,
      createdAt: t.createdAt,
      productName: t.inventory.product.name,
    }));

    return {
      data: mapped,
      meta: {
        page: params.page || 1,
        limit: params.limit || 20,
        total,
        totalPages: Math.ceil(total / (params.limit || 20)),
      },
    };
  },
};
