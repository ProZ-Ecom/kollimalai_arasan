import crypto from "crypto";
import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type {
  AdminBulkOrderListParams,
  BulkOrderEnquiryStatus,
} from "../types";
import type { CreateBulkOrderInput } from "../validations/bulk-order.schema";

const bulkOrderInclude = Prisma.validator<Prisma.bulk_order_enquiriesInclude>()({
  users_bulk_order_enquiries_created_byTousers: {
    select: {
      uuid: true,
      name: true,
      email: true,
    },
  },
  users_bulk_order_enquiries_updated_byTousers: {
    select: {
      uuid: true,
      name: true,
      email: true,
    },
  },
});

export const bulkOrderRepository = {
  async create(data: CreateBulkOrderInput) {
    const uuid = crypto.randomUUID();
    return db.bulk_order_enquiries.create({
      data: {
        uuid,
        name: data.name,
        email: data.email,
        phone: data.phone,
        company_name: data.companyName || null,
        product_interest: data.productInterest || null,
        quantity: data.quantity,
        message: data.message || null,
        status: "new",
        is_active: true,
      },
      include: bulkOrderInclude,
    });
  },

  async findByUuid(uuid: string) {
    return db.bulk_order_enquiries.findFirst({
      where: {
        uuid,
        is_active: true,
      },
      include: bulkOrderInclude,
    });
  },

  buildAdminWhere(
    params: AdminBulkOrderListParams
  ): Prisma.bulk_order_enquiriesWhereInput {
    const where: Prisma.bulk_order_enquiriesWhereInput = {
      is_active: true,
    };

    if (params.status) {
      where.status = params.status;
    }

    if (params.search) {
      const s = params.search.trim();
      where.OR = [
        { name: { contains: s } },
        { email: { contains: s } },
        { phone: { contains: s } },
        { company_name: { contains: s } },
        { product_interest: { contains: s } },
      ];
    }

    return where;
  },

  async findAdminAll(params: AdminBulkOrderListParams) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? params.limit ?? 20;
    const skip = (page - 1) * pageSize;

    const where = this.buildAdminWhere(params);

    const sortOrder = params.sortOrder ?? "desc";
    let orderBy: Prisma.bulk_order_enquiriesOrderByWithRelationInput = {
      created_at: sortOrder,
    };

    if (params.sortBy === "name") {
      orderBy = { name: sortOrder };
    } else if (params.sortBy === "email") {
      orderBy = { email: sortOrder };
    } else if (params.sortBy === "quantity") {
      orderBy = { quantity: sortOrder };
    } else if (params.sortBy === "status") {
      orderBy = { status: sortOrder };
    } else if (params.sortBy === "updatedAt") {
      orderBy = { updated_at: sortOrder };
    } else {
      orderBy = { created_at: sortOrder };
    }

    const [data, total] = await Promise.all([
      db.bulk_order_enquiries.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: bulkOrderInclude,
      }),
      db.bulk_order_enquiries.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
    };
  },

  async updateStatusByUuid(
    uuid: string,
    status: BulkOrderEnquiryStatus,
    adminId?: bigint | null,
    comment?: string | null
  ) {
    const existing = await this.findByUuid(uuid);
    if (!existing) return null;

    return db.bulk_order_enquiries.update({
      where: { id: existing.id },
      data: {
        status,
        ...(comment !== undefined ? { admin_comment: comment || null } : {}),
        ...(adminId ? { updated_by: adminId } : {}),
      },
      include: bulkOrderInclude,
    });
  },
};
