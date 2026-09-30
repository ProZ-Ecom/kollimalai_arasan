import type { VariantMeasurement } from "@/features/variants/utils/measurement.util";
import type { OfferBreakdown } from "@/features/offers/types";

export type { VariantMeasurement };

export interface CartItemResponse {
  id: string; // Public Cart Item UUID
  productId: string; // Public Product UUID
  variantId: string; // Public Variant UUID (item-level)
  variantUnitPriceId: string; // Public Variant Unit Price UUID (pack size)
  productName: string;
  variantName: string;
  measurement: VariantMeasurement;
  primaryImage: string | null;
  quantity: number;
  availableStock?: number;
  /** Alias of `currentPrice`, kept for callers that read `price`. */
  price?: number;
  /** Catalog price captured when the item was added to the cart. */
  priceAtAdd: number;
  /** Today's catalog price per unit, before any offer. */
  basePrice: number;
  /** What one unit actually costs after the best applicable offer. */
  currentPrice: number;
  /** True when the catalog price moved since the item was added. */
  priceChanged: boolean;
  /** Money the offer takes off this line, across all its units. */
  discountAmount: number;
  /** The offer that won for this line, or null when none applies. */
  offer: OfferBreakdown | null;
  /** Free units earned by a Buy X Get Y offer. */
  freeQuantity: number;
  /** Line total at the catalog price, before the offer. */
  originalItemTotal: number;
  /** Line total the customer pays, after the offer. */
  itemTotal: number;
}

export interface CartResponse {
  id: string | null; // Public Cart UUID
  items: CartItemResponse[];
  /** Sum of the lines at catalog prices, before offers. */
  subtotal: number;
  /** Total offer discount across the cart. */
  totalDiscount: number;
  /** Same figure, named for the "you saved" line in the UI. */
  totalSavings: number;
  /** Subtotal minus the discount; delivery and tax are added at checkout. */
  total: number;
  totalItems: number;
}

export type CartWithItems = CartResponse;

export interface CartCountResponse {
  count: number;
  totalQuantity: number;
}

export interface CartSummary {
  subtotal: number;
  discount: number;
  tax: number;
  shippingCharge: number;
  grandTotal: number;
  totalItems: number;
}

export interface AddToCartInput {
  variantId?: string;
  variantUnitPriceId?: string;
  productId?: number | string;
  quantity?: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}

