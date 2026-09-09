import { z } from "zod";

export const createBannerPositionSchema = z
  .object({
    name: z
      .string({ message: "Name is required" })
      .trim()
      .min(1, "Name is required")
      .max(100, "Name cannot exceed 100 characters"),
    slug: z
      .string({ message: "Slug is required" })
      .trim()
      .min(1, "Slug is required")
      .max(120, "Slug cannot exceed 120 characters"),
    page: z
      .string()
      .trim()
      .max(100, "Page cannot exceed 100 characters")
      .nullable()
      .optional(),
    isActive: z.boolean().default(true),
  })
  .strict();

export type CreateBannerPositionInput = z.infer<
  typeof createBannerPositionSchema
>;

export const updateBannerPositionSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name cannot be empty")
      .max(100, "Name cannot exceed 100 characters")
      .optional(),
    slug: z
      .string()
      .trim()
      .min(1, "Slug cannot be empty")
      .max(120, "Slug cannot exceed 120 characters")
      .optional(),
    page: z
      .string()
      .trim()
      .max(100, "Page cannot exceed 100 characters")
      .nullable()
      .optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export type UpdateBannerPositionInput = z.infer<
  typeof updateBannerPositionSchema
>;

export const bannerPositionListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    pageName: z.string().trim().optional(),
    isActive: z
      .preprocess((val) => {
        if (val === "true" || val === true) return true;
        if (val === "false" || val === false) return false;
        return undefined;
      }, z.boolean().optional())
      .optional(),
    sortBy: z
      .enum(["createdAt", "name", "slug", "page", "updatedAt"])
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export type BannerPositionListQueryInput = z.infer<
  typeof bannerPositionListQuerySchema
>;

export const bannerPositionUuidParamSchema = z
  .object({
    uuid: z.string().uuid("Invalid banner position UUID"),
  })
  .strict();
