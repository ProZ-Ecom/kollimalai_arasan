import { z } from "zod";

export const getCouponsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type GetCouponsQueryInput = z.infer<typeof getCouponsQuerySchema>;

export const createCouponSchema = z.object({
  code: z.string().min(1, "Code is required").max(50),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().positive("Value must be positive"),
  minOrderAmount: z.number().positive().optional(),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
});

export type CreateCouponSchemaInput = z.infer<typeof createCouponSchema>;

export const updateCouponSchema = createCouponSchema.partial();

export type UpdateCouponSchemaInput = z.infer<typeof updateCouponSchema>;
