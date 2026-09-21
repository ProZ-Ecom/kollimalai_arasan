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

    const isPublished = data.status === "PUBLISHED";
    return blogRepository.create({
      title: data.title,
      slug,
      content: data.content,
      featured_image: data.image ?? undefined,
      author: data.authorId ? { connect: { id: data.authorId } } : undefined,
      is_published: isPublished,
      publishedAt: isPublished ? new Date() : null,
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
    if (data.image !== undefined) updateData.featured_image = data.image;
    if (data.authorId !== undefined) {
      updateData.author = { connect: { id: data.authorId } };
    }

    if (data.status !== undefined) {
      const isPublished = data.status === "PUBLISHED";
      updateData.is_published = isPublished;
      if (isPublished && !existing.is_published) {
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
