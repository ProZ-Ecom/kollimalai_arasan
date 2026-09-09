import { ApiError } from "@/lib/api/api-error";
import { couponRepository } from "../repositories/coupon.repository";
import type { GetCouponsParams, CreateCouponInput, UpdateCouponInput } from "../types";

export const couponService = {
  async getCoupons(params: GetCouponsParams = {}) {
    return couponRepository.findAll(params);
  },

  async getCoupon(id: number) {
    const coupon = await couponRepository.findById(id);
    if (!coupon) {
      throw ApiError.notFound("Coupon not found");
    }
    return coupon;
  },

  async createCoupon(data: CreateCouponInput) {
    const existing = await couponRepository.findByCode(data.code.toUpperCase());
    if (existing) {
      throw ApiError.conflict("A coupon with this code already exists");
    }

    return couponRepository.create({
      code: data.code.toUpperCase(),
      type: data.type,
      value: data.value,
      minOrderAmount: data.minOrderAmount,
      maxDiscount: data.maxDiscount,
      usageLimit: data.usageLimit,
      isActive: data.isActive ?? true,
      startsAt: data.startsAt,
      expiresAt: data.expiresAt,
    });
  },

  async updateCoupon(id: number, data: UpdateCouponInput) {
    const existing = await couponRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("Coupon not found");
    }

    if (data.code && data.code.toUpperCase() !== existing.code) {
      const codeExists = await couponRepository.findByCode(data.code.toUpperCase());
      if (codeExists) {
        throw ApiError.conflict("A coupon with this code already exists");
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.code !== undefined) updateData.code = data.code.toUpperCase();
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.minOrderAmount !== undefined) updateData.minOrderAmount = data.minOrderAmount;
    if (data.maxDiscount !== undefined) updateData.maxDiscount = data.maxDiscount;
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.startsAt !== undefined) updateData.startsAt = data.startsAt;
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt;

    return couponRepository.update(id, updateData as never);
  },

  async deleteCoupon(id: number) {
    const existing = await couponRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("Coupon not found");
    }
    return couponRepository.delete(id);
  },
};
