import { z } from "zod";

export const createVariantUnitPriceSchema = z
  .object({
    unitId: z
      .string({ message: "Unit ID is required" })
      .uuid("Invalid Unit UUID format"),
    unitValue: z
      .number({ message: "Unit value is required" })
      .gt(0, "Unit value must be greater than 0"),
    sku: z
      .string({ message: "SKU is required" })
      .trim()
      .min(1, "SKU cannot be empty")
      .max(100, "SKU cannot exceed 100 characters"),
    basePrice: z
      .number({ message: "Base price is required" })
      .min(0, "Base price cannot be negative"),
    stock: z
      .number()
      .int("Stock must be an integer")
      .min(0, "Stock cannot be negative")
      .optional(),
    isDefault: z.boolean().optional().default(false),
    isActive: z.boolean().optional().default(true),
  })
  .strict();

export type CreateVariantUnitPriceInput = z.infer<typeof createVariantUnitPriceSchema>;

export const updateVariantUnitPriceSchema = z
  .object({
    unitId: z.string().uuid("Invalid Unit UUID format").optional(),
    unitValue: z.number().gt(0, "Unit value must be greater than 0").optional(),
    sku: z
      .string()
      .trim()
      .min(1, "SKU cannot be empty")
      .max(100, "SKU cannot exceed 100 characters")
      .optional(),
    basePrice: z.number().min(0, "Base price cannot be negative").optional(),
    stock: z
      .number()
      .int("Stock must be an integer")
      .min(0, "Stock cannot be negative")
      .optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export type UpdateVariantUnitPriceInput = z.infer<typeof updateVariantUnitPriceSchema>;

export const bulkEditUnitPriceItemSchema = z
  .object({
    id: z
      .string({ message: "Variant unit price id is required" })
      .trim()
      .uuid("Invalid Variant Unit Price UUID format"),
    price: z.number().min(0, "Price cannot be negative").optional(),
    basePrice: z.number().min(0, "Base price cannot be negative").optional(),
    stock: z
      .number()
      .int("Stock must be an integer")
      .min(0, "Stock cannot be negative")
      .optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const bulkEditUnitPricesSchema = z
  .object({
    unitPrices: z
      .array(bulkEditUnitPriceItemSchema)
      .min(1, "At least one unit price must be provided for bulk edit"),
  })
  .strict();

export type BulkEditUnitPriceItemInput = z.infer<typeof bulkEditUnitPriceItemSchema>;
export type BulkEditUnitPricesInput = z.infer<typeof bulkEditUnitPricesSchema>;
