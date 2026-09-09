import crypto from "crypto";
import { ApiError } from "@/lib/api/api-error";
import { brandRepository } from "../repositories/brand.repository";
import { userRepository } from "@/features/users/repositories/user.repository";
import type { Prisma } from "@/generated/prisma";
import type {
  GetBrandsParams,
  CreateBrandInput,
  UpdateBrandInput,
  GetAdminBrandsParams,
  AdminBrandResponse,
} from "../types";
import type {
  CreateAdminBrandInput,
  UpdateAdminBrandInput,
} from "../validations/admin-brand.schema";

function formatAdminBrandResponse(brand: {
  id: bigint;
  uuid: string | null;
  name: string;
  slug: string;
  description: string | null;
  status: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AdminBrandResponse {
  const brandUuid = brand.uuid || String(brand.id);
  return {
    id: brandUuid,
    name: brand.name,
    slug: brand.slug,
    description: brand.description ?? null,
    status: Boolean(brand.status),
    isActive: Boolean(brand.isActive),
    createdAt: brand.createdAt,
    updatedAt: brand.updatedAt,
  };
}

async function getAdminInternalId(email?: string): Promise<bigint | null> {
  if (!email) return null;
  const user = await userRepository.findByEmail(email);
  if (!user) return null;
  return BigInt(user.internalId || user.id);
}

export const brandService = {
  // Public Brand Methods
  async getBrands(params: GetBrandsParams = {}) {
    return brandRepository.findAll(params);
  },

  async getBrand(slugOrId: string) {
    const brand = await brandRepository.findBySlugOrId(slugOrId);
    if (!brand) {
      throw ApiError.notFound("Brand not found");
    }
    return brand;
  },

  async createBrand(data: CreateBrandInput) {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const existingSlug = await brandRepository.findBySlug(slug);
    if (existingSlug) {
      throw ApiError.conflict("A brand with this slug already exists");
    }

    return brandRepository.create({
      uuid: crypto.randomUUID(),
      name: data.name,
      slug,
      description: data.description,
      status: true,
      // isActive: data.isActive ?? true,
    });
  },

  async updateBrand(id: number, data: UpdateBrandInput) {
    const existing = await brandRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("Brand not found");
    }

    const slug = data.slug || (data.name ? data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : existing.slug);

    if (slug !== existing.slug) {
      const slugExists = await brandRepository.findBySlug(slug);
      if (slugExists) {
        throw ApiError.conflict("A brand with this slug already exists");
      }
    }

    const updateData: Prisma.ProductBrandUncheckedUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    updateData.slug = slug;
    if (data.description !== undefined) updateData.description = data.description;
    // if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return brandRepository.update(id, updateData);
  },

  async deleteBrand(id: number) {
    const existing = await brandRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("Brand not found");
    }

    return brandRepository.softDeleteByUuid(existing.uuid || String(existing.id));
  },

  // Admin Master Brand API Methods
  async createAdminBrand(
    data: CreateAdminBrandInput,
    adminEmail?: string
  ): Promise<AdminBrandResponse> {
    const adminId = await getAdminInternalId(adminEmail);

    // 1. Check duplicate slug
    const existingSlug = await brandRepository.findBySlug(data.slug);
    if (existingSlug) {
      throw ApiError.conflict(`A brand with slug '${data.slug}' already exists`);
    }

    // 2. Check duplicate name
    const existingName = await brandRepository.findByName(data.name);
    if (existingName) {
      throw ApiError.conflict(`A brand with name '${data.name}' already exists`);
    }

    const created = await brandRepository.create({
      uuid: crypto.randomUUID(),
      name: data.name,
      slug: data.slug, // Use exact frontend slug without modification
      description: data.description ?? null,
      status: true, // Static reserved field - always set to true
      isActive: true, // Active status
      created_by: adminId,
      updated_by: adminId,
    });

    return formatAdminBrandResponse(created);
  },

  async getAdminBrands(params: GetAdminBrandsParams = {}) {
    const result = await brandRepository.findAdminAll(params);
    return {
      data: result.data.map((b) => formatAdminBrandResponse(b)),
      meta: result.meta,
    };
  },

  async getAdminBrandByUuid(uuid: string): Promise<AdminBrandResponse> {
    const brand = await brandRepository.findByUuid(uuid);
    if (!brand) {
      throw ApiError.notFound("Brand not found");
    }
    return formatAdminBrandResponse(brand);
  },

  async updateAdminBrand(
    uuid: string,
    data: UpdateAdminBrandInput,
    adminEmail?: string
  ): Promise<AdminBrandResponse> {
    const existing = await brandRepository.findByUuid(uuid);
    if (!existing) {
      throw ApiError.notFound("Brand not found");
    }

    const adminId = await getAdminInternalId(adminEmail);
    const updateData: Prisma.ProductBrandUncheckedUpdateInput = {};

    if (adminId) {
      updateData.updated_by = adminId;
    }

    // Check slug conflict if slug changes
    if (data.slug !== undefined && data.slug !== existing.slug) {
      const slugConflict = await brandRepository.findBySlug(data.slug, uuid);
      if (slugConflict) {
        throw ApiError.conflict(`A brand with slug '${data.slug}' already exists`);
      }
      updateData.slug = data.slug;
    }

    // Check name conflict if name changes
    if (data.name !== undefined && data.name !== existing.name) {
      const nameConflict = await brandRepository.findByName(data.name, uuid);
      if (nameConflict) {
        throw ApiError.conflict(`A brand with name '${data.name}' already exists`);
      }
      updateData.name = data.name;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    const updated = await brandRepository.updateByUuid(uuid, updateData);
    if (!updated) {
      throw ApiError.notFound("Brand not found");
    }

    return formatAdminBrandResponse(updated);
  },

  async deleteAdminBrand(uuid: string, adminEmail?: string) {
    const existing = await brandRepository.findByUuid(uuid);
    if (!existing) {
      throw ApiError.notFound("Brand not found");
    }

    const adminId = await getAdminInternalId(adminEmail);
    await brandRepository.softDeleteByUuid(uuid, adminId);

    return {
      success: true,
      message: "Brand deleted successfully",
    };
  },
};
