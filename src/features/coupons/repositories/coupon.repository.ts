import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type { GetCouponsParams, CouponListItem } from "../types";

function toCouponListItem(coupon: Record<string, unknown>): CouponListItem {
  return {
    id: coupon.id as number,
    code: coupon.code as string,
    type: coupon.type as string,
    value: Number(coupon.value),
    minOrderAmount: coupon.minOrderAmount != null ? Number(coupon.minOrderAmount) : null,
    maxDiscount: coupon.maxDiscount != null ? Number(coupon.maxDiscount) : null,
    usageLimit: coupon.usageLimit as number | null,
    usedCount: coupon.usedCount as number,
    isActive: coupon.isActive as boolean,
    startsAt: coupon.startsAt as Date | null,
    expiresAt: coupon.expiresAt as Date | null,
    createdAt: coupon.createdAt as Date,
  };
}

function buildCouponWhere(params: GetCouponsParams): Prisma.CouponWhereInput {
  const where: Prisma.CouponWhereInput = {};

  if (params.isActive !== undefined) {
    where.isActive = params.isActive;
  }

  if (params.search) {
    where.OR = [{ code: { contains: params.search } }];
  }

  return where;
}

export const couponRepository = {
  async findAll(params: GetCouponsParams = {}) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const where = buildCouponWhere(params);

    const [data, total] = await Promise.all([
      db.coupon.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.coupon.count({ where }),
    ]);

    return {
      data: data.map((c) => toCouponListItem(c as unknown as Record<string, unknown>)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: number) {
    const coupon = await db.coupon.findUnique({ where: { id } });
    return coupon ? toCouponListItem(coupon as unknown as Record<string, unknown>) : null;
  },

  async findByCode(code: string) {
    const coupon = await db.coupon.findUnique({ where: { code } });
    return coupon ? toCouponListItem(coupon as unknown as Record<string, unknown>) : null;
  },

  async create(data: Prisma.CouponCreateInput) {
    const coupon = await db.coupon.create({ data });
    return toCouponListItem(coupon as unknown as Record<string, unknown>);
  },

  async update(id: number, data: Prisma.CouponUpdateInput) {
    const coupon = await db.coupon.update({ where: { id }, data });
    return toCouponListItem(coupon as unknown as Record<string, unknown>);
  },

  async delete(id: number) {
    return db.coupon.delete({ where: { id } });
  },
};
