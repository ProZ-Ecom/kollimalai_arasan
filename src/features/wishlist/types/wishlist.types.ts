import type { VariantMeasurement } from "@/features/variants/utils/measurement.util";

export interface CustomerWishlistProductSummary {
  id: string; // product.uuid
  name: string;
  slug: string;
}

export interface CustomerWishlistItemDto {
  id: string; // wishlistItem.uuid
  variantId: string; // variant.uuid (item-level)
  variantUnitPriceId: string; // variant_unit_price.uuid (pack size)
  variantName: string;
  sku: string;
  price: number;
  basePrice: number;
  salePrice: number | null;
  measurement: VariantMeasurement;
  primaryImage: string | null;
  isAvailable: boolean;
  product: CustomerWishlistProductSummary;
  createdAt: Date;
}

export interface CustomerWishlistResponse {
  items: CustomerWishlistItemDto[];
  totalItems: number;
}
