import { ApiError } from "@/lib/api/api-error";
import { slugify } from "@/lib/utils";
import { blogRepository } from "../repositories/blog.repository";
import type { GetBlogsParams, CreateBlogInput, UpdateBlogInput } from "../types";

export const blogService = {
  async getBlogs(params: GetBlogsParams = {}) {
    return blogRepository.findAll(params);
  },

  async getBlog(slugOrId: string) {
    const numericId = parseInt(slugOrId);
    const blog = numericId
      ? await blogRepository.findById(numericId)
      : await blogRepository.findBySlug(slugOrId);
    if (!blog) {
      throw ApiError.notFound("Blog not found");
    }
    return blog;
  },

  async createBlog(data: CreateBlogInput) {
    const slug = slugify(data.title);

    const existing = await blogRepository.findBySlug(slug);
    if (existing) {
      throw ApiError.conflict("A blog with this slug already exists");
    }

    return blogRepository.create({
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt ?? undefined,
      image: data.image ?? undefined,
      author: { connect: { id: data.authorId ?? 1 } },
      status: (data.status as "DRAFT" | "PUBLISHED" | "ARCHIVED") ?? "DRAFT",
      metaTitle: data.metaTitle ?? undefined,
      metaDescription: data.metaDescription ?? undefined,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
    });
  },

  async updateBlog(id: number, data: UpdateBlogInput) {
    const existing = await blogRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("Blog not found");
    }

    const slug = data.title ? slugify(data.title) : existing.slug;

    if (slug !== existing.slug) {
      const slugExists = await blogRepository.findBySlug(slug);
      if (slugExists) {
        throw ApiError.conflict("A blog with this slug already exists");
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    updateData.slug = slug;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.authorId !== undefined) updateData.authorId = data.authorId;
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
    if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription;

    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === "PUBLISHED" && existing.status !== "PUBLISHED") {
        updateData.publishedAt = new Date();
      }
    }

    return blogRepository.update(id, updateData as never);
  },

  async deleteBlog(id: number) {
    const existing = await blogRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("Blog not found");
    }
    return blogRepository.delete(id);
  },
};
