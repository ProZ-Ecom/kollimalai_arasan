import { db } from "@/lib/db/prisma";
import { Prisma, InventoryTransactionType } from "@/generated/prisma";

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
}

export const inventoryRepository = {
  async findAll(params: FindAllParams) {
    const { page = 1, limit = 10, search, lowStock, outOfStock } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryWhereInput = {};

    if (search) {
      where.product = {
        name: { contains: search },
      };
    }

    if (lowStock) {
      where.quantity = { gt: 0 };
    }

    if (outOfStock) {
      where.quantity = 0;
    }

    const [data, total] = await Promise.all([
      db.inventory.findMany({
        where,
        include: {
          product: {
            select: { name: true, slug: true },
          },
          variant: {
            select: { name: true },
          },
        },
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
      include: {
        product: {
          select: { name: true, slug: true },
        },
        variant: {
          select: { name: true },
        },
      },
    });
  },

  async findByProductAndVariant(productId: number, variantId?: number) {
    return db.inventory.findFirst({
      where: {
        productId,
        variantId: variantId ?? null,
      },
    });
  },

  async create(data: Prisma.InventoryCreateInput) {
    return db.inventory.create({ data });
  },

  async update(id: number, data: Prisma.InventoryUpdateInput) {
    return db.inventory.update({ where: { id }, data });
  },

  async findTransactionsByInventoryId(
    inventoryId: number,
    params: FindTransactionsParams
  ) {
    const { page = 1, limit = 20, type } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryTransactionWhereInput = { inventoryId };

    if (type) {
      where.type = type;
    }

    const [data, total] = await Promise.all([
      db.inventoryTransaction.findMany({
        where,
        include: {
          inventory: {
            include: {
              product: { select: { name: true } },
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
