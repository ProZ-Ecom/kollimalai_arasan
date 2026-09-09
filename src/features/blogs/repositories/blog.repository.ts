import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type { GetBlogsParams } from "../types";

const blogListInclude = Prisma.validator<Prisma.BlogInclude>()({
  author: { select: { name: true } },
});

function buildBlogWhere(params: GetBlogsParams): Prisma.BlogWhereInput {
  const where: Prisma.BlogWhereInput = {};

  if (params.status) {
    where.status = params.status as Prisma.EnumBlogStatusFilter["equals"];
  }

  if (params.search) {
    where.OR = [{ title: { contains: params.search } }];
  }

  return where;
}

export const blogRepository = {
  async findAll(params: GetBlogsParams = {}) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const where = buildBlogWhere(params);

    const [data, total] = await Promise.all([
      db.blog.findMany({
        where,
        include: blogListInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.blog.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: number) {
    return db.blog.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async findBySlug(slug: string) {
    return db.blog.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async create(data: Prisma.BlogCreateInput) {
    return db.blog.create({
      data,
      include: blogListInclude,
    });
  },

  async update(id: number, data: Prisma.BlogUpdateInput) {
    return db.blog.update({
      where: { id },
      data,
      include: blogListInclude,
    });
  },

  async delete(id: number) {
    return db.blog.delete({ where: { id } });
  },
};
