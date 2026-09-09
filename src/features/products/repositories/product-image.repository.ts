import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";

export const productImageRepository = {
  async findById(id: bigint) {
    return db.productImage.findFirst({
      where: { id, is_active: true },
    });
  },

  async findActiveByProductId(productId: bigint) {
    return db.productImage.findMany({
      where: { productId, is_active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  },

  async countActiveByProductId(productId: bigint) {
    return db.productImage.count({
      where: { productId, is_active: true },
    });
  },

  async createManyWithPrimaryHandling(
    productId: bigint,
    imagesData: Array<{
      image_url: string;
      sortOrder: number;
      isPrimary: boolean;
      is_active: boolean;
      created_by?: bigint | null;
      updated_by?: bigint | null;
    }>
  ) {
    return db.$transaction(async (tx) => {
      // 1. Check if any image in the request array is explicitly marked primary
      const requestedPrimaryIndex = imagesData.findIndex((img) => img.isPrimary);

      // Check if existing active primary image exists in database
      const existingActivePrimary = await tx.productImage.findFirst({
        where: { productId, is_active: true, isPrimary: true },
      });

      const itemsToCreate = imagesData.map((img) => ({ ...img }));

      if (requestedPrimaryIndex !== -1) {
        // If an image in request is marked primary, reset existing active primary image in database
        if (existingActivePrimary) {
          await tx.productImage.updateMany({
            where: { productId, is_active: true },
            data: { isPrimary: false },
          });
        }
      } else if (!existingActivePrimary) {
        // If no image in request is marked primary AND no active primary image exists in DB, make the first image in request primary
        if (itemsToCreate.length > 0) {
          itemsToCreate[0].isPrimary = true;
        }
      }

      // 2. Create all image records inside transaction
      const createdImages = [];
      for (const item of itemsToCreate) {
        const created = await tx.productImage.create({
          data: {
            productId,
            image_url: item.image_url,
            sortOrder: item.sortOrder,
            isPrimary: item.isPrimary,
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

  async updateById(id: bigint, data: Prisma.ProductImageUncheckedUpdateInput) {
    const existing = await this.findById(id);
    if (!existing) return null;

    return db.productImage.update({
      where: { id: existing.id },
      data,
    });
  },

  async setPrimaryImage(productId: bigint, imageId: bigint) {
    return db.$transaction(async (tx) => {
      // 1. Reset all active images for this product to isPrimary = false
      await tx.productImage.updateMany({
        where: { productId, is_active: true },
        data: { isPrimary: false },
      });

      // 2. Set target image to isPrimary = true
      const target = await tx.productImage.findFirst({
        where: { id: imageId, productId, is_active: true },
      });

      if (!target) return null;

      return tx.productImage.update({
        where: { id: target.id },
        data: { isPrimary: true },
      });
    });
  },

  async softDeleteById(id: bigint, adminId?: bigint | null) {
    const existing = await this.findById(id);
    if (!existing) return null;

    return db.productImage.update({
      where: { id: existing.id },
      data: {
        is_active: false,
        isPrimary: false, // Clear primary status on deletion
        ...(adminId ? { updated_by: adminId } : {}),
      },
    });
  },

  async promoteLowestSortOrderPrimary(productId: bigint) {
    // Check if an active primary image already exists
    const currentPrimary = await db.productImage.findFirst({
      where: { productId, is_active: true, isPrimary: true },
    });

    if (currentPrimary) return currentPrimary;

    // Find candidate with lowest sortOrder among active images
    const candidate = await db.productImage.findFirst({
      where: { productId, is_active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    if (!candidate) return null;

    return db.productImage.update({
      where: { id: candidate.id },
      data: { isPrimary: true },
    });
  },
};
