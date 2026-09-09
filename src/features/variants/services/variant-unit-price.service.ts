import crypto from "crypto";
import { ApiError } from "@/lib/api/api-error";
import { db } from "@/lib/db/prisma";
import { variantRepository } from "../repositories/variant.repository";
import { variantUnitPriceRepository } from "../repositories/variant-unit-price.repository";
import { unitRepository } from "@/features/units/repositories/unit.repository";
import { userRepository } from "@/features/users/repositories/user.repository";
import { formatUnitPriceResponse } from "./variant.service";
import type { Prisma } from "@/generated/prisma";
import type {
  VariantUnitPriceResponse,
  VariantPriceHistoryResponse,
  GetVariantPriceHistoryParams,
  PriceHistoryChartItem,
  BulkEditVariantItem,
} from "../types";
import type {
  CreateVariantUnitPriceInput,
  UpdateVariantUnitPriceInput,
} from "../validations/admin-variant-unit-price.schema";

function formatVariantPriceHistory(
  item: Prisma.variant_price_historyGetPayload<{
    include: {
      users_variant_price_history_created_byTousers: {
        select: {
          id: true;
          uuid: true;
          name: true;
        };
      };
    };
  }>
): VariantPriceHistoryResponse {
  const user = item.users_variant_price_history_created_byTousers;
  const oldPrice = item.old_base_price !== null ? Number(item.old_base_price) : null;
  const newPrice = item.new_base_price !== null ? Number(item.new_base_price) : null;

  return {
    id: item.uuid || String(item.id),
    variantUnitPriceId: String(item.variant_unit_price_id),
    oldPrice,
    newPrice,
    oldBasePrice: oldPrice,
    newBasePrice: newPrice,
    changedAt: item.changed_at,
    changedBy: user
      ? {
          id: user.uuid || String(user.id),
          name: user.name,
        }
      : null,
  };
}

async function getAdminInternalId(email?: string): Promise<bigint | null> {
  if (!email) return null;
  const user = await userRepository.findByEmail(email);
  if (!user) return null;
  return BigInt(user.internalId || user.id);
}

export const variantUnitPriceService = {
  async listByVariantUuid(variantUuid: string): Promise<VariantUnitPriceResponse[]> {
    const variant = await variantRepository.findByUuid(variantUuid);
    if (!variant || variant.deleted_at !== null) {
      throw ApiError.notFound("Variant not found");
    }

    const items = await variantUnitPriceRepository.findAllByVariantId(variant.id);
    return items.map((item) => formatUnitPriceResponse(variantUuid, item));
  },

  async createUnitPrice(
    variantUuid: string,
    data: CreateVariantUnitPriceInput,
    adminEmail?: string
  ): Promise<VariantUnitPriceResponse> {
    const adminId = await getAdminInternalId(adminEmail);

    const variant = await variantRepository.findByUuid(variantUuid);
    if (!variant || variant.deleted_at !== null) {
      throw ApiError.notFound("Variant not found");
    }

    const unit = await unitRepository.findByUuid(data.unitId);
    if (!unit || !unit.is_active) {
      throw ApiError.badRequest("Invalid or inactive unit");
    }

    const existingSku = await variantUnitPriceRepository.findBySku(data.sku);
    if (existingSku) {
      throw ApiError.conflict(`An active unit price with SKU '${data.sku}' already exists`);
    }

    const duplicateUnit = await variantUnitPriceRepository.findByVariantAndUnit(
      variant.id,
      unit.id,
      data.unitValue
    );
    if (duplicateUnit) {
      throw ApiError.conflict("This item already has a price for that unit and measurement");
    }

    if (data.isDefault) {
      await variantUnitPriceRepository.unsetDefaultForVariant(variant.id);
    }

    const created = await variantUnitPriceRepository.create({
      uuid: crypto.randomUUID(),
      variant_id: variant.id,
      unit_id: unit.id,
      unit_value: data.unitValue,
      sku: data.sku,
      base_price: data.basePrice,
      is_default: data.isDefault ?? false,
      isActive: data.isActive !== undefined ? data.isActive : true,
      created_by: adminId,
      updated_by: adminId,
    });

    if (data.stock !== undefined) {
      await db.inventory.upsert({
        where: { variantUnitPriceId: created.id },
        create: {
          variantUnitPriceId: created.id,
          quantity_available: data.stock,
          quantity_reserved: 0,
          is_active: true,
          created_by: adminId,
          updated_by: adminId,
        },
        update: {
          quantity_available: data.stock,
          updated_by: adminId,
        },
      });
    }

    const withDetails = await variantUnitPriceRepository.findByUuid(created.uuid);
    return formatUnitPriceResponse(variantUuid, withDetails || created);
  },

  async updateUnitPrice(
    variantUuid: string,
    unitPriceUuid: string,
    data: UpdateVariantUnitPriceInput,
    adminEmail?: string
  ): Promise<VariantUnitPriceResponse> {
    const variant = await variantRepository.findByUuid(variantUuid);
    if (!variant || variant.deleted_at !== null) {
      throw ApiError.notFound("Variant not found");
    }

    const existing = await variantUnitPriceRepository.findByUuid(unitPriceUuid);
    if (!existing || existing.variant_id !== variant.id) {
      throw ApiError.notFound("Unit price not found for this variant");
    }

    const adminId = await getAdminInternalId(adminEmail);
    const updateData: Prisma.VariantUnitPriceUncheckedUpdateInput & { stock?: number } = {};

    if (adminId) {
      updateData.updated_by = adminId;
    }

    let effectiveUnitId = existing.unit_id;
    if (data.unitId !== undefined) {
      const unit = await unitRepository.findByUuid(data.unitId);
      if (!unit || !unit.is_active) {
        throw ApiError.badRequest("Invalid or inactive unit");
      }
      effectiveUnitId = unit.id;
      updateData.unit_id = unit.id;
    }

    const effectiveUnitValue =
      data.unitValue !== undefined ? data.unitValue : existing.unit_value;

    if (data.unitId !== undefined || data.unitValue !== undefined) {
      const duplicateUnit = await variantUnitPriceRepository.findByVariantAndUnit(
        variant.id,
        effectiveUnitId,
        effectiveUnitValue,
        unitPriceUuid
      );
      if (duplicateUnit) {
        throw ApiError.conflict("This item already has a price for that unit and measurement");
      }
    }

    if (data.unitValue !== undefined) {
      updateData.unit_value = data.unitValue;
    }

    if (data.sku !== undefined && data.sku !== existing.sku) {
      const skuConflict = await variantUnitPriceRepository.findBySku(data.sku, unitPriceUuid);
      if (skuConflict) {
        throw ApiError.conflict(`An active unit price with SKU '${data.sku}' already exists`);
      }
      updateData.sku = data.sku;
    }

    if (data.basePrice !== undefined) {
      updateData.base_price = data.basePrice;
    }

    if (typeof data.isDefault === "boolean") {
      updateData.is_default = data.isDefault;
    }

    if (typeof data.isActive === "boolean") {
      updateData.isActive = data.isActive;
    }

    if (data.stock !== undefined) {
      updateData.stock = data.stock;
    }

    const updated = await variantUnitPriceRepository.updateByUuid(
      unitPriceUuid,
      updateData,
      adminId
    );
    if (!updated) {
      throw ApiError.notFound("Unit price not found");
    }

    return formatUnitPriceResponse(variantUuid, updated);
  },

  async deleteUnitPrice(
    variantUuid: string,
    unitPriceUuid: string,
    adminEmail?: string
  ) {
    const variant = await variantRepository.findByUuid(variantUuid);
    if (!variant || variant.deleted_at !== null) {
      throw ApiError.notFound("Variant not found");
    }

    const existing = await variantUnitPriceRepository.findByUuid(unitPriceUuid);
    if (!existing || existing.variant_id !== variant.id) {
      throw ApiError.notFound("Unit price not found for this variant");
    }

    const adminId = await getAdminInternalId(adminEmail);
    await variantUnitPriceRepository.softDeleteByUuid(unitPriceUuid, adminId);

    return { success: true, message: "Unit price deleted successfully" };
  },

  async bulkUpdateUnitPrices(
    body: { variants: BulkEditVariantItem[] },
    adminEmail?: string
  ): Promise<VariantUnitPriceResponse[]> {
    const adminId = await getAdminInternalId(adminEmail);

    try {
      const updated = await variantUnitPriceRepository.bulkUpdateUnitPrices(
        body.variants,
        adminId
      );

      return updated.map((item) =>
        formatUnitPriceResponse(item.variant?.uuid || "", item)
      );
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      if (message.includes("not found")) {
        throw ApiError.notFound(message);
      }
      throw e;
    }
  },

  async getPriceHistory(
    unitPriceUuid: string,
    params: GetVariantPriceHistoryParams = {}
  ) {
    const unitPrice = await variantUnitPriceRepository.findByUuid(unitPriceUuid);
    if (!unitPrice || unitPrice.deleted_at !== null) {
      throw ApiError.notFound("Variant unit price not found");
    }

    const result = await variantUnitPriceRepository.findPriceHistoryByUnitPriceId(
      unitPrice.id,
      params
    );

    return {
      data: result.data.map(formatVariantPriceHistory),
      meta: result.meta,
    };
  },

  async getPriceHistoryChart(
    unitPriceUuid: string,
    period: string = "1y"
  ): Promise<PriceHistoryChartItem[]> {
    const unitPrice = await variantUnitPriceRepository.findByUuid(unitPriceUuid);
    if (!unitPrice || unitPrice.deleted_at !== null) {
      throw ApiError.notFound("Variant unit price not found");
    }

    const currentBasePrice = Number(unitPrice.base_price);

    const histories = await variantUnitPriceRepository.findPriceHistoryAllByUnitPriceId(
      unitPrice.id
    );

    let monthsCount = 12;
    if (period === "1m") monthsCount = 1;
    else if (period === "3m") monthsCount = 3;
    else if (period === "6m") monthsCount = 6;
    else if (period === "1y") monthsCount = 12;

    const now = new Date();
    const monthsList: string[] = [];

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
      monthsList.push(`${year}-${month}`);
    }

    const chartData: PriceHistoryChartItem[] = [];

    for (const monthStr of monthsList) {
      const [yearStr, monthNumStr] = monthStr.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthNumStr, 10);
      const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

      const historiesUpToMonth = histories.filter(
        (h) => new Date(h.changed_at) <= endOfMonth
      );

      let price = currentBasePrice;

      if (historiesUpToMonth.length > 0) {
        const latestRecord = historiesUpToMonth[historiesUpToMonth.length - 1];
        price =
          latestRecord.new_base_price !== null
            ? Number(latestRecord.new_base_price)
            : currentBasePrice;
      } else if (histories.length > 0) {
        const earliestRecord = histories[0];
        price =
          earliestRecord.old_base_price !== null
            ? Number(earliestRecord.old_base_price)
            : currentBasePrice;
      }

      chartData.push({ month: monthStr, price });
    }

    return chartData;
  },
};
