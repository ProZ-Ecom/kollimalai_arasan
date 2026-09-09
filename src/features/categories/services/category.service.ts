import crypto from "crypto";
import { ApiError } from "@/lib/api/api-error";
import { categoryRepository } from "../repositories/category.repository";
import { userRepository } from "@/features/users/repositories/user.repository";
import type { Prisma } from "@/generated/prisma";
import type {
  GetCategoriesParams,
  CreateCategoryInput,
  UpdateCategoryInput,
  GetAdminCategoriesParams,
  AdminCategoryResponse,
  AdminCategoriesCountResponse,
} from "../types";
import type {
  CreateAdminCategoryInput,
  UpdateAdminCategoryInput,
} from "../validations/admin-category.schema";

function formatAdminCategoryResponse(category: {
  id: bigint;
  uuid: string | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  status: boolean | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): AdminCategoryResponse {
  const categoryUuid = category.uuid || String(category.id);
  return {
    id: categoryUuid,
    name: category.name,
    slug: category.slug,
    description: category.description ?? null,
    icon: category.icon ?? null,
    status: category.status === null || category.status === undefined ? true : Boolean(category.status),
    isActive: Boolean(category.isActive),
    sortOrder: category.sortOrder ?? 0,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

async function getAdminInternalId(email?: string): Promise<bigint | null> {
  if (!email) return null;
  const user = await userRepository.findByEmail(email);
  if (!user) return null;
  return BigInt(user.internalId || user.id);
}

export const categoryService = {
  // Public Category Methods
  async getCategories(params: GetCategoriesParams = {}) {
    return categoryRepository.findAll(params);
  },

  async getCategory(slugOrId: string) {
    const category = await categoryRepository.findBySlugOrId(slugOrId);
    if (!category) {
      throw ApiError.notFound("Category not found");
    }
    return category;
  },

  async getCategoryById(id: number) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw ApiError.notFound("Category not found");
    }
    return category;
  },

  async createCategory(data: CreateCategoryInput) {
    const existingSlug = await categoryRepository.findBySlug(data.slug);
    if (existingSlug) {
      throw ApiError.conflict("A category with this slug already exists");
    }
    // if (data.parentId) {
    //   const parent = await categoryRepository.findById(data.parentId);
    //   if (!parent) {
    //     throw ApiError.badRequest("Parent category not found");
    //   }
    // }

    return categoryRepository.create({
      name: data.name,
      slug: data.slug,
      description: data.description,
      icon: data.image,
      isActive: data.isActive ?? true,
      status: true,
      sortOrder: data.sortOrder ?? 0,
    });
  },

  async updateCategory(id: number, data: UpdateCategoryInput) {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("Category not found");
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await categoryRepository.findBySlug(data.slug);
      if (slugExists) {
        throw ApiError.conflict("A category with this slug already exists");
      }
    }

    const updateData: Prisma.ProductCategoryUncheckedUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.image !== undefined) updateData.icon = data.image;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    return categoryRepository.update(id, updateData);
  },

  async deleteCategory(id: number) {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("Category not found");
    }

    return categoryRepository.softDeleteByUuid(existing.uuid || String(existing.id));
  },

  // Admin Master Category API Methods
  async createAdminCategory(
    data: CreateAdminCategoryInput,
    adminEmail?: string
  ): Promise<AdminCategoryResponse> {
    const adminId = await getAdminInternalId(adminEmail);

    // 1. Check duplicate slug
    const existingSlug = await categoryRepository.findBySlug(data.slug);
    if (existingSlug) {
      throw ApiError.conflict(`A category with slug '${data.slug}' already exists`);
    }

    // 2. Check duplicate name
    const existingName = await categoryRepository.findByName(data.name);
    if (existingName) {
      throw ApiError.conflict(`A category with name '${data.name}' already exists`);
    }

    const created = await categoryRepository.create({
      uuid: crypto.randomUUID(),
      name: data.name,
      slug: data.slug, // Use exact frontend slug without modification
      description: data.description ?? null,
      icon: data.icon ?? null,
      sortOrder: data.sortOrder ?? 0,
      status: true, // Reserved field - always set to true
      isActive: true, // Active status
      created_by: adminId,
      updated_by: adminId,
    });

    return formatAdminCategoryResponse(created);
  },

  async getAdminCategories(params: GetAdminCategoriesParams = {}) {
    const result = await categoryRepository.findAdminAll(params);
    return {
      data: result.data.map((cat) => formatAdminCategoryResponse(cat)),
      meta: result.meta,
    };
  },

  async countAdminCategories(
    params: GetAdminCategoriesParams = {}
  ): Promise<AdminCategoriesCountResponse> {
    return categoryRepository.countAdminCategories(params);
  },

  async getAdminCategoryByUuid(uuid: string): Promise<AdminCategoryResponse> {
    const category = await categoryRepository.findByUuid(uuid);
    if (!category) {
      throw ApiError.notFound("Category not found");
    }
    return formatAdminCategoryResponse(category);
  },

  async updateAdminCategory(
    uuid: string,
    data: UpdateAdminCategoryInput,
    adminEmail?: string
  ): Promise<AdminCategoryResponse> {
    const existing = await categoryRepository.findByUuid(uuid);
    if (!existing) {
      throw ApiError.notFound("Category not found");
    }

    const adminId = await getAdminInternalId(adminEmail);
    const updateData: Prisma.ProductCategoryUncheckedUpdateInput = {};

    if (adminId) {
      updateData.updated_by = adminId;
    }

    // Check slug conflict if slug changes
    if (data.slug !== undefined && data.slug !== existing.slug) {
      const slugConflict = await categoryRepository.findBySlug(data.slug, uuid);
      if (slugConflict) {
        throw ApiError.conflict(`A category with slug '${data.slug}' already exists`);
      }
      updateData.slug = data.slug;
    }

    // Check name conflict if name changes
    if (data.name !== undefined && data.name !== existing.name) {
      const nameConflict = await categoryRepository.findByName(data.name, uuid);
      if (nameConflict) {
        throw ApiError.conflict(`A category with name '${data.name}' already exists`);
      }
      updateData.name = data.name;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.icon !== undefined) {
      updateData.icon = data.icon;
    }

    if (data.sortOrder !== undefined) {
      updateData.sortOrder = data.sortOrder;
    }

    const updated = await categoryRepository.updateByUuid(uuid, updateData);
    if (!updated) {
      throw ApiError.notFound("Category not found");
    }

    return formatAdminCategoryResponse(updated);
  },

  async deleteAdminCategory(uuid: string, adminEmail?: string) {
    const existing = await categoryRepository.findByUuid(uuid);
    if (!existing) {
      throw ApiError.notFound("Category not found");
    }

    const adminId = await getAdminInternalId(adminEmail);
    await categoryRepository.softDeleteByUuid(uuid, adminId);

    return {
      success: true,
      message: "Category deleted successfully",
    };
  },
};
