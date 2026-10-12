import { z } from "zod";

export const createAddressSchema = z.object({
  firstName: z.string().trim().min(1, "First Name is required").max(255),
  lastName: z.string().trim().max(255).optional(),
  phone: z
    .string()
    .trim()
    .min(1, "Phone Number is required")
    .refine((val) => /^[6-9]\d{9}$/.test(val.replace(/\D/g, "")), {
      message: "Phone number must be a valid 10-digit mobile number",
    }),
  addressLine1: z.string().trim().min(1, "Address Line 1 is required").max(500),
  addressLine2: z.string().trim().max(500).optional(),
  city: z.string().trim().min(1, "City is required").max(255),
  state: z.string().trim().min(1, "State is required").max(255),
  postalCode: z
    .string()
    .trim()
    .min(1, "PIN Code is required")
    .refine((val) => /^\d{6}$/.test(val.replace(/\D/g, "")), {
      message: "PIN code must be a valid 6-digit Indian postal code",
    }),
  country: z.string().max(255).optional(),
  isDefault: z.boolean().optional(),
});

export type CreateAddressSchemaInput = z.infer<typeof createAddressSchema>;

export const updateAddressSchema = createAddressSchema.partial();

export type UpdateAddressSchemaInput = z.infer<typeof updateAddressSchema>;
