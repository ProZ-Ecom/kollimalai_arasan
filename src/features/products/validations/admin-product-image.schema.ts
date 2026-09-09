import { z } from "zod";

export const adminProductImageItemSchema = z
  .object({
    imageUrl: z
      .string({ message: "Image URL is required" })
      .trim()
      .min(1, "Image URL cannot be empty")
      .max(500, "Image URL cannot exceed 500 characters"),
    sortOrder: z
      .number()
      .int("Sort order must be an integer")
      .min(0, "Sort order cannot be negative")
      .max(100, "Sort order cannot exceed 100")
      .default(0),
    isPrimary: z.boolean().default(false),
  })
  .strict();

export type AdminProductImageItemInput = z.infer<
  typeof adminProductImageItemSchema
>;

export const createAdminProductImagesSchema = z
  .array(adminProductImageItemSchema)
  .min(1, "At least 1 product image is required")
  .max(4, "Maximum 4 product images allowed per request")
  .refine(
    (items) => {
      const urls = items.map((i) => i.imageUrl.toLowerCase());
      return new Set(urls).size === urls.length;
    },
    { message: "Duplicate image URLs are not allowed in the same request" }
  )
  .refine(
    (items) => {
      const sortOrders = items.map((i) => i.sortOrder);
      return new Set(sortOrders).size === sortOrders.length;
    },
    { message: "Duplicate sortOrder values are not allowed in the same request" }
  )
  .refine(
    (items) => {
      const primaryCount = items.filter((i) => i.isPrimary === true).length;
      return primaryCount <= 1;
    },
    { message: "Only one image in the request can be marked as primary" }
  );

export type CreateAdminProductImagesInput = z.infer<
  typeof createAdminProductImagesSchema
>;

export const updateAdminProductImageSchema = z
  .object({
    imageUrl: z
      .string()
      .trim()
      .min(1, "Image URL cannot be empty")
      .max(500, "Image URL cannot exceed 500 characters")
      .optional(),
    sortOrder: z
      .number()
      .int("Sort order must be an integer")
      .min(0, "Sort order cannot be negative")
      .max(100, "Sort order cannot exceed 100")
      .optional(),
  })
  .strict();

export type UpdateAdminProductImageInput = z.infer<
  typeof updateAdminProductImageSchema
>;
