"use client";

import * as React from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { ProductImage } from "@/components/common/ProductImage";
import type { StorefrontProduct } from "@/constants/storefront";

export interface SnackCardVariant {
  id: string;
  label: string; // e.g. "50g", "100g"
  /** Stock-keeping code, shown by the "stacked" layout. */
  sku?: string | null;
  price: number; // Selling price e.g. 45
  comparePrice?: number | null; // Original price before discount e.g. 50
  inStock?: boolean;
}

export interface SnackCardProps {
  /** Optional ID or UUID of the product */
  id?: string;
  /** Title / Name of the snack (e.g. "THENKUZHAL MURUKKU") */
  name?: string;
  /** Subtitle (e.g. Product or Category name) */
  subtitle?: string;
  /** Image URL (relative or absolute) */
  image?: string | null;
  /** Optional link href (defaults to `/products/${id}`) */
  href?: string;
  /** Explicit discount percentage (e.g. 10 for "10% OFF") */
  discountPercent?: number | null;
  /** Explicit badge text to display (e.g. "BUY 3 GET 1 FREE", "10% OFF", "SPECIAL OFFER") */
  badgeText?: string | null;
  /** List of pack size variants (e.g. 50g, 100g) */
  variants?: SnackCardVariant[];
  /** Currently selected variant ID (uncontrolled if omitted) */
  selectedVariantId?: string;
  /** Callback when user clicks a variant pill */
  onVariantChange?: (variantId: string) => void;
  /** Whether the item is wishlisted */
  isWishlisted?: boolean;
  /** Callback when user clicks the heart icon */
  onWishlistToggle?: (variantId?: string) => void;
  /** Callback when user clicks "ADD TO CART" */
  onAddToCart?: (variantId?: string) => void;
  /** Loading state for add to cart */
  isLoading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional container classes */
  className?: string;
  /** Optionally pass a StorefrontProduct object directly */
  product?: StorefrontProduct;
  /** Fallback price if no variants are provided */
  fallbackPrice?: number;
  /** Optional preformatted price range text (e.g. "₹135.00 – ₹260.00") */
  priceRangeText?: string;
  /**
   * "split"   - title left, variant pills and price right (default).
   * "stacked" - name, SKU and price stacked left with a full-width CTA,
   *             used by the "Freshly Launched" style grids.
   */
  layout?: "split" | "stacked";
}

/**
 * Pack labels normally arrive as a plain string, but some catalog rows carry
 * a `{ value, unit }` object. Rendering that straight into JSX throws, so both
 * shapes are funnelled through here.
 */
function variantLabel(label: SnackCardVariant["label"]): string {
  if (typeof label === "string") return label;
  if (label && typeof label === "object") {
    const parts = label as { value?: string | number; unit?: string };
    return `${parts.value ?? ""} ${parts.unit ?? ""}`.trim() || "Standard";
  }
  return String(label ?? "");
}

/**
 * Parses size / weight labels like "50 g", "100g", "1 kg", "500 gm"
 * into a standardized numeric weight (grams, ml, etc.) to accurately identify the highest size.
 */
function parseSizeWeight(label: unknown): number {
  if (!label) return 0;
  if (typeof label === "object" && label !== null) {
    const parts = label as { value?: string | number; unit?: string };
    const num = parseFloat(String(parts.value ?? "")) || 0;
    const unit = String(parts.unit || "").trim().toLowerCase();
    if (unit === "kg" || unit === "l" || unit === "liter" || unit === "litre") return num * 1000;
    return num;
  }
  const str = String(label).trim().toLowerCase();
  const match = str.match(/^([\d.]+)\s*([a-z]*)/i);
  if (match) {
    const num = parseFloat(match[1]) || 0;
    const unit = (match[2] || "").toLowerCase();
    if (unit === "kg" || unit === "l" || unit === "liter" || unit === "litre") return num * 1000;
    if (unit === "g" || unit === "gm" || unit === "gram" || unit === "grams") return num;
    if (unit === "ml") return num;
    return num;
  }
  return 0;
}

export function SnackCard({
  id,
  name,
  subtitle,
  image,
  href,
  discountPercent: explicitDiscount,
  badgeText,
  variants = [],
  selectedVariantId: controlledSelectedVariantId,
  onVariantChange,
  isWishlisted = false,
  onWishlistToggle,
  onAddToCart,
  isLoading = false,
  disabled = false,
  className = "",
  product,
  fallbackPrice,
  priceRangeText,
  layout = "split",
}: SnackCardProps) {
  // If product prop is supplied, derive fields from it
  const resolvedId = id || product?.productId || product?.id || "";
  const resolvedName = name || product?.name || "Traditional Snack";
  const resolvedImage = image || product?.image || "";
  const resolvedHref = href || (resolvedId ? `/products/${resolvedId}` : "#");

  // Derive variants from StorefrontProduct if variants prop not explicitly given
  const resolvedVariants: SnackCardVariant[] = React.useMemo(() => {
    if (variants.length > 0) return variants;
    if (product?.unitPrices && product.unitPrices.length > 0) {
      return product.unitPrices.map((up) => ({
        id: up.id,
        label: up.label,
        sku: up.sku,
        price: up.sellingPrice,
        comparePrice: up.basePrice > up.sellingPrice ? up.basePrice : null,
        inStock: !product.outOfStock,
      }));
    }
    return [];
  }, [variants, product]);

  // On cards, show only 2 sizes: default size (e.g. 100g) and highest size (e.g. 1kg)
  const displayedVariants: SnackCardVariant[] = React.useMemo(() => {
    if (resolvedVariants.length <= 2) return resolvedVariants;

    const getWeight = (v: SnackCardVariant): number => {
      const parsed = parseSizeWeight(v.label);
      if (parsed > 0) return parsed;
      return v.price || 0;
    };

    // Default variant is the base/first variant in the list
    const defaultVar = resolvedVariants[0];

    // Find highest variant by weight/size
    let highestVar: SnackCardVariant = resolvedVariants[resolvedVariants.length - 1];
    let maxWeight = getWeight(defaultVar);

    for (let i = 1; i < resolvedVariants.length; i++) {
      const v = resolvedVariants[i];
      const w = getWeight(v);
      if (w > maxWeight) {
        maxWeight = w;
        highestVar = v;
      }
    }

    if (highestVar.id === defaultVar.id) {
      return [defaultVar];
    }

    const wDefault = getWeight(defaultVar);
    const wHighest = getWeight(highestVar);

    return wDefault <= wHighest ? [defaultVar, highestVar] : [highestVar, defaultVar];
  }, [resolvedVariants]);

  // Uncontrolled or controlled selected variant
  const defaultVariantId = displayedVariants[0]?.id || resolvedVariants[0]?.id || "";
  const [internalSelectedId, setInternalSelectedId] = React.useState(defaultVariantId);

  React.useEffect(() => {
    if (displayedVariants.length > 0 && !displayedVariants.some((v) => v.id === internalSelectedId)) {
      setInternalSelectedId(displayedVariants[0].id);
    }
  }, [displayedVariants, internalSelectedId]);

  const activeVariantId =
    controlledSelectedVariantId !== undefined
      ? controlledSelectedVariantId
      : internalSelectedId;

  // Selected variant details
  const activeVariant =
    displayedVariants.find((v) => v.id === activeVariantId) ||
    resolvedVariants.find((v) => v.id === activeVariantId) ||
    displayedVariants[0] ||
    resolvedVariants[0] ||
    null;

  const currentPrice = activeVariant ? activeVariant.price : (fallbackPrice ?? 0);
  const originalPrice = activeVariant?.comparePrice ?? null;

  // Calculate discount percentage
  const discount =
    explicitDiscount !== undefined && explicitDiscount !== null
      ? explicitDiscount
      : originalPrice && originalPrice > currentPrice
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : 0;

  const handleSelectVariant = (variantId: string) => {
    if (controlledSelectedVariantId === undefined) {
      setInternalSelectedId(variantId);
    }
    onVariantChange?.(variantId);
  };

  return (
    <div
      className={`group bg-[var(--theme-surface)] flex flex-col justify-between w-full max-w-sm transition-all duration-300 hover:shadow-md ${layout === "stacked"
        ? "rounded-xl border border-theme-border p-3 hover:border-secondary-500/40"
        : "pb-3 hover:border-[var(--secondary-600)]/40"
        } ${className}`}
    >
      {/* 1. Square Product Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-[var(--cream-100)]">
        <Link href={resolvedHref} className="block w-full h-full">
          <ProductImage
            src={resolvedImage}
            alt={resolvedName}
            fallbackText={resolvedName}
            containerClassName="w-full h-full aspect-square"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Discount / Offer Badge (Top-Left) using global danger color */}
        {(badgeText || discount > 0) && (
          <div className="absolute top-2.5 left-2.5 z-10 bg-[var(--danger-base)] text-white font-extrabold text-[11px] sm:text-xs px-2 py-0.5 uppercase tracking-wider rounded-[2px] shadow-xs pointer-events-none">
            {badgeText || `${discount}% OFF`}
          </div>
        )}

        {/* Wishlist Button (Top-Right) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onWishlistToggle?.(activeVariant?.id);
          }}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-2.5 right-2.5 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 backdrop-blur-xs shadow-xs flex items-center justify-center text-[var(--neutral-600)] hover:bg-white hover:text-[var(--danger-base)] hover:scale-105 transition-all cursor-pointer active:scale-90"
        >
          <Heart
            className={`w-5 h-5 transition-colors duration-200 ${isWishlisted
              ? "text-[var(--danger-base)] fill-[var(--danger-base)]"
              : "text-[var(--neutral-500)] stroke-[2]"
              }`}
          />
        </button>
      </div>

      {layout === "stacked" ? (
        <>
          {/* Name, SKU and pack price, stacked left */}
          <div className="mt-3 px-0.5">
            <Link href={resolvedHref} className="block">
              <h3 className="font-bold text-sm text-secondary-500 leading-tight line-clamp-2 hover:text-secondary-600 transition-colors capitalize">
                {resolvedName}
              </h3>
            </Link>

            {activeVariant?.sku ? (
              <p className="mt-1 text-xs text-theme-text-muted">
                SKU: {activeVariant.sku}
              </p>
            ) : null}

            <p className="mt-1 text-xs font-medium text-accent-orange">
              {activeVariant?.label
                ? `${variantLabel(activeVariant.label)} - `
                : ""}
              {priceRangeText ?? formatPrice(currentPrice)}
            </p>
          </div>

          <button
            type="button"
            disabled={
              disabled ||
              isLoading ||
              (activeVariant && activeVariant.inStock === false) ||
              undefined
            }
            onClick={() => onAddToCart?.(activeVariant?.id)}
            className="mt-3 w-full bg-theme-primary hover:bg-theme-primary-hover text-white font-bold text-xs tracking-wider uppercase py-2.5 px-4 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? "Adding..."
              : activeVariant?.inStock === false
                ? "Out of Stock"
                : "ADD TO CART"}
          </button>
        </>
      ) : (
        <>
          {/* 2. Middle Info Row: Title on Left, Variants + Price on Right */}
          <div className="mt-3.5 sm:mt-4 flex items-start justify-between gap-3 px-0.5">
            {/* Left Column: Product/Variant Title using global brown typography */}
            <div className="flex-1 pr-1 min-w-0">
              {subtitle && (
                <p className="text-[11px] sm:text-xs text-neutral-500 font-medium truncate mb-0.5 capitalize">
                  {subtitle}
                </p>
              )}
              <Link href={resolvedHref} className="block">
                <h3 className="font-extrabold text-[var(--neutral-900)] capitalize text-sm sm:text-base md:text-[17px] tracking-tight leading-tight line-clamp-2 text-hover-primary transition-colors">
                  {resolvedName}
                </h3>
              </Link>
            </div>

            {/* Right Column: Variant Selector & Prices */}
            <div className="flex flex-col items-end shrink-0">
              {/* Variant Selector Pills using global brown colors */}
              {displayedVariants.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {displayedVariants.map((v) => {
                    const isSelected = v.id === activeVariant?.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleSelectVariant(v.id)}
                        className={`px-2 sm:px-2.5 py-0.5 text-xs font-bold rounded-[2px] transition-all cursor-pointer select-none ${isSelected
                          ? "bg-[var(--secondary-600)] text-white border border-[var(--secondary-600)]"
                          : "bg-white text-[var(--secondary-600)] border border-[var(--secondary-600)] hover:bg-[var(--cream-50)]"
                          }`}
                      >
                        {variantLabel(v.label)}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Price & Strikethrough Row */}
              <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1.5 justify-end">
                {priceRangeText && resolvedVariants.length === 0 ? (
                  <span className="font-bold text-[var(--neutral-900)] text-sm sm:text-base tracking-tight">
                    {priceRangeText}
                  </span>
                ) : (
                  <>
                    <span className="font-bold text-[var(--neutral-900)] text-sm sm:text-base tracking-tight">
                      {formatPrice(currentPrice)}
                    </span>

                    {originalPrice && originalPrice > currentPrice && (
                      <span className="text-xs sm:text-sm text-[var(--neutral-400)] line-through tracking-tight font-normal">
                        {formatPrice(originalPrice)}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 3. Bottom Action: Bright Golden "ADD TO CART" Button using global .btn-yellow */}
          <div className=" w-full flex justify-end mt-3.5 sm:mt-4">
            <button
              type="button"
              disabled={disabled || isLoading || (activeVariant && activeVariant.inStock === false)}
              onClick={() => onAddToCart?.(activeVariant?.id)}
              className="w-[75%] btn-yellow text-[var(--neutral-900)] hover:scale-[1.01] active:scale-[0.99] font-extrabold text-xs sm:text-sm tracking-wider uppercase py-2.5 sm:py-3 px-4 rounded-sm shadow-xs flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? "Adding..."
                : activeVariant?.inStock === false
                  ? "Out of Stock"
                  : "ADD TO CART"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default SnackCard;
