import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type {
  GetCategoriesParams,
  GetAdminCategoriesParams,
  AdminCategoriesCountResponse,
} from "../types";

const categoryListInclude = Prisma.validator<Prisma.ProductCategoryInclude>()({
  _count: { select: { children: true } },
});

const categoryDetailInclude = Prisma.validator<Prisma.ProductCategoryInclude>()({
  parent: { select: { id: true, name: true, slug: true } },
  children: {
    where: { isActive: true, deleted_at: null },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      _count: { select: { children: true } },
    },
  },
  _count: { select: { children: true } },
});

function buildCategoryWhere(params: GetCategoriesParams): Prisma.ProductCategoryWhereInput {
  const where: Prisma.ProductCategoryWhereInput = { isActive: true, deleted_at: null };

  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
      { description: { contains: params.search } },
    ];
  }

  if (params.parentId !== undefined) {
    where.parentId = params.parentId;
  }

  return where;
}

function buildAdminCategoryWhere(params: GetAdminCategoriesParams = {}): Prisma.ProductCategoryWhereInput {
  const where: Prisma.ProductCategoryWhereInput = {
    deleted_at: null,
  };

  if (typeof params.isActive === "boolean") {
    where.isActive = params.isActive;
  }

  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
      { description: { contains: params.search } },
      { slug: { contains: params.search } },
    ];
  }

  return where;
}

export const categoryRepository = {
  buildAdminCategoryWhere,

  async findAll(params: GetCategoriesParams = {}) {
    const where = buildCategoryWhere(params);
    return db.productCategory.findMany({
      where,
      include: categoryListInclude,
      orderBy: { sortOrder: "asc" },
    });
  },

  async findBySlugOrId(slugOrId: string) {
    const numericId = parseInt(slugOrId);
    return db.productCategory.findFirst({
      where: {
        isActive: true,
        deleted_at: null,
        OR: [
          { slug: slugOrId },
          { uuid: slugOrId },
          ...(numericId ? [{ id: numericId }] : []),
        ],
      },
      include: categoryDetailInclude,
    });
  },

  async findById(id: number | bigint) {
    return db.productCategory.findFirst({
      where: { id: BigInt(id), isActive: true, deleted_at: null },
      include: categoryDetailInclude,
    });
  },

  async findByUuid(uuid: string) {
    return db.productCategory.findFirst({
      where: { uuid, isActive: true, deleted_at: null },
    });
  },

  async findBySlug(slug: string, excludeUuid?: string) {
    return db.productCategory.findFirst({
      where: {
        slug,
        isActive: true,
        deleted_at: null,
        ...(excludeUuid ? { uuid: { not: excludeUuid } } : {}),
      },
    });
  },

  async findByName(name: string, excludeUuid?: string) {
    return db.productCategory.findFirst({
      where: {
        name,
        isActive: true,
        deleted_at: null,
        ...(excludeUuid ? { uuid: { not: excludeUuid } } : {}),
      },
    });
  },

  async countAdminCategories(
    params: GetAdminCategoriesParams = {}
  ): Promise<AdminCategoriesCountResponse> {
    const baseWhere: Prisma.ProductCategoryWhereInput = {
      deleted_at: null,
    };

    if (params.search) {
      baseWhere.OR = [
        { name: { contains: params.search } },
        { description: { contains: params.search } },
        { slug: { contains: params.search } },
      ];
    }

    const [active, inactive, all] = await Promise.all([
      db.productCategory.count({ where: { ...baseWhere, isActive: true } }),
      db.productCategory.count({ where: { ...baseWhere, isActive: false } }),
      db.productCategory.count({ where: baseWhere }),
    ]);

    return {
      active,
      inactive,
      all,
    };
  },

  async findAdminAll(params: GetAdminCategoriesParams = {}) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? params.limit ?? 10;

    const where = buildAdminCategoryWhere(params);

    const [data, total] = await Promise.all([
      db.productCategory.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.productCategory.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit: pageSize,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  },

  async create(data: Prisma.ProductCategoryUncheckedCreateInput) {
    return db.productCategory.create({
      data,
    });
  },

  async updateByUuid(uuid: string, data: Prisma.ProductCategoryUncheckedUpdateInput) {
    const existing = await this.findByUuid(uuid);
    if (!existing) return null;

    return db.productCategory.update({
      where: { id: existing.id },
      data,
    });
  },

  async softDeleteByUuid(uuid: string, adminId?: bigint | null) {
    const existing = await this.findByUuid(uuid);
    if (!existing) return null;

    const now = new Date();

    return db.$transaction(async (tx) => {
      // 1. Soft-delete the category
      const updatedCategory = await tx.productCategory.update({
        where: { id: existing.id },
        data: {
          isActive: false,
          status: false,
          deleted_at: now,
          ...(adminId ? { updated_by: adminId } : {}),
        },
      });

      // 2. Find all active products under this category
      const relatedProducts = await tx.product.findMany({
        where: { categoryId: existing.id, deleted_at: null },
        select: { id: true },
      });

      if (relatedProducts.length > 0) {
        const productIds = relatedProducts.map((p) => p.id);

        // 3. Soft-delete all related products
        await tx.product.updateMany({
          where: { id: { in: productIds } },
          data: {
            isActive: false,
            status: false,
            deleted_at: now,
            ...(adminId ? { updated_by: adminId } : {}),
          },
        });

        // 4. Find all variants for these products
        const relatedVariants = await tx.productVariant.findMany({
          where: { productId: { in: productIds }, deleted_at: null },
          select: { id: true },
        });

        if (relatedVariants.length > 0) {
          const variantIds = relatedVariants.map((v) => v.id);

          // 5. Soft-delete all related variants
          await tx.productVariant.updateMany({
            where: { id: { in: variantIds } },
            data: {
              isActive: false,
              deleted_at: now,
              ...(adminId ? { updated_by: adminId } : {}),
            },
          });

          // 6. Soft-delete all variant unit prices
          await tx.variantUnitPrice.updateMany({
            where: { variant_id: { in: variantIds } },
            data: {
              isActive: false,
              deleted_at: now,
              ...(adminId ? { updated_by: adminId } : {}),
            },
          });
        }
      }

      return updatedCategory;
    });
  },

  async update(id: number | bigint, data: Prisma.ProductCategoryUncheckedUpdateInput) {
    return db.productCategory.update({
      where: { id: BigInt(id) },
      data,
      include: categoryDetailInclude,
    });
  },

  async delete(id: number | bigint) {
    return db.productCategory.delete({ where: { id: BigInt(id) } });
  },

  async bulkSoftDelete(
    identifiers: (string | number | bigint)[],
    adminId?: bigint | null
  ) {
    if (!identifiers || identifiers.length === 0) return { count: 0 };

    const stringUuids: string[] = [];
    const numericIds: bigint[] = [];

    for (const item of identifiers) {
      if (item === null || item === undefined) continue;
      if (typeof item === "bigint") {
        numericIds.push(item);
      } else if (typeof item === "number") {
        if (!isNaN(item)) numericIds.push(BigInt(item));
      } else if (typeof item === "string") {
        const trimmed = item.trim();
        if (/^\d+$/.test(trimmed)) {
          numericIds.push(BigInt(trimmed));
        }
        if (trimmed) {
          stringUuids.push(trimmed);
        }
      }
    }

    const orConditions: Prisma.ProductCategoryWhereInput[] = [];
    if (stringUuids.length > 0) {
      orConditions.push({ uuid: { in: stringUuids } });
    }
    if (numericIds.length > 0) {
      orConditions.push({ id: { in: numericIds } });
    }

    if (orConditions.length === 0) return { count: 0 };

    const existingCategories = await db.productCategory.findMany({
      where: {
        OR: orConditions,
        deleted_at: null,
      },
      select: { id: true },
    });

    if (existingCategories.length === 0) return { count: 0 };

    const categoryIds = existingCategories.map((c) => c.id);
    const now = new Date();

    return db.$transaction(async (tx) => {
      await tx.productCategory.updateMany({
        where: { id: { in: categoryIds } },
        data: {
          isActive: false,
          status: false,
          deleted_at: now,
          ...(adminId ? { updated_by: adminId } : {}),
        },
      });

      const relatedProducts = await tx.product.findMany({
        where: { categoryId: { in: categoryIds }, deleted_at: null },
        select: { id: true },
      });

      if (relatedProducts.length > 0) {
        const productIds = relatedProducts.map((p) => p.id);

        await tx.product.updateMany({
          where: { id: { in: productIds } },
          data: {
            isActive: false,
            status: false,
            deleted_at: now,
            ...(adminId ? { updated_by: adminId } : {}),
          },
        });

        const relatedVariants = await tx.productVariant.findMany({
          where: { productId: { in: productIds }, deleted_at: null },
          select: { id: true },
        });

        if (relatedVariants.length > 0) {
          const variantIds = relatedVariants.map((v) => v.id);

          await tx.productVariant.updateMany({
            where: { id: { in: variantIds } },
            data: {
              isActive: false,
              deleted_at: now,
              ...(adminId ? { updated_by: adminId } : {}),
            },
          });

          await tx.variantUnitPrice.updateMany({
            where: { variant_id: { in: variantIds } },
            data: {
              isActive: false,
              deleted_at: now,
              ...(adminId ? { updated_by: adminId } : {}),
            },
          });
        }
      }

      return { count: categoryIds.length };
    });
  },

  async bulkSoftDeleteByIds(
    ids: (number | bigint | string)[],
    adminId?: bigint | null
  ) {
    return this.bulkSoftDelete(ids, adminId);
  },

  async count(where?: Prisma.ProductCategoryWhereInput) {
    return db.productCategory.count({ where });
  },
};

