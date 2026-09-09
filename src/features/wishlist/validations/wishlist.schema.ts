import { z } from "zod";

export const addWishlistSchema = z
  .object({
    variantUnitPriceId: z
      .string()
      .uuid("Invalid variant unit price UUID")
      .optional(),
    variantId: z
      .string()
      .uuid("Invalid variant UUID")
      .optional(),
  })
  .refine(
    (data) => Boolean(data.variantUnitPriceId || data.variantId),
    {
      message: "Either variantUnitPriceId or variantId must be provided",
      path: ["variantUnitPriceId"],
    }
  );

export type AddWishlistInput = z.infer<typeof addWishlistSchema>;

