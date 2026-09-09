import crypto from "crypto";
import { ApiError } from "@/lib/api/api-error";
import { gstRateRepository } from "../repositories/gst-rate.repository";
import { userRepository } from "@/features/users/repositories/user.repository";
import type { Prisma } from "@/generated/prisma";
import type {
  AdminGstRateResponse,
  GetAdminGstRatesParams,
} from "../types";
import type {
  CreateAdminGstRateInput,
  UpdateAdminGstRateInput,
} from "../validations/admin-gst-rate.schema";

function formatAdminGstRateResponse(gstRate: {
  id: bigint;
  uuid: string | null;
  name: string;
  cgst_percent: Prisma.Decimal | number;
  sgst_percent: Prisma.Decimal | number;
  igst_percent: Prisma.Decimal | number;
  status: boolean | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}): AdminGstRateResponse {
  const gstUuid = gstRate.uuid || String(gstRate.id);
  return {
    id: gstUuid,
    name: gstRate.name,
    cgstPercent: Number(gstRate.cgst_percent),
    sgstPercent: Number(gstRate.sgst_percent),
    igstPercent: Number(gstRate.igst_percent),
    status: Boolean(gstRate.status),
    isActive: Boolean(gstRate.is_active),
    createdAt: gstRate.created_at,
    updatedAt: gstRate.updated_at,
  };
}

async function getAdminInternalId(email?: string): Promise<bigint | null> {
  if (!email) return null;
  const user = await userRepository.findByEmail(email);
  if (!user) return null;
  return BigInt(user.internalId || user.id);
}

export const gstRateService = {
  async createAdminGstRate(
    data: CreateAdminGstRateInput,
    adminEmail?: string
  ): Promise<AdminGstRateResponse> {
    const adminId = await getAdminInternalId(adminEmail);

    // Check duplicate name
    const existingName = await gstRateRepository.findByName(data.name);
    if (existingName) {
      throw ApiError.conflict(`A GST rate with name '${data.name}' already exists`);
    }

    const created = await gstRateRepository.create({
      uuid: crypto.randomUUID(),
      name: data.name,
      cgst_percent: data.cgstPercent,
      sgst_percent: data.sgstPercent,
      igst_percent: data.igstPercent,
      status: true, // Reserved static field - set to true
      is_active: true, // Active status
      created_by: adminId,
      updated_by: adminId,
    });

    return formatAdminGstRateResponse(created);
  },

  async getAdminGstRates(params: GetAdminGstRatesParams = {}) {
    const result = await gstRateRepository.findAdminAll(params);
    return {
      data: result.data.map((item) => formatAdminGstRateResponse(item)),
      meta: result.meta,
    };
  },

  async getAdminGstRateByUuid(uuid: string): Promise<AdminGstRateResponse> {
    const gstRate = await gstRateRepository.findByUuid(uuid);
    if (!gstRate) {
      throw ApiError.notFound("GST rate not found");
    }
    return formatAdminGstRateResponse(gstRate);
  },

  async updateAdminGstRate(
    uuid: string,
    data: UpdateAdminGstRateInput,
    adminEmail?: string
  ): Promise<AdminGstRateResponse> {
    const existing = await gstRateRepository.findByUuid(uuid);
    if (!existing) {
      throw ApiError.notFound("GST rate not found");
    }

    const adminId = await getAdminInternalId(adminEmail);
    const updateData: Prisma.product_gst_ratesUncheckedUpdateInput = {};

    if (adminId) {
      updateData.updated_by = adminId;
    }

    // Check duplicate name if name changes
    if (data.name !== undefined && data.name !== existing.name) {
      const nameConflict = await gstRateRepository.findByName(data.name, uuid);
      if (nameConflict) {
        throw ApiError.conflict(`A GST rate with name '${data.name}' already exists`);
      }
      updateData.name = data.name;
    }

    if (data.cgstPercent !== undefined) {
      updateData.cgst_percent = data.cgstPercent;
    }

    if (data.sgstPercent !== undefined) {
      updateData.sgst_percent = data.sgstPercent;
    }

    if (data.igstPercent !== undefined) {
      updateData.igst_percent = data.igstPercent;
    }

    const updated = await gstRateRepository.updateByUuid(uuid, updateData);
    if (!updated) {
      throw ApiError.notFound("GST rate not found");
    }

    return formatAdminGstRateResponse(updated);
  },

  async deleteAdminGstRate(uuid: string, adminEmail?: string) {
    const existing = await gstRateRepository.findByUuid(uuid);
    if (!existing) {
      throw ApiError.notFound("GST rate not found");
    }

    const adminId = await getAdminInternalId(adminEmail);
    await gstRateRepository.softDeleteByUuid(uuid, adminId);

    return {
      success: true,
      message: "GST rate deleted successfully",
    };
  },
};
