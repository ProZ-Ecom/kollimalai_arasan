import { db } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/api-error";
import { inventoryRepository } from "../repositories/inventory.repository";
import type {
  GetInventoryParams,
  InventoryListItem,
  AdjustStockInput,
  CreateInventoryInput,
  InventoryTransactionItem,
  InventoryStats,
} from "../types";

function mapToInventoryListItem(item: any): InventoryListItem {
  const vup = item.variant_unit_price;
  const variant = vup?.variant;
  const product = variant?.product;
  const unit = vup?.product_units;

  const reserved = Number(item.quantity_reserved || 0);
  const available = Number(item.quantity_available || 0);
  const primaryImg = variant?.product_variant_images?.[0]?.image_url || null;

  let unitLabel = "";
  if (unit) {
    const val = Number(vup.unit_value);
    unitLabel = `${val > 0 ? val + " " : ""}${unit.name || unit.code}`;
  } else if (variant?.variant_name) {
    unitLabel = variant.variant_name;
  }

  return {
    id: Number(item.id),
    variantUnitPriceId: vup?.id ? Number(vup.id) : undefined,
    productId: Number(product?.id || variant?.productId || 0),
    variantId: variant?.id ? Number(variant.id) : null,
    sku: vup?.sku || "",
    basePrice: vup?.base_price ? Number(vup.base_price) : 0,
    imageUrl: primaryImg,
    unitLabel: unitLabel || variant?.variant_name || "Standard",
    quantity: available + reserved,
    reservedQuantity: reserved,
    reorderLevel: Number(item.reorderLevel || 0),
    availableQuantity: available,
    warehouseLocation: item.warehouse_location || null,
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

  async getStats(): Promise<InventoryStats> {
    const [totalSkus, items] = await Promise.all([
      db.inventory.count({ where: { is_active: true } }),
      db.inventory.findMany({
        where: { is_active: true },
        select: {
          quantity_available: true,
          quantity_reserved: true,
          reorderLevel: true,
        },
      }),
    ]);

    let totalUnits = 0;
    let reservedUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const item of items) {
      const avail = item.quantity_available || 0;
      const res = item.quantity_reserved || 0;
      const reorder = item.reorderLevel || 0;

      totalUnits += avail;
      reservedUnits += res;

      if (avail === 0) {
        outOfStockCount++;
      } else if (avail <= reorder) {
        lowStockCount++;
      }
    }

    return {
      totalSkus,
      totalUnits,
      reservedUnits,
      lowStockCount,
      outOfStockCount,
    };
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
          note: input.notes ? `${input.type}: ${input.notes}` : `${input.type}`,
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
      warehouse_location: input.warehouseLocation ?? null,
    });

    return mapToInventoryListItem(inventory);
  },

  async getLowStock() {
    const items = await db.inventory.findMany({
      where: {
        is_active: true,
        quantity_available: { gt: 0 },
      },
      include: {
        variant_unit_price: {
          include: {
            product_units: true,
            variant: {
              include: {
                product: { select: { id: true, name: true, slug: true } },
                product_variant_images: {
                  where: { is_active: true },
                  orderBy: [{ is_primary: "desc" }, { sort_order: "asc" }],
                  take: 1,
                },
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
      where: {
        is_active: true,
        quantity_available: 0,
      },
      include: {
        variant_unit_price: {
          include: {
            product_units: true,
            variant: {
              include: {
                product: { select: { id: true, name: true, slug: true } },
                product_variant_images: {
                  where: { is_active: true },
                  orderBy: [{ is_primary: "desc" }, { sort_order: "asc" }],
                  take: 1,
                },
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

    const mapped: InventoryTransactionItem[] = data.map((t: any) => {
      const vup = t.variant_unit_price;
      const unit = vup?.product_units;
      const val = Number(vup?.unit_value || 0);
      const unitLabel = unit ? `${val > 0 ? val + " " : ""}${unit.name || unit.code}` : "";

      return {
        id: Number(t.id),
        inventoryId,
        type: t.type,
        quantity: t.quantity,
        referenceType: t.referenceType,
        referenceId: t.referenceId ? Number(t.referenceId) : null,
        notes: t.note,
        createdAt: t.createdAt,
        productName: vup?.variant?.product?.name || "",
        sku: vup?.sku || "",
        unitLabel,
      };
    });

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

  async getAllTransactions(params: {
    page?: number;
    limit?: number;
    type?: any;
    search?: string;
  }) {
    const { data, total } = await inventoryRepository.findAllTransactions(params);

    const mapped: InventoryTransactionItem[] = data.map((t: any) => {
      const vup = t.variant_unit_price;
      const unit = vup?.product_units;
      const val = Number(vup?.unit_value || 0);
      const unitLabel = unit ? `${val > 0 ? val + " " : ""}${unit.name || unit.code}` : "";

      return {
        id: Number(t.id),
        inventoryId: Number(t.variant_unit_price_id),
        type: t.type,
        quantity: t.quantity,
        referenceType: t.referenceType,
        referenceId: t.referenceId ? Number(t.referenceId) : null,
        notes: t.note,
        createdAt: t.createdAt,
        productName: vup?.variant?.product?.name || "",
        sku: vup?.sku || "",
        unitLabel,
      };
    });

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
