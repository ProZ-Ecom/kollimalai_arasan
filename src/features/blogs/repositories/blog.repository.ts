import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type { GetBlogsParams } from "../types";

const blogListInclude = Prisma.validator<Prisma.BlogInclude>()({
  author: { select: { name: true } },
});

function mapBlogStatus(blog: { is_active: boolean; is_published: boolean }): "DRAFT" | "PUBLISHED" | "ARCHIVED" {
  if (!blog.is_active) return "ARCHIVED";
  if (blog.is_published) return "PUBLISHED";
  return "DRAFT";
}

function buildBlogWhere(params: GetBlogsParams): Prisma.BlogWhereInput {
  const where: Prisma.BlogWhereInput = {};

  if (params.status) {
    const statusUpper = params.status.toUpperCase();
    if (statusUpper === "PUBLISHED") {
      where.is_published = true;
      where.is_active = true;
    } else if (statusUpper === "DRAFT") {
      where.is_published = false;
      where.is_active = true;
    } else if (statusUpper === "ARCHIVED") {
      where.is_active = false;
    }
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
      data: data.map((blog) => ({
        ...blog,
        image: blog.featured_image,
        status: mapBlogStatus(blog),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: number) {
    const blog = await db.blog.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });
    if (!blog) return null;
    return {
      ...blog,
      image: blog.featured_image,
      status: mapBlogStatus(blog),
    };
  },

  async findBySlug(slug: string) {
    const blog = await db.blog.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });
    if (!blog) return null;
    return {
      ...blog,
      image: blog.featured_image,
      status: mapBlogStatus(blog),
    };
  },

  async create(data: Prisma.BlogCreateInput) {
    const blog = await db.blog.create({
      data,
      include: blogListInclude,
    });
    return {
      ...blog,
      image: blog.featured_image,
      status: mapBlogStatus(blog),
    };
  },

  async update(id: number, data: Prisma.BlogUpdateInput) {
    const blog = await db.blog.update({
      where: { id },
      data,
      include: blogListInclude,
    });
    return {
      ...blog,
      image: blog.featured_image,
      status: mapBlogStatus(blog),
    };
  },

  async delete(id: number) {
    return db.blog.delete({ where: { id } });
  },
};
