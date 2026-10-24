"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { SnackCard, type SnackCardVariant } from "@/components/storefront/cards/SnackCard";
import { useAddToCart } from "@/features/cart/hooks/use-cart";
import {
  useAddToWishlist,
  useRemoveFromWishlist,
  useWishlistedUnitPriceIds,
} from "@/features/wishlist/hooks/use-wishlist";
import { toast } from "@/components/ui/Toast";
import type { CustomerVariantListItemDto } from "../../types/catalog.types";
import { resolveSnackFallbackImage } from "@/lib/storefront";
import { formatMeasurementLabel } from "@/features/variants/utils/measurement.util";

export interface CustomerVariantCardProps {
  variant: CustomerVariantListItemDto;
}

export function CustomerVariantCard({ variant }: CustomerVariantCardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { wishlistedIds } = useWishlistedUnitPriceIds();
  const addToCart = useAddToCart();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  // Convert variant.unitPrices to SnackCardVariant[]
  const packVariants: SnackCardVariant[] = React.useMemo(() => {
    return (variant.unitPrices || []).map((up) => {
      const label =
        typeof up.measurement === "string"
          ? up.measurement
          : formatMeasurementLabel(up.measurement as any) || "Standard";

      const inStock =
        !variant.outOfStock &&
        !up.outOfStock &&
        (up.stock === undefined || up.stock > 0);

      return {
        id: up.id,
        label,
        price: up.sellingPrice,
        comparePrice: up.basePrice > up.sellingPrice ? up.basePrice : null,
        inStock,
      };
    });
  }, [variant.unitPrices, variant.outOfStock]);

  const defaultUnit = React.useMemo(() => {
    // 1. Prefer in-stock default
    const inStockDefault = variant.unitPrices?.find(
      (u) =>
        u.isDefault &&
        !u.outOfStock &&
        (u.stock === undefined || u.stock > 0)
    );
    if (inStockDefault) return inStockDefault;

    // 2. Automatically switch to first in-stock pack size
    const anyInStock = variant.unitPrices?.find(
      (u) => !u.outOfStock && (u.stock === undefined || u.stock > 0)
    );
    if (anyInStock) return anyInStock;

    // 3. Fallback to marked default or first
    return (
      variant.unitPrices?.find((u) => u.isDefault) ||
      variant.unitPrices?.[0] ||
      null
    );
  }, [variant.unitPrices]);

  const [selectedUnitPriceId, setSelectedUnitPriceId] = React.useState(
    defaultUnit?.id || packVariants[0]?.id || ""
  );

  React.useEffect(() => {
    // If currently selected pack size is out of stock, auto-switch to the available in-stock pack
    const current = packVariants.find((v) => v.id === selectedUnitPriceId);
    if (!current || current.inStock === false) {
      const firstInStock = packVariants.find((v) => v.inStock);
      if (firstInStock && firstInStock.id !== selectedUnitPriceId) {
        setSelectedUnitPriceId(firstInStock.id);
        return;
      }
    }
    if (packVariants.length > 0 && !packVariants.some((v) => v.id === selectedUnitPriceId)) {
      setSelectedUnitPriceId(packVariants[0].id);
    }
  }, [packVariants, selectedUnitPriceId]);

  const activeUnitPriceId = selectedUnitPriceId || packVariants[0]?.id;
  const isWishlisted = Boolean(activeUnitPriceId && wishlistedIds.has(activeUnitPriceId));

  const activeUnitPrice = React.useMemo(() => {
    return (
      variant.unitPrices?.find((u) => u.id === activeUnitPriceId) ||
      defaultUnit ||
      variant.unitPrices?.[0]
    );
  }, [variant.unitPrices, activeUnitPriceId, defaultUnit]);

  const offerBadge = React.useMemo(() => {
    const up =
      activeUnitPrice ||
      variant.unitPrices?.find((u) => (u.discountPercent && u.discountPercent > 0) || u.offer);
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
  }, [activeUnitPrice, variant.unitPrices]);

  const requireLogin = () => {
    toast.info("Please log in to add items to your cart");
    const returnUrl =
      typeof window !== "undefined" ? window.location.pathname : "/products";
    router.push(`/login?callbackUrl=${encodeURIComponent(returnUrl)}`);
  };

  const handleWishlistToggle = (unitPriceId?: string) => {
    const targetId = unitPriceId || activeUnitPriceId || defaultUnit?.id || packVariants[0]?.id;
    if (!targetId) return;

    if (wishlistedIds.has(targetId)) {
      removeFromWishlist.mutate(targetId, {
        onSuccess: () => toast.success("Removed from wishlist", variant.variantName),
        onError: (err: any) => {
          if (err?.status === 401 || err?.message?.toLowerCase().includes("login")) {
            toast.info("Please log in to manage your wishlist");
            requireLogin();
            return;
          }
          toast.error(err?.message || "Could not remove from wishlist");
        },
      });
    } else {
      addToWishlist.mutate(targetId, {
        onSuccess: () => toast.success("Added to wishlist", variant.variantName),
        onError: (err: any) => {
          if (err?.status === 401 || err?.message?.toLowerCase().includes("login")) {
            toast.info("Please log in to manage your wishlist");
            requireLogin();
            return;
          }
          toast.error(err?.message || "Could not add to wishlist");
        },
      });
    }
  };

  const handleAddToCart = (unitPriceId?: string) => {
    const targetId = unitPriceId || activeUnitPriceId || defaultUnit?.id || packVariants[0]?.id;

    addToCart.mutate(
      {
        variantUnitPriceId: targetId || undefined,
        variantId: variant.id,
        quantity: 1,
      },
      {
        onSuccess: () =>
          toast.success("Added to cart", variant.variantName || variant.productName),
        onError: (err: any) => {
          if (err?.status === 401 || err?.message?.toLowerCase().includes("login")) {
            toast.info("Please log in to add items to your cart");
            requireLogin();
            return;
          }
          const message = err?.message || "Could not add item to cart";
          toast.error(message);
        },
      }
    );
  };

  const isDummyLogo =
    variant.primaryImage?.startsWith("/logos/") && variant.primaryImage?.endsWith(".png");
  const displayImage =
    !isDummyLogo && variant.primaryImage
      ? variant.primaryImage
      : resolveSnackFallbackImage(variant.variantName || variant.productName || "");

  return (
    <SnackCard
      id={variant.id}
      name={variant.variantName}
      subtitle={variant.productName || "Kollimalai Arasan"}
      image={displayImage}
      href={`/products/${variant.productId}?variant=${variant.id}`}
      variants={packVariants}
      fallbackPrice={variant.salePrice || variant.basePrice}
      selectedVariantId={activeUnitPriceId}
      onVariantChange={setSelectedUnitPriceId}
      badgeText={offerBadge}
      discountPercent={activeUnitPrice?.discountPercent}
      isWishlisted={isWishlisted}
      onWishlistToggle={handleWishlistToggle}
      onAddToCart={handleAddToCart}
      isLoading={addToCart.isPending}
    />
  );
}

export default CustomerVariantCard;
