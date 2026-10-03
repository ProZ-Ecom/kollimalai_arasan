import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type { GetCouponsParams, CouponListItem } from "../types";

function toCouponListItem(coupon: Record<string, unknown>): CouponListItem {
  const countObj = coupon._count as { coupon_usage?: number } | undefined;
  const usedCount =
    typeof countObj?.coupon_usage === "number"
      ? countObj.coupon_usage
      : Array.isArray(coupon.coupon_usage)
      ? coupon.coupon_usage.length
      : typeof coupon.usedCount === "number"
      ? coupon.usedCount
      : 0;

  return {
    id: Number(coupon.id),
    code: coupon.code as string,
    type: coupon.type as string,
    value: Number(coupon.value),
    minOrderAmount: coupon.minOrderAmount != null ? Number(coupon.minOrderAmount) : null,
    maxDiscount:
      coupon.max_discount_amount != null
        ? Number(coupon.max_discount_amount)
        : coupon.maxDiscount != null
        ? Number(coupon.maxDiscount)
        : null,
    usageLimit: coupon.usageLimit != null ? Number(coupon.usageLimit) : null,
    usedCount,
    isActive: coupon.isActive != null ? Boolean(coupon.isActive) : true,
    startsAt: (coupon.valid_from ?? coupon.startsAt) as Date | string | null,
    expiresAt: (coupon.valid_to ?? coupon.expiresAt) as Date | string | null,
    createdAt: (coupon.createdAt ?? coupon.created_at) as Date | string,
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
        include: {
          _count: {
            select: { coupon_usage: true },
          },
        },
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
    const coupon = await db.coupon.findUnique({
      where: { id },
      include: {
        _count: {
          select: { coupon_usage: true },
        },
      },
    });
    return coupon ? toCouponListItem(coupon as unknown as Record<string, unknown>) : null;
  },

  async findByCode(code: string) {
    const coupon = await db.coupon.findUnique({
      where: { code },
      include: {
        _count: {
          select: { coupon_usage: true },
        },
      },
    });
    return coupon ? toCouponListItem(coupon as unknown as Record<string, unknown>) : null;
  },

  async create(data: Prisma.CouponCreateInput) {
    const coupon = await db.coupon.create({
      data,
      include: {
        _count: {
          select: { coupon_usage: true },
        },
      },
    });
    return toCouponListItem(coupon as unknown as Record<string, unknown>);
  },

  async update(id: number, data: Prisma.CouponUpdateInput) {
    const coupon = await db.coupon.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { coupon_usage: true },
        },
      },
    });
    return toCouponListItem(coupon as unknown as Record<string, unknown>);
  },

  async delete(id: number) {
    return db.coupon.delete({ where: { id } });
  },
};
