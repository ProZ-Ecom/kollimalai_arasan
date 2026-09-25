import { z } from "zod";

const indianPhoneRegex = /^[6-9]\d{9}$/;
const numbersOnlyRegex = /^\d+$/;

const indiaPhoneSchema = z
  .string()
  .trim()
  .superRefine((val, ctx) => {
    if (!val || val.length === 0) return;
    let digits = val.replace(/[\s-]/g, "");
    if (digits.startsWith("+91")) {
      digits = digits.slice(3);
    } else if (digits.startsWith("0")) {
      digits = digits.slice(1);
    }

    if (!numbersOnlyRegex.test(digits)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone number must contain numbers only",
      });
      return;
    }
    if (!indianPhoneRegex.test(digits)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter a valid 10-digit phone number starting with 6, 7, 8, or 9",
      });
    }
  })
  .transform((val) => {
    if (!val || val.trim() === "") return null;
    let digits = val.replace(/[\s-]/g, "");
    if (digits.startsWith("+91")) {
      digits = digits.slice(3);
    } else if (digits.startsWith("0")) {
      digits = digits.slice(1);
    }
    if (indianPhoneRegex.test(digits)) {
      return `+91${digits}`;
    }
    return val;
  });

export const updateCustomerProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(255, "Name cannot exceed 255 characters")
      .optional(),
    phone: indiaPhoneSchema.optional().nullable(),
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
    whatsappNo: indiaPhoneSchema.optional().nullable(),
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
