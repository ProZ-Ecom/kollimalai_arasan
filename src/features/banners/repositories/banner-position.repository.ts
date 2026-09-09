import crypto from "crypto";
import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type {
  CreateBannerPositionInput,
  UpdateBannerPositionInput,
  BannerPositionListQueryInput,
} from "../validations/banner-position.schema";
import type {
  BannerPositionDto,
  BannerPositionListResponse,
} from "../types/banner-position.types";

export function formatBannerPosition(
  record: Prisma.banner_positionsGetPayload<{}>
): BannerPositionDto {
  return {
    id: record.uuid || String(record.id),
    name: record.name,
    slug: record.slug,
    page: record.page,
    isActive: Boolean(record.is_active),
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export const bannerPositionRepository = {
  async findBySlug(slug: string) {
    return db.banner_positions.findFirst({
      where: {
        slug: slug.toLowerCase().trim(),
      },
    });
  },

  async findByUuid(uuid: string) {
    return db.banner_positions.findFirst({
      where: {
        uuid,
      },
    });
  },

  async findById(id: bigint) {
    return db.banner_positions.findUnique({
      where: {
        id,
      },
    });
  },

  async create(
    data: CreateBannerPositionInput,
    userInternalId?: bigint
  ): Promise<BannerPositionDto> {
    const created = await db.banner_positions.create({
      data: {
        uuid: crypto.randomUUID(),
        name: data.name.trim(),
        slug: data.slug.toLowerCase().trim(),
        page: data.page ? data.page.trim() : null,
        is_active: data.isActive ?? true,
        created_by: userInternalId ?? null,
        updated_by: userInternalId ?? null,
      },
    });

    return formatBannerPosition(created);
  },

  async update(
    id: bigint,
    data: UpdateBannerPositionInput,
    userInternalId?: bigint
  ): Promise<BannerPositionDto> {
    const updateData: Prisma.banner_positionsUpdateInput = {
      updated_at: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.slug !== undefined)
      updateData.slug = data.slug.toLowerCase().trim();
    if (data.page !== undefined)
      updateData.page = data.page ? data.page.trim() : null;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (userInternalId) {
      updateData.users_banner_positions_updated_byTousers = {
        connect: { id: userInternalId },
      };
    }

    const updated = await db.banner_positions.update({
      where: { id },
      data: updateData,
    });

    return formatBannerPosition(updated);
  },

  async findAll(
    params: BannerPositionListQueryInput
  ): Promise<BannerPositionListResponse> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.banner_positionsWhereInput = {};

    if (params.isActive !== undefined) {
      where.is_active = params.isActive;
    }

    if (params.search) {
      const search = params.search.trim();
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
        { page: { contains: search } },
      ];
    }

    if (params.pageName) {
      where.page = { contains: params.pageName.trim() };
    }

    const sortField = params.sortBy ?? "createdAt";
    const sortDirection = params.sortOrder ?? "desc";

    let orderBy: Prisma.banner_positionsOrderByWithRelationInput = {
      created_at: sortDirection,
    };

    if (sortField === "name") {
      orderBy = { name: sortDirection };
    } else if (sortField === "slug") {
      orderBy = { slug: sortDirection };
    } else if (sortField === "page") {
      orderBy = { page: sortDirection };
    } else if (sortField === "updatedAt") {
      orderBy = { updated_at: sortDirection };
    }

    const [records, total] = await Promise.all([
      db.banner_positions.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      db.banner_positions.count({ where }),
    ]);

    return {
      data: records.map(formatBannerPosition),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },
};
