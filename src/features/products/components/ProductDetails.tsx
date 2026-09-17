"use client";

import { useState, useEffect, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  Sparkles,
  Loader2,
  Star,
  Clock,
  Share2,
  MapPin,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGallery } from "./ProductGallery";
import { ProductVariantSelector } from "./ProductVariantSelector";
import { getImageUrl, cn } from "@/lib/utils";
import { formatMeasurementLabel } from "@/features/variants/utils/measurement.util";
import { useCustomerVariant } from "@/features/customers/hooks/use-customer-catalog";
import { useCustomerCompany } from "@/features/customers/hooks/use-customer-company";
import { useAddToCart } from "@/features/cart/hooks/use-cart";
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from "@/features/wishlist/hooks/use-wishlist";
import { usePublicVariantReviews } from "@/features/reviews/hooks/use-public-reviews";
import { ProductReviewsSection } from "@/features/reviews/components/ProductReviewsSection";
import type { CustomerProductDetailDto, CustomerVariantListItemDto } from "../types";
import { sanitizeRichText } from "@/lib/sanitize-html";

interface ProductDetailsProps {
  product: CustomerProductDetailDto;
}

const SHIPPING_POINTS = [
  "Free shipping on all orders above ₹999",
  "Delivered in 3–5 days, pan-India",
  "Dispatches within 24 hours via Express",
  "Hassle-free replacement guarantee on damaged items",
];

function AccordionSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      className="group border-b border-neutral-100 py-4 first:pt-0 last:border-b-0"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-neutral-900">
        {title}
        <ChevronDown className="h-4 w-4 text-neutral-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3 text-sm text-neutral-600 leading-relaxed">{children}</div>
    </details>
  );
}

function ProductDetails({ product }: ProductDetailsProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const variants = product.variants ?? [];

  // Flatten all pack size options across all variants of the product (e.g. 250g, 500g, 750g...)
  const allPackOptions = useMemo(() => {
    const options: Array<{
      variantId: string;
      unitPriceId: string;
      label: string;
      sellingPrice: number;
      basePrice: number;
      sku: string;
      inStock: boolean;
      isDefault: boolean;
      variant: CustomerVariantListItemDto;
    }> = [];
    const seenUnitPriceIds = new Set<string>();

    for (const v of variants) {
      if (v.unitPrices && v.unitPrices.length > 0) {
        for (const up of v.unitPrices) {
          if (seenUnitPriceIds.has(up.id)) continue;
          seenUnitPriceIds.add(up.id);
          const label =
            formatMeasurementLabel(up.measurement) ||
            v.variantName ||
            "Standard";
          options.push({
            variantId: v.id,
            unitPriceId: up.id,
            label,
            sellingPrice: up.sellingPrice,
            basePrice: up.basePrice,
            sku: up.sku || v.sku || "",
            inStock: !v.outOfStock,
            isDefault: Boolean(up.isDefault || v.isDefault),
            variant: v,
          });
        }
      } else {
        if (seenUnitPriceIds.has(v.id)) continue;
        seenUnitPriceIds.add(v.id);
        options.push({
          variantId: v.id,
          unitPriceId: v.id,
          label: formatMeasurementLabel(v.measurement) || v.variantName || "Standard",
          sellingPrice: v.salePrice || v.basePrice,
          basePrice: v.basePrice,
          sku: v.sku || "",
          inStock: !v.outOfStock,
          isDefault: Boolean(v.isDefault),
          variant: v,
        });
      }
    }

    // Sort options by sellingPrice ascending (e.g. 250g, 500g, 750g...)
    return options.sort((a, b) => a.sellingPrice - b.sellingPrice);
  }, [variants]);

  const defaultOption = useMemo(() => {
    return allPackOptions.find((opt) => opt.isDefault) ?? allPackOptions[0] ?? null;
  }, [allPackOptions]);

  const [selectedUnitPriceId, setSelectedUnitPriceId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const v = sp.get("variant");
      if (v) {
        const matching = allPackOptions.find((opt) => opt.variantId === v);
        if (matching) return matching.unitPriceId;
      }
    }
    return defaultOption?.unitPriceId ?? null;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const v = sp.get("variant");
      if (v) {
        const matching = allPackOptions.find((opt) => opt.variantId === v);
        if (matching && matching.unitPriceId !== selectedUnitPriceId) {
          setSelectedUnitPriceId(matching.unitPriceId);
          return;
        }
      }
    }
    if (!selectedUnitPriceId && defaultOption) {
      setSelectedUnitPriceId(defaultOption.unitPriceId);
    }
  }, [allPackOptions, defaultOption, selectedUnitPriceId]);

  const activeOption = useMemo(() => {
    return (
      allPackOptions.find((opt) => opt.unitPriceId === selectedUnitPriceId) ??
      defaultOption ??
      allPackOptions[0] ??
      null
    );
  }, [allPackOptions, selectedUnitPriceId, defaultOption]);

  const selectedVariant: CustomerVariantListItemDto | null = useMemo(() => {
    if (activeOption) {
      return activeOption.variant;
    }
    return variants[0] ?? null;
  }, [activeOption, variants]);

  const selectedUnitPrice = useMemo(() => {
    if (!selectedVariant || !activeOption) return null;
    return (
      selectedVariant.unitPrices?.find((up) => up.id === activeOption.unitPriceId) ??
      selectedVariant.unitPrices?.[0] ??
      null
    );
  }, [selectedVariant, activeOption]);

  const { data: variantDetail } = useCustomerVariant(product.id, selectedVariant?.id ?? null);
  const { data: company } = useCustomerCompany();

  const [quantity, setQuantity] = useState(1);
  const [shareCopied, setShareCopied] = useState(false);

  const addToCart = useAddToCart();
  const { data: wishlist } = useWishlist({ enabled: !!session });
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const { data: variantReviewsData } = usePublicVariantReviews(selectedVariant?.id);
  const avgRating = variantReviewsData?.ratingSummary?.averageRating ?? 0;
  const totalReviews =
    variantReviewsData?.ratingSummary?.totalReviews ??
    variantReviewsData?.reviews?.length ??
    0;

  const handleSelectPackOption = (option: { variantId: string; unitPriceId: string }) => {
    setSelectedUnitPriceId(option.unitPriceId);
    setQuantity(1);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("variant", option.variantId);
      window.history.replaceState({}, "", url.toString());
    }
  };

  const selectedVariantId = selectedVariant?.id ?? null;

  const handleSelectVariant = (variantId: string) => {
    const matching = allPackOptions.find((opt) => opt.variantId === variantId);
    if (matching) {
      handleSelectPackOption(matching);
    }
  };

  const isInStock = !selectedVariant?.outOfStock;
  const sellingPrice = selectedUnitPrice?.sellingPrice ?? 0;
  const basePrice = selectedUnitPrice?.basePrice ?? 0;
  const hasDiscount = sellingPrice < basePrice;
  const discountPercent =
    hasDiscount && basePrice > 0
      ? Math.round(((basePrice - sellingPrice) / basePrice) * 100)
      : 0;

  const isInWishlist =
    !!selectedUnitPrice &&
    !!wishlist?.items.some((i) => i.variantUnitPriceId === selectedUnitPrice.id);

  const variantImages = variantDetail?.id === selectedVariant?.id ? variantDetail?.images ?? [] : [];

  const galleryImages =
    variantImages.length > 0
      ? [...variantImages]
          .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder)
          .map((img) => ({
            id: img.id,
            url: getImageUrl(img.imageUrl),
            altText: selectedVariant?.variantName || product.name,
          }))
      : selectedVariant?.primaryImage
        ? [
            {
              id: selectedVariant.id,
              url: getImageUrl(selectedVariant.primaryImage),
              altText: selectedVariant.variantName || product.name,
            },
          ]
        : product.image
          ? [{ id: product.id, url: getImageUrl(product.image), altText: product.name }]
          : [];

  const handleAddToCart = () => {
    if (!session) {
      router.push(`/login?callbackUrl=/products/${product.id}`);
      return;
    }
    if (!selectedUnitPrice) return;
    addToCart.mutate({
      variantUnitPriceId: selectedUnitPrice.id,
      variantId: selectedVariant?.id,
      quantity,
    });
  };

  const handleWishlistToggle = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!session) {
      router.push(`/login?callbackUrl=/products/${product.id}`);
      return;
    }
    if (!selectedUnitPrice) return;
    if (addToWishlist.isPending || removeFromWishlist.isPending) return;

    if (isInWishlist) {
      removeFromWishlist.mutate(selectedUnitPrice.id);
    } else {
      addToWishlist.mutate(selectedUnitPrice.id);
    }
  };

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} on Kollimalai Arasan`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled share sheet
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const waDigitsRaw = (company?.phone || "8667380899").replace(/\D/g, "");
  const waNumber = waDigitsRaw.length === 10 ? `91${waDigitsRaw}` : waDigitsRaw;
  const waDisplay = `+${waNumber.length > 10 ? `${waNumber.slice(0, 2)} ${waNumber.slice(2)}` : waNumber}`;
  const waMessage = encodeURIComponent(
    `Hi, I'd like to order ${product.name}${
      selectedVariant?.variantName ? ` - ${selectedVariant.variantName}` : ""
    }${
      selectedUnitPrice ? ` (${formatMeasurementLabel(selectedUnitPrice.measurement)})` : ""
    }.`
  );
  const waHref = `https://wa.me/${waNumber}?text=${waMessage}`;

  const sourcingLocation = [company?.city, company?.state].filter(Boolean).join(", ");

  const variantSubtitle = [selectedVariant?.variantName, selectedVariant?.shortDescription]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="w-full space-y-12">
      {/* 2-Column Product Gallery + Details Buy Box */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Gallery (sticky only on md+ screens within this block) */}
        <div className="md:col-span-6 md:sticky md:top-24">
          <ProductGallery
            images={galleryImages}
            videoUrl={selectedVariant?.videoUrl}
            productName={selectedVariant?.variantName || product.name}
            isInStock={isInStock}
          />
        </div>

        {/* Right Details */}
        <div className="md:col-span-6 space-y-6">
          {/* Category, Brand & SKU Pills + Share */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {product.category && (
                <Link
                  href={`/categories/${product.category.id}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#007F06]/10 text-[#007F06] hover:bg-[#007F06]/20 transition-colors"
                >
                  {product.category.name}
                </Link>
              )}
              {selectedUnitPrice?.sku && (
                <span className="text-xs font-mono text-neutral-400 bg-neutral-50 border border-neutral-200/80 px-2.5 py-1 rounded-full">
                  SKU: {selectedUnitPrice.sku}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleShare}
              className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-neutral-500 border border-neutral-200 bg-white hover:border-[#007F06]/40 hover:text-[#007F06] transition-colors shrink-0"
            >
              <Share2 className="w-3.5 h-3.5" />
              {shareCopied ? "Link copied!" : "Share"}
            </button>
          </div>

          {/* Titles & Review Social Proof */}
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-neutral-900 tracking-tight leading-tight">
              {product.name}
            </h1>
            {variantSubtitle && (
              <p className="text-base sm:text-lg text-neutral-600 font-medium mt-1">
                {variantSubtitle}
              </p>
            )}
            {sourcingLocation && (
              <p className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-medium text-neutral-500">
                <MapPin className="w-3.5 h-3.5 text-[#007F06]/70" />
                Sourced from {sourcingLocation}
              </p>
            )}

            {/* Star Rating Social Proof (Only show real rating if reviews exist) */}
            {totalReviews > 0 ? (
              <a
                href="#reviews-section"
                className="inline-flex items-center gap-2 mt-2 text-xs font-semibold text-neutral-600 hover:text-[#007F06] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-0.5 text-primary-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.round(avgRating)
                          ? "fill-primary-400 text-primary-400"
                          : "fill-neutral-200 text-neutral-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-bold text-neutral-900">{avgRating.toFixed(1)}</span>
                <span className="text-neutral-300">•</span>
                <span className="underline underline-offset-2 text-neutral-500 group-hover:text-[#007F06]">
                  {totalReviews} customer {totalReviews === 1 ? "review" : "reviews"}
                </span>
              </a>
            ) : (
              <a
                href="#reviews-section"
                className="inline-flex items-center gap-1.5 mt-2 text-xs text-neutral-500 hover:text-[#007F06] transition-colors cursor-pointer"
              >
                <span>No reviews yet</span>
                <span className="text-neutral-300">•</span>
                <span className="underline underline-offset-2">Be the first to review</span>
              </a>
            )}
          </div>

          {/* Pricing Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#007F06]/[0.06] via-white to-white border border-[#007F06]/15 shadow-2xs">
            {selectedUnitPrice ? (
              <div>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#006B05] tracking-tight">
                    ₹{sellingPrice.toFixed(2)}
                  </span>
                  {hasDiscount && (
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-xs text-neutral-400">MRP</span>
                      <span className="text-lg sm:text-xl line-through text-neutral-400">
                        ₹{basePrice.toFixed(2)}
                      </span>
                    </span>
                  )}
                  {hasDiscount && discountPercent > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary-100 text-secondary-800 border border-secondary-200">
                      <Sparkles className="w-3 h-3" />
                      Save {discountPercent}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#007F06]/70" />
                  Inclusive of all taxes • Freshly packed
                </p>
              </div>
            ) : (
              <p className="text-sm text-neutral-500 italic">
                Pricing for this item is coming soon.
              </p>
            )}
          </div>

          {/* Pack Size Selection (Figma Style) */}
          {allPackOptions.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold tracking-wider text-neutral-900 uppercase font-sans">
                  CHOOSE PACK SIZE
                </span>
                {activeOption && (
                  <span className="text-xs sm:text-sm text-[#007F06] font-semibold">
                    Selected: {activeOption.label}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {allPackOptions.map((opt) => {
                  const isSelected = activeOption?.unitPriceId === opt.unitPriceId;
                  const price = opt.sellingPrice;
                  const compare = opt.basePrice;
                  const discount =
                    compare > price ? Math.round(((compare - price) / compare) * 100) : 0;

                  return (
                    <button
                      key={opt.unitPriceId}
                      type="button"
                      onClick={() => handleSelectPackOption(opt)}
                      className={`relative flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all cursor-pointer select-none ${
                        isSelected
                          ? "border-[#006B05] bg-[#006B05] text-white shadow-md scale-[1.02]"
                          : "border-neutral-200 bg-white text-neutral-800 hover:border-[#007F06]/50 hover:bg-[#007F06]/5 hover:shadow-2xs"
                      }`}
                    >
                      {discount > 0 && (
                        <span className="absolute -top-2.5 right-2 bg-[#F9CB44] text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow-2xs">
                          SAVE {discount}%
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-xs sm:text-sm font-bold">
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        <span>{opt.label}</span>
                      </div>
                      <span
                        className={`text-xs sm:text-sm mt-0.5 ${
                          isSelected ? "text-neutral-200 font-normal" : "text-neutral-500 font-medium"
                        }`}
                      >
                        ₹{price.toFixed(0)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Controls: Quantity + Add to Cart + Wishlist */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center gap-3">
              {/* Quantity Selector */}
              <div className="flex items-center border border-neutral-200 rounded-xl bg-white shadow-2xs overflow-hidden h-12 shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || addToCart.isPending}
                  className="w-10 sm:w-11 h-full flex items-center justify-center text-lg font-bold text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 transition-colors"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="w-9 sm:w-11 text-center text-sm font-semibold text-neutral-900 select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={addToCart.isPending}
                  className="w-10 sm:w-11 h-full flex items-center justify-center text-lg font-bold text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 transition-colors"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* Add to Cart CTA */}
              <Button
                type="button"
                size="lg"
                disabled={!isInStock || !selectedUnitPrice || addToCart.isPending}
                onClick={handleAddToCart}
                className="flex-1 h-12 bg-[#006B05] hover:bg-[#004203] text-white rounded-xl shadow-md hover:shadow-lg font-semibold text-base transition-all active:scale-[0.99] disabled:opacity-50 disabled:shadow-none"
              >
                {addToCart.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Adding to Cart...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    {!selectedUnitPrice
                      ? "Unavailable"
                      : !isInStock
                        ? "Out of Stock"
                        : "Add to Cart"}
                  </>
                )}
              </Button>

              {/* Wishlist Button */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={(e) => handleWishlistToggle(e)}
                disabled={addToWishlist.isPending || removeFromWishlist.isPending}
                className={`h-12 w-12 rounded-xl border-neutral-200 hover:border-neutral-400 bg-white transition-all active:scale-95 shrink-0 ${
                  isInWishlist ? "border-rose-300 bg-rose-50/50" : ""
                }`}
                aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
              >
                {addToWishlist.isPending || removeFromWishlist.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                ) : (
                  <Heart
                    className={`h-5 w-5 transition-transform ${
                      isInWishlist
                        ? "fill-rose-500 text-rose-500 scale-110"
                        : "text-neutral-600 hover:text-rose-500"
                    }`}
                  />
                )}
              </Button>
            </div>

            {/* Order on WhatsApp */}
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#007F06]/30 bg-[#007F06]/5 text-sm font-semibold text-[#006B05] hover:bg-[#007F06]/10 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Order on WhatsApp · {waDisplay}
            </a>

            {/* Stock availability indicator */}
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg w-fit ${
                !selectedUnitPrice
                  ? "bg-neutral-50"
                  : isInStock
                    ? "bg-secondary-50"
                    : "bg-rose-50"
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  !selectedUnitPrice
                    ? "bg-neutral-300"
                    : isInStock
                      ? "bg-secondary-500 ring-4 ring-secondary-500/20"
                      : "bg-rose-500 ring-4 ring-rose-500/20"
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  !selectedUnitPrice
                    ? "text-neutral-500"
                    : isInStock
                      ? "text-secondary-700"
                      : "text-rose-600"
                }`}
              >
                {!selectedUnitPrice
                  ? "Unavailable"
                  : isInStock
                    ? "In Stock • Ready to ship"
                    : "Currently Out of Stock"}
              </span>
            </div>
          </div>

          {/* About / Sourcing / Shipping accordion */}
          <div className="pt-2 border-t border-neutral-100">
            <AccordionSection title="About this product" defaultOpen>
              {product.description ? (
                <div
                  className="rich-text-content max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeRichText(product.description) }}
                />
              ) : (
                <p className="text-neutral-400 italic">No description available yet.</p>
              )}
            </AccordionSection>

            <AccordionSection title="Shipping & returns">
              <ul className="space-y-2">
                {SHIPPING_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#007F06]" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </AccordionSection>
          </div>

        </div>
      </div>
      {/* End 2-Column Product Gallery + Details Buy Box */}

      {/* Full-Width Guarantees Row Below Gallery & Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-4 pt-6 border-t border-neutral-100">
        <div className="flex items-center gap-3">
          <Truck className="w-5 h-5 text-[#007F06] shrink-0" strokeWidth={1.8} />
          <div>
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">Free Shipping</h4>
            <p className="text-xs text-neutral-500 mt-0.5">On all orders above ₹999</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-[#007F06] shrink-0" strokeWidth={1.8} />
          <div>
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">Fast Delivery</h4>
            <p className="text-xs text-neutral-500 mt-0.5">Delivered in 3–5 days pan-India</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[#007F06] shrink-0" strokeWidth={1.8} />
          <div>
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">Hand-Sorted</h4>
            <p className="text-xs text-neutral-500 mt-0.5">Cleaned and graded by hand</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RotateCcw className="w-5 h-5 text-[#007F06] shrink-0" strokeWidth={1.8} />
          <div>
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">Freshness Guarantee</h4>
            <p className="text-xs text-neutral-500 mt-0.5">Hassle-free replacement guarantee</p>
          </div>
        </div>
      </div>

      {/* Complete Your Festive Box - You May Also Like (Fully outside sticky container) */}
      {variants.length > 1 && (
        <div className="w-full pt-10 border-t border-[#F5F5F5]">
          <ProductVariantSelector
            variants={variants}
            selectedVariantId={selectedVariantId}
            onSelect={handleSelectVariant}
            productName={product.name}
            categoryName={product.category?.name}
          />
        </div>
      )}

      {/* Connoisseur Feedback & Customer Reviews for Selected Variant */}
      <ProductReviewsSection
        variantId={selectedVariant?.id}
        variantName={selectedVariant?.variantName}
        productName={product.name}
      />
    </div>
  );
}

export { ProductDetails };
