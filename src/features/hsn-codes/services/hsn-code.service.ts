import crypto from "crypto";
import { ApiError } from "@/lib/api/api-error";
import { hsnCodeRepository } from "../repositories/hsn-code.repository";
import { gstRateRepository } from "@/features/gst-rates/repositories/gst-rate.repository";
import { userRepository } from "@/features/users/repositories/user.repository";
import type { Prisma } from "@/generated/prisma";
import type {
  AdminHsnCodeResponse,
  GetAdminHsnCodesParams,
} from "../types";
import type {
  CreateAdminHsnCodeInput,
  UpdateAdminHsnCodeInput,
} from "../validations/admin-hsn-code.schema";

function formatAdminHsnCodeResponse(hsn: {
  id: bigint;
  uuid: string | null;
  code: string;
  description: string | null;
  gst_rate_id: bigint | null;
  status: boolean | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  product_gst_rates?: {
    id: bigint;
    uuid: string | null;
    name: string;
    is_active: boolean;
  } | null;
}): AdminHsnCodeResponse {
  const hsnUuid = hsn.uuid || String(hsn.id);
  const gstUuid = hsn.product_gst_rates?.uuid ?? null;

  return {
    id: hsnUuid,
    code: hsn.code,
    description: hsn.description ?? null,
    gstRateId: gstUuid,
    status: Boolean(hsn.status),
    isActive: Boolean(hsn.is_active),
    createdAt: hsn.created_at,
    updatedAt: hsn.updated_at,
  };
}

async function getAdminInternalId(email?: string): Promise<bigint | null> {
  if (!email) return null;
  const user = await userRepository.findByEmail(email);
  if (!user) return null;
  return BigInt(user.internalId || user.id);
}

export const hsnCodeService = {
  async createAdminHsnCode(
    data: CreateAdminHsnCodeInput,
    adminEmail?: string
  ): Promise<AdminHsnCodeResponse> {
    const adminId = await getAdminInternalId(adminEmail);

    // 1. Resolve & Validate GST Rate by UUID
    const gstRate = await gstRateRepository.findByUuid(data.gstRateId);
    if (!gstRate || !gstRate.is_active) {
      throw ApiError.badRequest("Invalid or inactive GST rate");
    }

    // 2. Check duplicate HSN code
    const existingCode = await hsnCodeRepository.findByCode(data.code);
    if (existingCode) {
      throw ApiError.conflict(`An active HSN code '${data.code}' already exists`);
    }

    const created = await hsnCodeRepository.create({
      uuid: crypto.randomUUID(),
      code: data.code,
      description: data.description ?? null,
      gst_rate_id: gstRate.id,
      status: true, // Reserved static field - set to true
      is_active: true, // Active status
      created_by: adminId,
      updated_by: adminId,
    });

    return formatAdminHsnCodeResponse(created);
  },

  async getAdminHsnCodes(params: GetAdminHsnCodesParams = {}) {
    const result = await hsnCodeRepository.findAdminAll(params);
    return {
      data: result.data.map((item) => formatAdminHsnCodeResponse(item)),
      meta: result.meta,
    };
  },

  async getAdminHsnCodeByUuid(uuid: string): Promise<AdminHsnCodeResponse> {
    const hsn = await hsnCodeRepository.findByUuid(uuid);
    if (!hsn) {
      throw ApiError.notFound("HSN code not found");
    }
    return formatAdminHsnCodeResponse(hsn);
  },

  async updateAdminHsnCode(
    uuid: string,
    data: UpdateAdminHsnCodeInput,
    adminEmail?: string
  ): Promise<AdminHsnCodeResponse> {
    const existing = await hsnCodeRepository.findByUuid(uuid);
    if (!existing) {
      throw ApiError.notFound("HSN code not found");
    }

    const adminId = await getAdminInternalId(adminEmail);
    const updateData: Prisma.product_hsn_codesUncheckedUpdateInput = {};

    if (adminId) {
      updateData.updated_by = adminId;
    }

    // Check duplicate code if code changes
    if (data.code !== undefined && data.code !== existing.code) {
      const codeConflict = await hsnCodeRepository.findByCode(data.code, uuid);
      if (codeConflict) {
        throw ApiError.conflict(`An active HSN code '${data.code}' already exists`);
      }
      updateData.code = data.code;
    }

    // Resolve & Validate GST Rate if updated
    if (data.gstRateId !== undefined) {
      const gstRate = await gstRateRepository.findByUuid(data.gstRateId);
      if (!gstRate || !gstRate.is_active) {
        throw ApiError.badRequest("Invalid or inactive GST rate");
      }
      updateData.gst_rate_id = gstRate.id;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    const updated = await hsnCodeRepository.updateByUuid(uuid, updateData);
    if (!updated) {
      throw ApiError.notFound("HSN code not found");
    }

    return formatAdminHsnCodeResponse(updated);
  },

  async deleteAdminHsnCode(uuid: string, adminEmail?: string) {
    const existing = await hsnCodeRepository.findByUuid(uuid);
    if (!existing) {
      throw ApiError.notFound("HSN code not found");
    }

    const adminId = await getAdminInternalId(adminEmail);
    await hsnCodeRepository.softDeleteByUuid(uuid, adminId);

    return {
      success: true,
      message: "HSN code deleted successfully",
    };
  },
};
