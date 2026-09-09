import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";

export const variantImageRepository = {
  async findByUuid(uuid: string) {
    return db.product_variant_images.findFirst({
      where: { uuid, is_active: true },
    });
  },

  async findActiveByVariantId(variantId: bigint) {
    return db.product_variant_images.findMany({
      where: { variant_id: variantId, is_active: true },
      orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
    });
  },

  async countActiveByVariantId(variantId: bigint) {
    return db.product_variant_images.count({
      where: { variant_id: variantId, is_active: true },
    });
  },

  async create(data: Prisma.product_variant_imagesUncheckedCreateInput) {
    return db.product_variant_images.create({
      data,
    });
  },

  async createManyWithPrimaryHandling(
    variantId: bigint,
    imagesData: Array<{
      uuid: string;
      image_url: string;
      sort_order: number;
      is_primary: boolean;
      status: boolean;
      is_active: boolean;
      created_by?: bigint | null;
      updated_by?: bigint | null;
    }>
  ) {
    return db.$transaction(async (tx) => {
      // 1. Check if any image in the request array is explicitly marked primary
      const requestedPrimaryIndex = imagesData.findIndex((img) => img.is_primary);

      // Check if existing active primary image exists in database
      const existingActivePrimary = await tx.product_variant_images.findFirst({
        where: { variant_id: variantId, is_active: true, is_primary: true },
      });

      const itemsToCreate = imagesData.map((img) => ({ ...img }));

      if (requestedPrimaryIndex !== -1) {
        // If an image in request is marked primary, reset existing active primary image in database
        if (existingActivePrimary) {
          await tx.product_variant_images.updateMany({
            where: { variant_id: variantId, is_active: true },
            data: { is_primary: false },
          });
        }
      } else if (!existingActivePrimary) {
        // If no image in request is marked primary AND no active primary image exists in DB, make the first image in request primary
        if (itemsToCreate.length > 0) {
          itemsToCreate[0].is_primary = true;
        }
      }

      // 2. Create all image records inside transaction
      const createdImages = [];
      for (const item of itemsToCreate) {
        const created = await tx.product_variant_images.create({
          data: {
            uuid: item.uuid,
            variant_id: variantId,
            image_url: item.image_url,
            sort_order: item.sort_order,
            is_primary: item.is_primary,
            status: item.status,
            is_active: item.is_active,
            created_by: item.created_by,
            updated_by: item.updated_by,
          },
        });
        createdImages.push(created);
      }

      return createdImages;
    });
  },

  async updateByUuid(
    uuid: string,
    data: Prisma.product_variant_imagesUncheckedUpdateInput
  ) {
    const existing = await this.findByUuid(uuid);
    if (!existing) return null;

    return db.product_variant_images.update({
      where: { id: existing.id },
      data,
    });
  },

  async setPrimaryImage(variantId: bigint, imageUuid: string) {
    return db.$transaction(async (tx) => {
      // 1. Reset all active images for this variant to is_primary = false
      await tx.product_variant_images.updateMany({
        where: { variant_id: variantId, is_active: true },
        data: { is_primary: false },
      });

      // 2. Set target image to is_primary = true
      const target = await tx.product_variant_images.findFirst({
        where: { uuid: imageUuid, variant_id: variantId, is_active: true },
      });

      if (!target) return null;

      return tx.product_variant_images.update({
        where: { id: target.id },
        data: { is_primary: true },
      });
    });
  },

  async softDeleteByUuid(uuid: string, adminId?: bigint | null) {
    const existing = await this.findByUuid(uuid);
    if (!existing) return null;

    return db.product_variant_images.update({
      where: { id: existing.id },
      data: {
        is_active: false,
        is_primary: false, // Clear primary status on deletion
        ...(adminId ? { updated_by: adminId } : {}),
      },
    });
  },

  async promoteLowestSortOrderPrimary(variantId: bigint) {
    // Check if an active primary image already exists
    const currentPrimary = await db.product_variant_images.findFirst({
      where: { variant_id: variantId, is_active: true, is_primary: true },
    });

    if (currentPrimary) return currentPrimary;

    // Find candidate with lowest sort_order among active images
    const candidate = await db.product_variant_images.findFirst({
      where: { variant_id: variantId, is_active: true },
      orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
    });

    if (!candidate) return null;

    return db.product_variant_images.update({
      where: { id: candidate.id },
      data: { is_primary: true },
    });
  },
};
