import crypto from "crypto";
import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type {
  AdminContactMessageListParams,
  ContactMessageStatus,
} from "../types";
import type { CreateContactInput } from "../validations/contact.schema";

const contactMessageInclude = Prisma.validator<Prisma.contact_messagesInclude>()({
  users_contact_messages_created_byTousers: {
    select: {
      uuid: true,
      name: true,
      email: true,
    },
  },
  users_contact_messages_updated_byTousers: {
    select: {
      uuid: true,
      name: true,
      email: true,
    },
  },
});

export const contactRepository = {
  async create(data: CreateContactInput) {
    const uuid = crypto.randomUUID();
    return db.contact_messages.create({
      data: {
        uuid,
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
        status: "new",
        is_active: true,
      },
      include: contactMessageInclude,
    });
  },

  async findByUuid(uuid: string) {
    return db.contact_messages.findFirst({
      where: {
        uuid,
        is_active: true,
      },
      include: contactMessageInclude,
    });
  },

  buildAdminWhere(
    params: AdminContactMessageListParams
  ): Prisma.contact_messagesWhereInput {
    const where: Prisma.contact_messagesWhereInput = {
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
        { subject: { contains: s } },
        { message: { contains: s } },
      ];
    }

    return where;
  },

  async findAdminAll(params: AdminContactMessageListParams) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? params.limit ?? 20;
    const skip = (page - 1) * pageSize;

    const where = this.buildAdminWhere(params);

    const sortOrder = params.sortOrder ?? "desc";
    let orderBy: Prisma.contact_messagesOrderByWithRelationInput = {
      created_at: sortOrder,
    };

    if (params.sortBy === "name") {
      orderBy = { name: sortOrder };
    } else if (params.sortBy === "email") {
      orderBy = { email: sortOrder };
    } else if (params.sortBy === "subject") {
      orderBy = { subject: sortOrder };
    } else if (params.sortBy === "status") {
      orderBy = { status: sortOrder };
    } else if (params.sortBy === "updatedAt") {
      orderBy = { updated_at: sortOrder };
    } else {
      orderBy = { created_at: sortOrder };
    }

    const [data, total] = await Promise.all([
      db.contact_messages.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: contactMessageInclude,
      }),
      db.contact_messages.count({ where }),
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
    status: ContactMessageStatus,
    adminId?: bigint | null
  ) {
    const existing = await this.findByUuid(uuid);
    if (!existing) return null;

    return db.contact_messages.update({
      where: { id: existing.id },
      data: {
        status,
        ...(adminId ? { updated_by: adminId } : {}),
      },
      include: contactMessageInclude,
    });
  },

  async replyByUuid(uuid: string, adminId?: bigint | null) {
    const existing = await this.findByUuid(uuid);
    if (!existing) return null;

    return db.contact_messages.update({
      where: { id: existing.id },
      data: {
        status: "replied",
        ...(adminId ? { updated_by: adminId } : {}),
      },
      include: contactMessageInclude,
    });
  },
};
