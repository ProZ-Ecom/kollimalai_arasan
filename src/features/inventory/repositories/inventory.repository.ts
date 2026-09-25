import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type { InventoryTransactionType } from "../types";

interface FindAllParams {
  page?: number;
  limit?: number;
  search?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
}

interface FindTransactionsParams {
  page?: number;
  limit?: number;
  type?: InventoryTransactionType;
  search?: string;
}

const inventoryInclude: Prisma.InventoryInclude = {
  variant_unit_price: {
    include: {
      product_units: true,
      variant: {
        include: {
          product: {
            select: { id: true, name: true, slug: true },
          },
          product_variant_images: {
            where: { is_active: true },
            take: 1,
          },
        },
      },
    },
  },
};

export const inventoryRepository = {
  async findAll(params: FindAllParams) {
    const { page = 1, limit = 10, search, lowStock, outOfStock } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryWhereInput = {
      is_active: true,
    };

    if (search && search.trim() !== "") {
      const q = search.trim();
      where.OR = [
        {
          variant_unit_price: {
            variant: {
              product: {
                name: { contains: q },
              },
            },
          },
        },
        {
          variant_unit_price: {
            sku: { contains: q },
          },
        },
        {
          variant_unit_price: {
            variant: {
              variant_name: { contains: q },
            },
          },
        },
      ];
    }

    if (lowStock) {
      where.quantity_available = { gt: 0 };
    }

    if (outOfStock) {
      where.quantity_available = 0;
    }

    const [data, total] = await Promise.all([
      db.inventory.findMany({
        where,
        include: inventoryInclude,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      db.inventory.count({ where }),
    ]);

    return { data, total };
  },

  async findById(id: number) {
    return db.inventory.findUnique({
      where: { id },
      include: inventoryInclude,
    });
  },

  async findByProductAndVariant(productId: number, variantId?: number) {
    return db.inventory.findFirst({
      where: {
        variant_unit_price: {
          variant: {
            productId,
            ...(variantId ? { id: variantId } : {}),
          },
        },
      },
      include: inventoryInclude,
    });
  },

  async create(data: Prisma.InventoryCreateInput) {
    return db.inventory.create({
      data,
      include: inventoryInclude,
    });
  },

  async update(id: number, data: Prisma.InventoryUpdateInput) {
    return db.inventory.update({
      where: { id },
      data,
      include: inventoryInclude,
    });
  },

  async findTransactionsByInventoryId(
    inventoryId: number,
    params: FindTransactionsParams
  ) {
    const { page = 1, limit = 20, type } = params;
    const skip = (page - 1) * limit;

    const inventory = await db.inventory.findUnique({
      where: { id: inventoryId },
      select: { variantUnitPriceId: true },
    });

    if (!inventory) {
      return { data: [], total: 0 };
    }

    const where: Prisma.InventoryTransactionWhereInput = {
      variant_unit_price_id: inventory.variantUnitPriceId,
    };

    if (type) {
      where.type = type as any;
    }

    const [data, total] = await Promise.all([
      db.inventoryTransaction.findMany({
        where,
        include: {
          variant_unit_price: {
            include: {
              product_units: true,
              variant: {
                include: {
                  product: { select: { name: true } },
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.inventoryTransaction.count({ where }),
    ]);

    return { data, total };
  },

  async findAllTransactions(params: FindTransactionsParams) {
    const { page = 1, limit = 20, type, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryTransactionWhereInput = {};

    if (type) {
      where.type = type as any;
    }

    if (search && search.trim() !== "") {
      const q = search.trim();
      where.OR = [
        {
          variant_unit_price: {
            variant: {
              product: {
                name: { contains: q },
              },
            },
          },
        },
        {
          variant_unit_price: {
            sku: { contains: q },
          },
        },
        {
          note: { contains: q },
        },
      ];
    }

    const [data, total] = await Promise.all([
      db.inventoryTransaction.findMany({
        where,
        include: {
          variant_unit_price: {
            include: {
              product_units: true,
              variant: {
                include: {
                  product: { select: { name: true } },
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.inventoryTransaction.count({ where }),
    ]);

    return { data, total };
  },

  async createTransaction(
    data: Prisma.InventoryTransactionCreateInput
  ) {
    return db.inventoryTransaction.create({ data });
  },
};
