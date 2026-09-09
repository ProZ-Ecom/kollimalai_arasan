import { z } from "zod";

export const getProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  sort: z.string().optional(),
  isFeatured: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
});

export type GetProductsQueryInput = z.infer<typeof getProductsQuerySchema>;

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255),
  slug: z.string().min(1, "Product code is required").max(255),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  categoryId: z.number().int().positive("Category is required"),
  brandId: z.number().int().positive().nullable().optional(),
  sku: z.string().min(1, "SKU is required").max(100),
  price: z.number().positive("Price must be positive"),
  comparePrice: z.number().positive().nullable().optional(),
  costPrice: z.number().positive().nullable().optional(),
  taxRate: z.number().min(0).max(100).default(0),
  discountPercent: z.number().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isDigital: z.boolean().default(false),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(1000).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
