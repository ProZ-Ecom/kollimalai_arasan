import { z } from "zod";

export const refundDetailsSchema = z
  .object({
    method: z.enum(["upi", "bank_transfer"]),
    upiId: z.string().trim().max(100).optional(),
    accountHolderName: z.string().trim().max(150).optional(),
    bankName: z.string().trim().max(150).optional(),
    accountNumber: z.string().trim().max(30).optional(),
    confirmAccountNumber: z.string().trim().max(30).optional(),
    ifscCode: z.string().trim().max(15).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.method === "upi") {
      if (!data.upiId || !/^[\w.-]+@[\w.-]+$/.test(data.upiId.trim())) {
        ctx.addIssue({
          code: "custom",
          path: ["upiId"],
          message: "Please enter a valid UPI ID (e.g. name@okaxis or 9876543210@paytm)",
        });
      }
    } else if (data.method === "bank_transfer") {
      if (!data.accountHolderName || data.accountHolderName.trim().length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["accountHolderName"],
          message: "Account holder name is required (min 2 characters)",
        });
      }
      if (!data.accountNumber || !/^\d{9,18}$/.test(data.accountNumber.trim())) {
        ctx.addIssue({
          code: "custom",
          path: ["accountNumber"],
          message: "Bank account number must be between 9 and 18 digits",
        });
      }
      if (data.confirmAccountNumber && data.accountNumber !== data.confirmAccountNumber) {
        ctx.addIssue({
          code: "custom",
          path: ["confirmAccountNumber"],
          message: "Account numbers do not match",
        });
      }
      if (!data.ifscCode || !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(data.ifscCode.trim())) {
        ctx.addIssue({
          code: "custom",
          path: ["ifscCode"],
          message: "Please enter a valid 11-digit IFSC code (e.g. SBIN0001234)",
        });
      }
    }
  });

export type RefundDetailsInput = z.infer<typeof refundDetailsSchema>;

export const createReturnItemSchema = z
  .object({
    orderItemId: z.string().min(1, "Invalid order item ID"),
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
    orderId: z.string().min(1, "Invalid order ID"),
    reason: z
      .string()
      .trim()
      .min(1, "Reason is required")
      .max(255, "Reason cannot exceed 255 characters"),
    description: z.string().trim().max(1000).optional(),
    videoUrl: z.string()
      .trim()
      .min(1, "Product-condition video is mandatory")
      .max(500, "Video URL cannot exceed 500 characters"),
    refundDetails: refundDetailsSchema.optional(),
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

export const customerReturnRequestSchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(1, "Reason is required")
      .max(255, "Reason cannot exceed 255 characters"),
    description: z.string().trim().max(1000).optional(),
    videoUrl: z.string()
      .trim()
      .min(1, "Product-condition video is mandatory")
      .max(500, "Video URL cannot exceed 500 characters"),
    refundDetails: refundDetailsSchema.optional(),
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

export type CustomerReturnRequestInput = z.infer<
  typeof customerReturnRequestSchema
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
      .enum(["requested", "approved", "rejected", "picked_up", "delivered", "refunded"])
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
      .enum(["requested", "approved", "rejected", "picked_up", "delivered", "refunded"])
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

export const adminReviewReturnSchema = z
  .object({
    decision: z.enum(["passed", "failed"]),
    notes: z.string()
      .trim()
      .min(3, "Review notes must be at least 3 characters")
      .max(1000, "Review notes cannot exceed 1000 characters"),
  })
  .strict();

export type AdminReviewReturnInput = z.infer<typeof adminReviewReturnSchema>;

export const adminProcessReturnRefundSchema = z
  .object({
    amount: z.number().positive("Refund amount must be greater than 0").optional(),
    paymentMode: z.string().trim().min(1, "Payment mode is required").optional(),
    referenceId: z.string().trim().max(100).optional(),
    restockInventory: z.boolean().default(true),
    note: z.string().trim().max(500).optional(),
  })
  .strict();

export type AdminProcessReturnRefundInput = z.infer<
  typeof adminProcessReturnRefundSchema
>;
