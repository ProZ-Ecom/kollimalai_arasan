import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type { GetAdminGstRatesParams } from "../types";

export const gstRateRepository = {
  async findByUuid(uuid: string) {
    return db.product_gst_rates.findFirst({
      where: { uuid, is_active: true },
    });
  },

  async findById(id: number | bigint) {
    return db.product_gst_rates.findFirst({
      where: { id: BigInt(id), is_active: true },
    });
  },

  async findByName(name: string, excludeUuid?: string) {
    return db.product_gst_rates.findFirst({
      where: {
        name,
        is_active: true,
        ...(excludeUuid ? { uuid: { not: excludeUuid } } : {}),
      },
    });
  },

  async findAdminAll(params: GetAdminGstRatesParams = {}) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;

    const where: Prisma.product_gst_ratesWhereInput = {
      is_active: true,
    };

    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
      ];
    }

    const [data, total] = await Promise.all([
      db.product_gst_rates.findMany({
        where,
        orderBy: [{ name: "asc" }, { created_at: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.product_gst_rates.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit: pageSize,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  async create(data: Prisma.product_gst_ratesUncheckedCreateInput) {
    return db.product_gst_rates.create({
      data,
    });
  },

  async updateByUuid(
    uuid: string,
    data: Prisma.product_gst_ratesUncheckedUpdateInput
  ) {
    const existing = await this.findByUuid(uuid);
    if (!existing) return null;

    return db.product_gst_rates.update({
      where: { id: existing.id },
      data,
    });
  },

  async softDeleteByUuid(uuid: string, adminId?: bigint | null) {
    const existing = await this.findByUuid(uuid);
    if (!existing) return null;

    return db.product_gst_rates.update({
      where: { id: existing.id },
      data: {
        is_active: false,
        ...(adminId ? { updated_by: adminId } : {}),
      },
    });
  },
};
