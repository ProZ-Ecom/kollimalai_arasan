import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import { sanitizePlainText } from "@/lib/sanitize-html";
import { isFaqIconKey, type FaqIconKey } from "../constants/faq-icons";
import type {
  CreateFaqInput,
  UpdateFaqInput,
  FaqListQueryInput,
  PublicFaqQueryInput,
  UpdateFaqOrderInput,
} from "../validations/faq.schema";
import type {
  FaqDto,
  FaqListResponse,
  PublicFaqDto,
} from "../types/faq.types";

type FaqRecord = Prisma.faqGetPayload<object>;

export function formatFaq(record: FaqRecord): FaqDto {
  return {
    id: String(record.id),
    question: record.question,
    answer: record.answer,
    category: record.category,
    icon: normalizeIcon(record.icon),
    displayOrder: record.sort_order,
    status: record.is_active ? "ACTIVE" : "INACTIVE",
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

/** Storefront payload: audit columns and status never leave the server. */
export function formatPublicFaq(record: FaqRecord): PublicFaqDto {
  return {
    id: String(record.id),
    question: record.question,
    answer: record.answer,
    category: record.category,
    icon: normalizeIcon(record.icon),
    displayOrder: record.sort_order,
  };
}

/** Guards against a stale or hand-edited icon value in the database. */
function normalizeIcon(icon: string | null): FaqIconKey | null {
  return isFaqIconKey(icon) ? icon : null;
}

function normalizeCategory(category?: string | null): string | null {
  if (!category) return null;
  const clean = sanitizePlainText(category).trim();
  return clean.length > 0 ? clean : null;
}

export const faqRepository = {
  async findById(id: bigint) {
    return db.faq.findUnique({ where: { id } });
  },

  async create(
    data: CreateFaqInput,
    userInternalId?: bigint
  ): Promise<FaqDto> {
    const created = await db.faq.create({
      data: {
        question: sanitizePlainText(data.question).trim(),
        answer: sanitizePlainText(data.answer).trim(),
        category: normalizeCategory(data.category),
        icon: data.icon ?? null,
        sort_order: data.displayOrder,
        is_active: data.status === "ACTIVE",
        created_by: userInternalId ?? null,
        updated_by: userInternalId ?? null,
      },
    });

    return formatFaq(created);
  },

  async update(
    id: bigint,
    data: UpdateFaqInput,
    userInternalId?: bigint
  ): Promise<FaqDto> {
    const updateData: Prisma.faqUncheckedUpdateInput = {
      updated_at: new Date(),
    };

    if (data.question !== undefined) {
      updateData.question = sanitizePlainText(data.question).trim();
    }

    if (data.answer !== undefined) {
      updateData.answer = sanitizePlainText(data.answer).trim();
    }

    if (data.category !== undefined) {
      updateData.category = normalizeCategory(data.category);
    }

    if (data.icon !== undefined) {
      updateData.icon = data.icon ?? null;
    }

    if (data.displayOrder !== undefined) {
      updateData.sort_order = data.displayOrder;
    }

    if (data.status !== undefined) {
      updateData.is_active = data.status === "ACTIVE";
    }

    if (userInternalId) {
      updateData.updated_by = userInternalId;
    }

    const updated = await db.faq.update({
      where: { id },
      data: updateData,
    });

    return formatFaq(updated);
  },

  async findAll(params: FaqListQueryInput): Promise<FaqListResponse> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.faqWhereInput = {};

    if (params.status) {
      where.is_active = params.status === "ACTIVE";
    }

    if (params.category) {
      where.category = params.category.trim();
    }

    if (params.search) {
      const search = params.search.trim();
      where.OR = [
        { question: { contains: search } },
        { answer: { contains: search } },
        { category: { contains: search } },
      ];
    }

    const direction = params.sortOrder ?? "asc";
    const sortField = params.sortBy ?? "displayOrder";

    // Display order is the storefront's ordering, so ties fall back to the id
    // to keep pagination stable across requests.
    let orderBy: Prisma.faqOrderByWithRelationInput[] = [
      { sort_order: direction },
      { id: "asc" },
    ];

    if (sortField === "question") {
      orderBy = [{ question: direction }, { id: "asc" }];
    } else if (sortField === "category") {
      orderBy = [{ category: direction }, { sort_order: "asc" }, { id: "asc" }];
    } else if (sortField === "createdAt") {
      orderBy = [{ created_at: direction }, { id: "asc" }];
    } else if (sortField === "updatedAt") {
      orderBy = [{ updated_at: direction }, { id: "asc" }];
    }

    const [records, total] = await Promise.all([
      db.faq.findMany({ where, skip, take: limit, orderBy }),
      db.faq.count({ where }),
    ]);

    return {
      data: records.map(formatFaq),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async findActivePublicFaqs(
    params: PublicFaqQueryInput
  ): Promise<PublicFaqDto[]> {
    const where: Prisma.faqWhereInput = { is_active: true };

    if (params.category) {
      where.category = params.category.trim();
    }

    if (params.search) {
      const search = params.search.trim();
      where.OR = [
        { question: { contains: search } },
        { answer: { contains: search } },
        { category: { contains: search } },
      ];
    }

    const records = await db.faq.findMany({
      where,
      orderBy: [{ sort_order: "asc" }, { id: "asc" }],
    });

    return records.map(formatPublicFaq);
  },

  /** Distinct, non-empty categories — powers the admin category filter. */
  async findCategories(): Promise<string[]> {
    const rows = await db.faq.findMany({
      where: { category: { not: null } },
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    });

    return rows
      .map((row) => row.category?.trim())
      .filter((category): category is string => Boolean(category));
  },

  async findExistingIds(ids: bigint[]): Promise<Set<string>> {
    const rows = await db.faq.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    return new Set(rows.map((row) => String(row.id)));
  },

  /** Applies every reorder in one transaction so the list never half-moves. */
  async updateDisplayOrders(
    items: UpdateFaqOrderInput["items"],
    userInternalId?: bigint
  ): Promise<void> {
    const now = new Date();

    await db.$transaction(
      items.map((item) =>
        db.faq.update({
          where: { id: BigInt(item.id) },
          data: {
            sort_order: item.displayOrder,
            updated_at: now,
            ...(userInternalId ? { updated_by: userInternalId } : {}),
          },
        })
      )
    );
  },

  async delete(id: bigint): Promise<void> {
    await db.faq.delete({ where: { id } });
  },
};
