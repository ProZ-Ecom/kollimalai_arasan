import { z } from "zod";

export const createReturnItemSchema = z
  .object({
    orderItemId: z.string().uuid("Invalid order item UUID"),
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
    reason: z
      .string()
      .trim()
      .max(255, "Item reason cannot exceed 255 characters")
      .optional(),
  })
  .strict();

export type CreateReturnItemInput = z.infer<typeof createReturnItemSchema>;

export const createReturnRequestSchema = z
  .object({
    orderId: z.string().uuid("Invalid order UUID"),
    reason: z
      .string()
      .trim()
      .min(1, "Reason is required")
      .max(255, "Reason cannot exceed 255 characters"),
    items: z
      .array(createReturnItemSchema)
      .min(1, "At least one item is required for return")
      .refine(
        (items) => {
          const ids = new Set(items.map((i) => i.orderItemId));
          return ids.size === items.length;
        },
        {
          message: "Duplicate order items are not allowed in the same return request",
        }
      ),
  })
  .strict();

export type CreateReturnRequestInput = z.infer<
  typeof createReturnRequestSchema
>;

export const customerReturnListSchema = z
  .object({
    page: z.number().int().min(1, "page must be at least 1").default(1),
    limit: z
      .number()
      .int()
      .min(1, "limit must be at least 1")
      .max(100, "limit cannot exceed 100")
      .default(10),
    search: z.string().trim().optional(),
    status: z
      .enum(["requested", "approved", "rejected", "picked_up", "refunded"])
      .optional(),
    sortBy: z
      .enum(["createdAt", "updatedAt", "requestedAt", "approvedAt"])
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export type CustomerReturnListInput = z.infer<
  typeof customerReturnListSchema
>;

export const adminReturnListSchema = z
  .object({
    page: z.number().int().min(1, "page must be at least 1").default(1),
    limit: z
      .number()
      .int()
      .min(1, "limit must be at least 1")
      .max(100, "limit cannot exceed 100")
      .default(10),
    search: z.string().trim().optional(),
    status: z
      .enum(["requested", "approved", "rejected", "picked_up", "refunded"])
      .optional(),
    sortBy: z
      .enum(["createdAt", "updatedAt", "requestedAt", "approvedAt"])
      .default("requestedAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export type AdminReturnListInput = z.infer<typeof adminReturnListSchema>;

export const returnUuidParamSchema = z.object({
  uuid: z.string().uuid("Invalid return UUID format"),
});

export type ReturnUuidParamInput = z.infer<typeof returnUuidParamSchema>;

export const rejectReturnSchema = z
  .object({
    note: z
      .string()
      .trim()
      .max(255, "Note cannot exceed 255 characters")
      .optional(),
  })
  .strict();

export type RejectReturnInput = z.infer<typeof rejectReturnSchema>;
