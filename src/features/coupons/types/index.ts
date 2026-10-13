export interface CouponListItem {
  id: number;
  code: string;
  type: string;
  value: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt: Date | string | null;
  expiresAt: Date | string | null;
  createdAt: Date | string;
}

export interface GetCouponsParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface GetCouponsResult {
  data: CouponListItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreateCouponInput {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  isActive?: boolean;
  startsAt?: string | Date;
  expiresAt?: string | Date;
}

export interface UpdateCouponInput extends Partial<CreateCouponInput> {}
