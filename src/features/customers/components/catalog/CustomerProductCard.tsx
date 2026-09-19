"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { SnackCard, type SnackCardVariant } from "@/components/storefront/cards/SnackCard";
import { formatPrice } from "@/lib/utils";
import { useAddToCart } from "@/features/cart/hooks/use-cart";
import {
  useAddToWishlist,
  useRemoveFromWishlist,
  useWishlistedUnitPriceIds,
} from "@/features/wishlist/hooks/use-wishlist";
import { toast } from "@/components/ui/Toast";
import type { CustomerProductListItemDto } from "../../types/catalog.types";

export interface CustomerProductCardProps {
  product: CustomerProductListItemDto;
}

export function CustomerProductCard({ product }: CustomerProductCardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { wishlistedIds } = useWishlistedUnitPriceIds();
  const addToCart = useAddToCart();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  // Convert product.unitPrices to SnackCardVariant[]
  const variants: SnackCardVariant[] = React.useMemo(() => {
    return (product.unitPrices || []).map((up) => ({
      id: up.id,
      label: up.label,
      price: up.sellingPrice,
      comparePrice: up.basePrice > up.sellingPrice ? up.basePrice : null,
      inStock: true,
    }));
  }, [product.unitPrices]);

  const [selectedVariantId, setSelectedVariantId] = React.useState(
    variants[0]?.id || ""
  );

  React.useEffect(() => {
    if (variants.length > 0 && !variants.some((v) => v.id === selectedVariantId)) {
      setSelectedVariantId(variants[0].id);
    }
  }, [variants, selectedVariantId]);

  const activeVariantId = selectedVariantId || variants[0]?.id;
  const isWishlisted = Boolean(activeVariantId && wishlistedIds.has(activeVariantId));

  const activeUnitPrice = React.useMemo(() => {
    return (
      product.unitPrices?.find((u) => u.id === activeVariantId) ||
      product.unitPrices?.[0]
    );
  }, [product.unitPrices, activeVariantId]);

  const offerBadge = React.useMemo(() => {
    const up =
      activeUnitPrice ||
      product.unitPrices?.find((u) => (u.discountPercent && u.discountPercent > 0) || u.offer);
    if (!up) return null;

    if (up.discountPercent && up.discountPercent > 0) {
      return `${Math.round(up.discountPercent)}% OFF`;
    }

    if (up.basePrice > up.sellingPrice) {
      const pct = Math.round(((up.basePrice - up.sellingPrice) / up.basePrice) * 100);
      if (pct > 0) return `${pct}% OFF`;
    }

    const offer = up.offer;
    if (offer) {
      if (offer.type === "percentage" && offer.value > 0) {
        return `${Math.round(offer.value)}% OFF`;
      }
      if (offer.type === "flat" && offer.value > 0) {
        return `₹${Math.round(offer.value)} OFF`;
      }
      if (offer.type === "bxgy") {
        const b = offer.buyQuantity;
        const g = offer.getQuantity;
        if (b && g) return `BUY ${b} GET ${g} FREE`;
        return "BUY & GET FREE";
      }
      if (offer.type === "special_price") {
        return "SPECIAL PRICE";
      }
      if (offer.name) {
        return offer.name.toUpperCase();
      }
    }

    return null;
  }, [activeUnitPrice, product.unitPrices]);

  const isPriceRange =
    product.minPrice !== product.maxPrice && product.maxPrice > product.minPrice;
  const priceRangeText = isPriceRange
    ? `${formatPrice(product.minPrice)} – ${formatPrice(product.maxPrice)}`
    : undefined;

  const requireLogin = () => {
    toast.info("Please log in to add items to your cart");
    const returnUrl =
      typeof window !== "undefined" ? window.location.pathname : "/products";
    router.push(`/login?callbackUrl=${encodeURIComponent(returnUrl)}`);
  };

  const handleWishlistToggle = (variantId?: string) => {
    const targetId = variantId || activeVariantId;
    if (!targetId) return;

    if (wishlistedIds.has(targetId)) {
      removeFromWishlist.mutate(targetId, {
        onSuccess: () => toast.success("Removed from wishlist", product.name),
        onError: (err: any) => {
          if (err?.status === 401 || err?.message?.toLowerCase().includes("login")) {
            requireLogin();
            return;
          }
          toast.error(err?.message || "Could not remove from wishlist");
        },
      });
    } else {
      addToWishlist.mutate(targetId, {
        onSuccess: () => toast.success("Added to wishlist", product.name),
        onError: (err: any) => {
          if (err?.status === 401 || err?.message?.toLowerCase().includes("login")) {
            requireLogin();
            return;
          }
          toast.error(err?.message || "Could not add to wishlist");
        },
      });
    }
  };

  const handleAddToCart = (variantId?: string) => {
    const targetId = variantId || activeVariantId;
    if (!targetId) return;

    addToCart.mutate(
      { variantUnitPriceId: targetId, quantity: 1 },
      {
        onSuccess: () => toast.success("Added to cart", product.name),
        onError: (err: any) => {
          if (err?.status === 401 || err?.message?.toLowerCase().includes("login")) {
            requireLogin();
            return;
          }
          toast.error(err?.message || "Could not add item to cart");
        },
      }
    );
  };

  return (
    <SnackCard
      id={product.id}
      name={product.name}
      image={product.image}
      href={`/products/${product.id}`}
      variants={variants}
      fallbackPrice={product.minPrice}
      priceRangeText={priceRangeText}
      selectedVariantId={activeVariantId}
      onVariantChange={setSelectedVariantId}
      badgeText={offerBadge}
      discountPercent={activeUnitPrice?.discountPercent}
      isWishlisted={isWishlisted}
      onWishlistToggle={handleWishlistToggle}
      onAddToCart={handleAddToCart}
      isLoading={addToCart.isPending}
    />
  );
}

export default CustomerProductCard;
