import crypto from "crypto";
import { ApiError } from "@/lib/api/api-error";
import { variantRepository } from "../repositories/variant.repository";
import { productRepository } from "@/features/products/repositories/product.repository";
import { userRepository } from "@/features/users/repositories/user.repository";
import { formatVariantMeasurement } from "../utils/measurement.util";
import type { Prisma } from "@/generated/prisma";
import type {
  AdminVariantResponse,
  VariantUnitPriceResponse,
  GetAdminVariantsParams,
  AdminVariantListParams,
  AdminVariantsCountResponse,
} from "../types";
import type {
  CreateAdminVariantInput,
  UpdateAdminVariantInput,
} from "../validations/admin-variant.schema";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/&/g, "-and-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

type VariantUnitPriceWithRelations = {
  id: bigint;
  uuid: string;
  variant_id: bigint;
  sku: string;
  base_price: Prisma.Decimal | number;
  unit_value: Prisma.Decimal | number;
  unit_id: bigint;
  is_default: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  product_units?: { uuid: string | null; name: string; code: string; type?: string | null } | null;
  inventories?: { quantity_available: number; quantity_reserved: number } | null;
};

export function formatUnitPriceResponse(
  variantUuid: string,
  item: VariantUnitPriceWithRelations
): VariantUnitPriceResponse {
  const unitUuid = item.product_units?.uuid || String(item.unit_id);
  const measurement = formatVariantMeasurement(
    {
      type: item.product_units?.type,
      code: item.product_units?.code,
      uuid: unitUuid,
    },
    item.unit_value,
    unitUuid
  );

  return {
    id: item.uuid,
    variantId: variantUuid,
    sku: item.sku,
    basePrice: Number(item.base_price),
    measurement,
    unitId: unitUuid,
    unitValue: Number(item.unit_value),
    unitName: item.product_units?.name,
    unitCode: item.product_units?.code,
    isDefault: Boolean(item.is_default),
    isActive: Boolean(item.isActive),
    stock: item.inventories?.quantity_available,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function formatAdminVariantResponse(
  variant: {
    id: bigint;
    uuid: string;
    productId: bigint;
    variant_name?: string | null;
    slug?: string | null;
    short_description?: string | null;
    description?: string | null;
    ingredients?: string | null;
    is_ready_to_mix?: boolean;
    cooking_recipe?: string | null;
    shelf_life?: string | null;
    veg_type?: string | null;
    is_featured?: boolean;
    isActive: boolean;
    out_of_stock?: boolean;
    createdAt: Date;
    updatedAt: Date;
    product?: { uuid: string | null; name: string; slug?: string | null } | null;
    product_variant_images?: Array<{ image_url: string; is_primary: boolean }> | null;
    variant_unit_prices?: VariantUnitPriceWithRelations[] | null;
  },
  cachedProductUuid?: string,
  cachedProductName?: string
): AdminVariantResponse {
  const variantUuid = variant.uuid;
  const productUuid = cachedProductUuid ?? variant.product?.uuid ?? String(variant.productId);
  const productName = cachedProductName || variant.product?.name || "";
  const productSlug = variant.product?.slug || "";
  const variantName = variant.variant_name || "";

  const primaryImgObj =
    variant.product_variant_images?.find((img) => img.is_primary) ??
    variant.product_variant_images?.[0];
  const primaryImage = primaryImgObj ? primaryImgObj.image_url : null;

  const unitPrices = (variant.variant_unit_prices || []).map((up) =>
    formatUnitPriceResponse(variantUuid, up)
  );

  const defaultUnitPrice =
    unitPrices.find((up) => up.isDefault) ?? unitPrices[0] ?? undefined;

  const totalStock = unitPrices.reduce(
    (sum, up) => (up.stock !== undefined ? sum + up.stock : sum),
    0
  );

  return {
    id: variantUuid,
    productId: productUuid,
    productName,
    productSlug,
    variantName,
    slug: variant.slug || "",
    shortDescription: variant.short_description ?? null,
    description: variant.description ?? null,
    ingredients: variant.ingredients ?? null,
    isReadyToMix: Boolean(variant.is_ready_to_mix),
    cookingRecipe: variant.cooking_recipe ?? null,
    shelfLife: variant.shelf_life ?? null,
    vegType: (variant.veg_type as AdminVariantResponse["vegType"]) || "na",
    isFeatured: Boolean(variant.is_featured),
    primaryImage,
    isActive: Boolean(variant.isActive),
    outOfStock: Boolean(variant.out_of_stock),
    createdAt: variant.createdAt,
    updatedAt: variant.updatedAt,
    unitPrices,
    // Backward-compatible convenience fields mirrored from the default unit price
    measurement: defaultUnitPrice?.measurement,
    sku: defaultUnitPrice?.sku,
    basePrice: defaultUnitPrice?.basePrice,
    salePrice: defaultUnitPrice?.basePrice,
    stock: unitPrices.length > 0 ? totalStock : undefined,
    unitId: defaultUnitPrice?.unitId,
    unitValue: defaultUnitPrice?.unitValue,
    unitName: defaultUnitPrice?.unitName,
    unitCode: defaultUnitPrice?.unitCode,
  };
}

async function getAdminInternalId(email?: string): Promise<bigint | null> {
  if (!email) return null;
  const user = await userRepository.findByEmail(email);
  if (!user) return null;
  return BigInt(user.internalId || user.id);
}

export const variantService = {
  async createAdminVariant(
    productUuid: string,
    data: CreateAdminVariantInput,
    adminEmail?: string
  ): Promise<AdminVariantResponse> {
    const adminId = await getAdminInternalId(adminEmail);

    // 1. Resolve & Validate Product
    const product = await productRepository.findByUuid(productUuid);
    if (!product || !product.isActive || product.deleted_at !== null) {
      throw ApiError.notFound("Product not found or inactive");
    }

    // 2. Validate Slug
    const variantSlug = slugify(data.slug).substring(0, 250);
    const existingSlug = await variantRepository.findBySlug(variantSlug);
    if (existingSlug) {
      throw ApiError.conflict(`An active variant with slug '${data.slug}' already exists`);
    }

    // 3. Create Variant (item-level only; unit/price combos are managed
    // separately via variantUnitPriceService)
    const variant = await variantRepository.create({
      uuid: crypto.randomUUID(),
      productId: product.id,
      variant_name: data.variantName,
      slug: variantSlug,
      short_description: data.shortDescription ?? null,
      description: data.description ?? null,
      ingredients: data.ingredients ?? null,
      is_ready_to_mix: data.isReadyToMix ?? false,
      cooking_recipe: data.cookingRecipe ?? null,
      shelf_life: data.shelfLife ?? null,
      veg_type: (data.vegType as Prisma.ProductVariantUncheckedCreateInput["veg_type"]) ?? "na",
      is_featured: data.isFeatured ?? false,
      isActive: data.isActive !== undefined ? data.isActive : true,
      out_of_stock: data.outOfStock !== undefined ? data.outOfStock : false,
      created_by: adminId,
      updated_by: adminId,
    });

    return formatAdminVariantResponse(variant, product.uuid || productUuid, product.name);
  },

  async getAllAdminVariants(params: AdminVariantListParams = {}) {
    const result = await variantRepository.findAdminVariants(params);
    const data = result.data.map((item) => formatAdminVariantResponse(item));

    return {
      data,
      meta: result.meta,
    };
  },

  async countAdminVariants(
    params: AdminVariantListParams = {}
  ): Promise<AdminVariantsCountResponse> {
    return variantRepository.countAdminVariants(params);
  },

  async getAdminVariants(
    productUuid: string,
    params: GetAdminVariantsParams = {}
  ) {
    const product = await productRepository.findByUuid(productUuid);
    if (!product || !product.isActive || product.deleted_at !== null) {
      throw ApiError.notFound("Product not found or inactive");
    }

    const result = await variantRepository.findAdminAllByProductId(product.id, params);
    const data = result.data.map((item) =>
      formatAdminVariantResponse(item, product.uuid || productUuid, product.name)
    );

    return {
      data,
      meta: result.meta,
    };
  },

  async getAdminVariantByUuid(
    productUuid: string,
    variantUuid: string
  ): Promise<AdminVariantResponse> {
    const product = await productRepository.findByUuid(productUuid);
    if (!product || !product.isActive || product.deleted_at !== null) {
      throw ApiError.notFound("Product not found or inactive");
    }

    const variant = await variantRepository.findByUuid(variantUuid);
    if (!variant || variant.productId !== product.id) {
      throw ApiError.notFound("Variant not found for this product");
    }

    return formatAdminVariantResponse(variant, product.uuid || productUuid, product.name);
  },

  async getVariantByUuid(variantUuid: string): Promise<AdminVariantResponse> {
    const variant = await variantRepository.findByUuid(variantUuid);
    if (!variant || variant.deleted_at !== null) {
      throw ApiError.notFound("Variant not found");
    }

    return formatAdminVariantResponse(variant);
  },

  async updateAdminVariant(
    productUuid: string,
    variantUuid: string,
    data: UpdateAdminVariantInput,
    adminEmail?: string
  ): Promise<AdminVariantResponse> {
    const product = await productRepository.findByUuid(productUuid);
    if (!product || !product.isActive || product.deleted_at !== null) {
      throw ApiError.notFound("Product not found or inactive");
    }

    const existing = await variantRepository.findByUuid(variantUuid);
    if (!existing || existing.productId !== product.id) {
      throw ApiError.notFound("Variant not found for this product");
    }

    const adminId = await getAdminInternalId(adminEmail);
    const updateData = buildVariantUpdateData(data, adminId);

    if (data.slug !== undefined) {
      const normalizedSlug = slugify(data.slug).substring(0, 250);
      const slugConflict = await variantRepository.findBySlug(normalizedSlug, variantUuid);
      if (slugConflict) {
        throw ApiError.conflict(`A variant with slug '${data.slug}' already exists`);
      }
      updateData.slug = normalizedSlug;
    }

    const updated = await variantRepository.updateByUuid(variantUuid, updateData, adminId);
    if (!updated) {
      throw ApiError.notFound("Variant not found");
    }

    return formatAdminVariantResponse(updated, product.uuid || productUuid, product.name);
  },

  async updateVariantByUuid(
    variantUuid: string,
    data: UpdateAdminVariantInput,
    adminEmail?: string
  ): Promise<AdminVariantResponse> {
    const existing = await variantRepository.findByUuid(variantUuid);
    if (!existing || existing.deleted_at !== null) {
      throw ApiError.notFound("Variant not found");
    }

    const adminId = await getAdminInternalId(adminEmail);
    const updateData = buildVariantUpdateData(data, adminId);

    if (data.slug !== undefined) {
      const normalizedSlug = slugify(data.slug).substring(0, 250);
      const slugConflict = await variantRepository.findBySlug(normalizedSlug, variantUuid);
      if (slugConflict) {
        throw ApiError.conflict(`A variant with slug '${data.slug}' already exists`);
      }
      updateData.slug = normalizedSlug;
    }

    const updated = await variantRepository.updateByUuid(variantUuid, updateData, adminId);
    if (!updated) {
      throw ApiError.notFound("Variant not found");
    }

    return formatAdminVariantResponse(updated);
  },

  async deleteAdminVariant(
    productUuid: string,
    variantUuid: string,
    adminEmail?: string
  ) {
    const product = await productRepository.findByUuid(productUuid);
    if (!product || !product.isActive || product.deleted_at !== null) {
      throw ApiError.notFound("Product not found or inactive");
    }

    const existing = await variantRepository.findByUuid(variantUuid);
    if (!existing || existing.productId !== product.id) {
      throw ApiError.notFound("Variant not found for this product");
    }

    const adminId = await getAdminInternalId(adminEmail);
    await variantRepository.softDeleteByUuid(variantUuid, adminId);

    return {
      success: true,
      message: "Variant deleted successfully",
    };
  },
};

function buildVariantUpdateData(
  data: UpdateAdminVariantInput,
  adminId: bigint | null
): Prisma.ProductVariantUncheckedUpdateInput {
  const updateData: Prisma.ProductVariantUncheckedUpdateInput = {};

  if (adminId) {
    updateData.updated_by = adminId;
  }
  if (data.variantName !== undefined) {
    updateData.variant_name = data.variantName;
  }
  if (data.shortDescription !== undefined) {
    updateData.short_description = data.shortDescription;
  }
  if (data.description !== undefined) {
    updateData.description = data.description;
  }
  if (data.ingredients !== undefined) {
    updateData.ingredients = data.ingredients;
  }
  if (data.isReadyToMix !== undefined) {
    updateData.is_ready_to_mix = data.isReadyToMix;
  }
  if (data.cookingRecipe !== undefined) {
    updateData.cooking_recipe = data.cookingRecipe;
  }
  if (data.shelfLife !== undefined) {
    updateData.shelf_life = data.shelfLife;
  }
  if (data.vegType !== undefined) {
    updateData.veg_type = data.vegType as Prisma.ProductVariantUncheckedUpdateInput["veg_type"];
  }
  if (data.isFeatured !== undefined) {
    updateData.is_featured = data.isFeatured;
  }
  if (typeof data.isActive === "boolean") {
    updateData.isActive = data.isActive;
  }
  if (typeof data.outOfStock === "boolean") {
    updateData.out_of_stock = data.outOfStock;
  }

  return updateData;
}
