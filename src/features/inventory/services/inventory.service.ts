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
  const vup = item.variant_unit_price;
  const variant = vup?.variant;
  const product = variant?.product;

  const reserved = Number(item.quantity_reserved || 0);
  const available = Number(item.quantity_available || 0);

  return {
    id: Number(item.id),
    productId: Number(product?.id || variant?.productId || 0),
    variantId: variant?.id ? Number(variant.id) : null,
    quantity: available + reserved,
    reservedQuantity: reserved,
    reorderLevel: Number(item.reorderLevel || 0),
    availableQuantity: available,
    productName: product?.name || "",
    productSlug: product?.slug || "",
    variantName: variant?.variant_name || undefined,
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

    const newQuantity = inventory.quantity_available + input.quantity;

    if (
      (input.type === "SALE" || input.type === "TRANSFER" || input.type === "DAMAGE") &&
      newQuantity < 0
    ) {
      throw ApiError.badRequest(
        `Insufficient stock. Available: ${inventory.quantity_available}, Requested: ${Math.abs(input.quantity)}`
      );
    }

    let txType: "in" | "out" | "reserved" | "released" = "in";
    if (
      input.type === "SALE" ||
      input.type === "DAMAGE" ||
      input.type === "TRANSFER" ||
      input.quantity < 0
    ) {
      txType = "out";
    } else {
      txType = "in";
    }

    const transaction = await db.$transaction(async (tx) => {
      const txn = await tx.inventoryTransaction.create({
        data: {
          variant_unit_price: { connect: { id: inventory.variantUnitPriceId } },
          type: txType,
          quantity: Math.abs(input.quantity),
          note: input.notes ?? undefined,
        },
      });
      await tx.inventory.update({
        where: { id: input.inventoryId },
        data: { quantity_available: newQuantity },
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

    const variantUnitPrice = await db.variantUnitPrice.findFirst({
      where: {
        variant: {
          productId: input.productId,
          ...(input.variantId ? { id: input.variantId } : {}),
        },
      },
    });

    if (!variantUnitPrice) {
      throw ApiError.notFound("Variant unit price record not found for product/variant");
    }

    const inventory = await inventoryRepository.create({
      variant_unit_price: { connect: { id: variantUnitPrice.id } },
      quantity_available: input.quantity,
      reorderLevel: input.reorderLevel ?? 10,
    });

    return mapToInventoryListItem(inventory);
  },

  async getLowStock() {
    const items = await db.inventory.findMany({
      where: {
        quantity_available: { gt: 0 },
      },
      include: {
        variant_unit_price: {
          include: {
            variant: {
              include: {
                product: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
      },
    });

    const lowStockItems = items.filter(
      (item) => item.quantity_available <= item.reorderLevel
    );

    return lowStockItems.map(mapToInventoryListItem);
  },

  async getOutOfStock() {
    const items = await db.inventory.findMany({
      where: { quantity_available: 0 },
      include: {
        variant_unit_price: {
          include: {
            variant: {
              include: {
                product: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
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

    const mapped: InventoryTransactionItem[] = data.map((t: any) => ({
      id: Number(t.id),
      inventoryId,
      type: t.type,
      quantity: t.quantity,
      referenceType: t.referenceType,
      referenceId: t.referenceId ? Number(t.referenceId) : null,
      notes: t.note,
      createdAt: t.createdAt,
      productName: t.variant_unit_price?.variant?.product?.name || "",
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
