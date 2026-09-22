import crypto from "crypto";
import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type { GetVariantPriceHistoryParams } from "../types";

export const variantUnitPriceInclude = Prisma.validator<Prisma.VariantUnitPriceInclude>()({
  product_units: {
    select: {
      id: true,
      uuid: true,
      name: true,
      code: true,
      type: true,
      is_active: true,
    },
  },
  inventories: {
    select: {
      id: true,
      quantity_available: true,
      quantity_reserved: true,
    },
  },
  variant: {
    select: {
      id: true,
      uuid: true,
      variant_name: true,
      productId: true,
    },
  },
});

export const variantUnitPriceRepository = {
  async findByUuid(uuid: string) {
    return db.variantUnitPrice.findFirst({
      where: { uuid, deleted_at: null },
      include: variantUnitPriceInclude,
    });
  },

  async findById(id: number | bigint) {
    return db.variantUnitPrice.findFirst({
      where: { id: BigInt(id), deleted_at: null },
      include: variantUnitPriceInclude,
    });
  },

  async findBySku(sku: string, excludeUuid?: string) {
    return db.variantUnitPrice.findFirst({
      where: {
        sku,
        deleted_at: null,
        ...(excludeUuid ? { uuid: { not: excludeUuid } } : {}),
      },
    });
  },

  async findAllByVariantId(variantId: bigint) {
    return db.variantUnitPrice.findMany({
      where: { variant_id: variantId, deleted_at: null },
      include: variantUnitPriceInclude,
      orderBy: [{ is_default: "desc" }, { createdAt: "asc" }],
    });
  },

  async findByVariantAndUnit(
    variantId: bigint,
    unitId: bigint,
    unitValue: number | Prisma.Decimal,
    excludeUuid?: string
  ) {
    return db.variantUnitPrice.findFirst({
      where: {
        variant_id: variantId,
        unit_id: unitId,
        unit_value: unitValue,
        deleted_at: null,
        ...(excludeUuid ? { uuid: { not: excludeUuid } } : {}),
      },
    });
  },

  async create(data: Prisma.VariantUnitPriceUncheckedCreateInput) {
    return db.variantUnitPrice.create({
      data,
      include: variantUnitPriceInclude,
    });
  },

  /**
   * Checks all non-deleted unit prices for the given variant and syncs the
   * `out_of_stock` flag on the parent ProductVariant.
   *
   * Rules:
   *  - If EVERY unit price has `quantity_available = 0` (or has no inventory
   *    record) → set `out_of_stock = true`.
   *  - If ANY unit price has `quantity_available > 0` → set `out_of_stock = false`.
   *
   * Must be called inside a transaction so the sync is atomic with the inventory
   * upsert that triggered it.
   */
  async syncVariantOutOfStockStatus(
    tx: Prisma.TransactionClient,
    variantId: bigint
  ) {
    const unitPrices = await tx.variantUnitPrice.findMany({
      where: { variant_id: variantId, deleted_at: null },
      include: {
        inventories: {
          select: { quantity_available: true },
        },
      },
    });

    if (unitPrices.length === 0) return;

    const hasStock = unitPrices.some(
      (up) => up.inventories && up.inventories.quantity_available > 0
    );

    await tx.productVariant.updateMany({
      where: { id: variantId },
      data: { out_of_stock: !hasStock },
    });
  },

  async unsetDefaultForVariant(variantId: bigint, excludeId?: bigint) {
    return db.variantUnitPrice.updateMany({
      where: {
        variant_id: variantId,
        deleted_at: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      data: { is_default: false },
    });
  },

  async updateByUuid(
    uuid: string,
    data: Prisma.VariantUnitPriceUncheckedUpdateInput & { stock?: number },
    adminId?: bigint | null
  ) {
    return db.$transaction(async (tx) => {
      const existing = await tx.variantUnitPrice.findFirst({
        where: { uuid, deleted_at: null },
      });
      if (!existing) return null;

      const oldBasePrice = Number(existing.base_price);
      const newBasePrice =
        data.base_price !== undefined ? Number(data.base_price) : oldBasePrice;

      const isBasePriceChanged =
        data.base_price !== undefined && oldBasePrice !== newBasePrice;

      if (isBasePriceChanged) {
        await tx.variant_price_history.create({
          data: {
            uuid: crypto.randomUUID(),
            variant_unit_price_id: existing.id,
            old_base_price: oldBasePrice,
            new_base_price: newBasePrice,
            changed_at: new Date(),
            is_active: true,
            created_by: adminId ?? null,
            updated_by: adminId ?? null,
          },
        });
      }

      const { stock, ...updateData } = data;

      if (data.is_default === true) {
        await tx.variantUnitPrice.updateMany({
          where: { variant_id: existing.variant_id, id: { not: existing.id } },
          data: { is_default: false },
        });
      }

      if (stock !== undefined) {
        await tx.inventory.upsert({
          where: { variantUnitPriceId: existing.id },
          create: {
            variantUnitPriceId: existing.id,
            quantity_available: stock,
            quantity_reserved: 0,
            is_active: true,
            created_by: adminId ?? null,
            updated_by: adminId ?? null,
          },
          update: {
            quantity_available: stock,
            updated_by: adminId ?? null,
          },
        });
        // Auto-sync the variant's out_of_stock flag whenever stock changes
        await this.syncVariantOutOfStockStatus(tx, existing.variant_id);
      }

      return tx.variantUnitPrice.update({
        where: { id: existing.id },
        data: updateData,
        include: variantUnitPriceInclude,
      });
    });
  },

  async bulkUpdateUnitPrices(
    items: Array<{
      id: string; // variant-unit-price UUID
      price?: number;
      basePrice?: number;
      stock?: number;
      isActive?: boolean;
    }>,
    adminId?: bigint | null
  ) {
    return db.$transaction(async (tx) => {
      const updated = [];

      for (const item of items) {
        const existing = await tx.variantUnitPrice.findFirst({
          where: { uuid: item.id, deleted_at: null },
        });

        if (!existing) {
          throw new Error(`Variant unit price with ID '${item.id}' not found`);
        }

        const effectiveBasePrice =
          item.price !== undefined ? item.price : item.basePrice;

        const oldBasePrice = Number(existing.base_price);
        const newBasePrice =
          effectiveBasePrice !== undefined ? Number(effectiveBasePrice) : oldBasePrice;

        const isBasePriceChanged =
          effectiveBasePrice !== undefined && oldBasePrice !== newBasePrice;

        if (isBasePriceChanged) {
          await tx.variant_price_history.create({
            data: {
              uuid: crypto.randomUUID(),
              variant_unit_price_id: existing.id,
              old_base_price: oldBasePrice,
              new_base_price: newBasePrice,
              changed_at: new Date(),
              is_active: true,
              created_by: adminId ?? null,
              updated_by: adminId ?? null,
            },
          });
        }

        const updateData: Prisma.VariantUnitPriceUncheckedUpdateInput = {};
        if (effectiveBasePrice !== undefined) {
          updateData.base_price = effectiveBasePrice;
        }
        if (typeof item.isActive === "boolean") {
          updateData.isActive = item.isActive;
        }
        if (adminId) {
          updateData.updated_by = adminId;
        }

        if (item.stock !== undefined) {
          await tx.inventory.upsert({
            where: { variantUnitPriceId: existing.id },
            create: {
              variantUnitPriceId: existing.id,
              quantity_available: item.stock,
              quantity_reserved: 0,
              is_active: true,
              created_by: adminId ?? null,
              updated_by: adminId ?? null,
            },
            update: {
              quantity_available: item.stock,
              updated_by: adminId ?? null,
            },
          });
          // Auto-sync the variant's out_of_stock flag whenever stock changes
          await this.syncVariantOutOfStockStatus(tx, existing.variant_id);
        }

        const result = await tx.variantUnitPrice.update({
          where: { id: existing.id },
          data: updateData,
          include: variantUnitPriceInclude,
        });

        updated.push(result);
      }

      return updated;
    });
  },

  async softDeleteByUuid(uuid: string, adminId?: bigint | null) {
    const existing = await this.findByUuid(uuid);
    if (!existing) return null;

    return db.variantUnitPrice.update({
      where: { id: existing.id },
      data: {
        isActive: false,
        deleted_at: new Date(),
        ...(adminId ? { updated_by: adminId } : {}),
      },
    });
  },

  async findPriceHistoryByUnitPriceId(
    variantUnitPriceId: bigint,
    params: GetVariantPriceHistoryParams
  ) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const sortOrder = params.sortOrder ?? "desc";

    const where: Prisma.variant_price_historyWhereInput = {
      variant_unit_price_id: variantUnitPriceId,
      is_active: true,
    };

    if (params.fromDate || params.toDate) {
      where.changed_at = {};
      if (params.fromDate) {
        const fromStr = params.fromDate.includes("T")
          ? params.fromDate
          : `${params.fromDate}T00:00:00.000Z`;
        where.changed_at.gte = new Date(fromStr);
      }
      if (params.toDate) {
        const toStr = params.toDate.includes("T")
          ? params.toDate
          : `${params.toDate}T23:59:59.999Z`;
        where.changed_at.lte = new Date(toStr);
      }
    }

    const [data, total] = await Promise.all([
      db.variant_price_history.findMany({
        where,
        include: {
          users_variant_price_history_created_byTousers: {
            select: {
              id: true,
              uuid: true,
              name: true,
            },
          },
        },
        orderBy: [{ changed_at: sortOrder }, { id: sortOrder }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.variant_price_history.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  async findPriceHistoryAllByUnitPriceId(variantUnitPriceId: bigint) {
    return db.variant_price_history.findMany({
      where: {
        variant_unit_price_id: variantUnitPriceId,
        is_active: true,
      },
      orderBy: [{ changed_at: "asc" }, { id: "asc" }],
    });
  },
};
