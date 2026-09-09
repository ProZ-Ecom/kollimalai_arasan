import { z } from "zod";

const indiaPhoneSchema = z
  .string()
  .trim()
  .transform((val) => {
    if (/^[6-9]\d{9}$/.test(val)) {
      return `+91${val}`;
    }
    return val;
  })
  .refine((val) => /^\+91[6-9]\d{9}$/.test(val), {
    message: "WhatsApp number must be a valid 10-digit Indian number starting with +91 (e.g. +919876543810)",
  });

export const updateCustomerProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name cannot be empty")
      .max(255, "Name cannot exceed 255 characters")
      .optional(),
    dob: z
      .string()
      .trim()
      .refine(
        (val) => {
          if (!val) return true;
          const date = new Date(val);
          if (isNaN(date.getTime())) return false;
          // Zero out time for fair date comparison
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          return date <= today;
        },
        { message: "Date of birth cannot be a future date" }
      )
      .optional()
      .nullable(),
    gender: z.enum(["male", "female", "other"]).optional().nullable(),
    isWhatsapp: z.boolean().optional(),
    whatsappNo: z
      .union([indiaPhoneSchema, z.literal(""), z.null()])
      .optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.isWhatsapp === true) {
      if (!data.whatsappNo || (typeof data.whatsappNo === "string" && data.whatsappNo.trim() === "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "WhatsApp number is required when WhatsApp is enabled",
          path: ["whatsappNo"],
        });
      }
    }
  });

export type UpdateCustomerProfileInput = z.infer<typeof updateCustomerProfileSchema>;
