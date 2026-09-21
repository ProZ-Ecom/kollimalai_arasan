"use client";

import * as React from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { ProductImage } from "@/components/common/ProductImage";
import { Select } from "@/components/ui/select";
import type { StorefrontProduct } from "@/constants/storefront";

export interface LowestPriceCardProps {
  product: StorefrontProduct;
  isWishlisted?: boolean;
  onWishlistToggle?: (unitPriceId?: string) => void;
  onAddToCart?: (unitPriceId?: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Carousel card for the "Lowest Price Ever" rail - a compare-price + dropdown
 * pack selector, distinct from SnackCard's pill-based selector.
 */
export function LowestPriceCard({
  product,
  isWishlisted = false,
  onWishlistToggle,
  onAddToCart,
  disabled = false,
  className = "",
}: LowestPriceCardProps) {
  const unitPrices = product.unitPrices ?? [];
  const defaultUnitPriceId =
    unitPrices.find((u) => u.isDefault)?.id ?? unitPrices[0]?.id ?? "";

  const [selectedUnitPriceId, setSelectedUnitPriceId] = React.useState(defaultUnitPriceId);
  const [trackedProductId, setTrackedProductId] = React.useState(product.id);
  if (product.id !== trackedProductId) {
    setTrackedProductId(product.id);
    setSelectedUnitPriceId(defaultUnitPriceId);
  }

  const selectedUnitPrice =
    unitPrices.find((u) => u.id === selectedUnitPriceId) ?? unitPrices[0] ?? null;

  const hasDiscount = selectedUnitPrice
    ? selectedUnitPrice.sellingPrice < selectedUnitPrice.basePrice
    : false;
  const discountPercent =
    hasDiscount && selectedUnitPrice && selectedUnitPrice.basePrice > 0
      ? Math.round(
          ((selectedUnitPrice.basePrice - selectedUnitPrice.sellingPrice) /
            selectedUnitPrice.basePrice) *
            100
        )
      : 0;

  return (
    <div
      className={`group shrink-0 w-[220px] sm:w-[250px] bg-[var(--theme-surface)] rounded-xl border border-theme-border p-3 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-secondary-500/40 ${className}`}
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[var(--cream-100)]">
        <Link href={`/products/${product.productId}`} className="block w-full h-full">
          <ProductImage
            src={product.image}
            alt={product.name}
            fallbackText={product.name}
            containerClassName="w-full h-full aspect-square"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {discountPercent > 0 && (
          <div className="absolute top-2.5 left-2.5 z-10 bg-[var(--danger-base)] text-white font-extrabold text-[11px] px-2 py-0.5 uppercase tracking-wider rounded-[2px] shadow-xs pointer-events-none">
            {discountPercent}% OFF
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onWishlistToggle?.(selectedUnitPrice?.id);
          }}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-2.5 right-2.5 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs shadow-xs flex items-center justify-center text-[var(--neutral-600)] hover:bg-white hover:text-[var(--danger-base)] hover:scale-105 transition-all cursor-pointer active:scale-90"
        >
          <Heart
            className={`w-5 h-5 transition-colors duration-200 ${
              isWishlisted
                ? "text-[var(--danger-base)] fill-[var(--danger-base)]"
                : "text-[var(--neutral-500)] stroke-[2]"
            }`}
          />
        </button>
      </div>

      {/* Name */}
      <Link href={`/products/${product.productId}`} className="block mt-3">
        <h3 className="font-bold text-sm text-secondary-500 leading-tight line-clamp-2 hover:text-secondary-600 transition-colors">
          {product.name}
        </h3>
      </Link>

      {/* Price row */}
      <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
        {selectedUnitPrice ? (
          <>
            {hasDiscount && (
              <span className="text-xs text-[var(--neutral-400)] line-through">
                {formatPrice(selectedUnitPrice.basePrice)}
              </span>
            )}
            <span className="text-sm font-bold text-[var(--theme-primary)]">
              from {formatPrice(selectedUnitPrice.sellingPrice)}
            </span>
          </>
        ) : (
          <span className="text-xs text-gray-400 italic">Coming soon</span>
        )}
      </div>
      <p className="text-[11px] text-theme-text-muted">(Tax included)</p>

      {/* Pack size dropdown */}
      {unitPrices.length > 0 && (
        <div className="mt-2.5 relative">
          <Select
            options={unitPrices.map((up) => ({
              value: up.id,
              label: `${up.label} = ${formatPrice(up.sellingPrice)}`,
            }))}
            value={selectedUnitPriceId}
            onValueChange={(val) => setSelectedUnitPriceId(val)}
            size="sm"
            dropdownPosition="top"
            aria-label="Select pack size"
            className="h-9 rounded-md border-theme-border bg-[var(--cream-50)] px-2.5 text-xs font-medium text-[var(--neutral-900)] hover:border-secondary-500/50"
          />
        </div>
      )}

      {/* Add to cart */}
      <button
        type="button"
        disabled={disabled || !selectedUnitPrice || product.outOfStock}
        onClick={() => onAddToCart?.(selectedUnitPrice?.id)}
        className="mt-3 w-full bg-theme-primary hover:bg-theme-primary-hover text-white font-bold text-xs tracking-wider uppercase py-2.5 px-4 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {product.outOfStock ? "Out of Stock" : "Add to Cart"}
      </button>
    </div>
  );
}

export default LowestPriceCard;
