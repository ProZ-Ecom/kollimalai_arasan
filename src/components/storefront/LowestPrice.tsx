"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LowestPriceCard } from "./cards/LowestPriceCard";
import { SectionHeader } from "./heading/SectionHeader";
import { Section } from "./Section";
import { useCustomerVariants } from "@/features/variants";
import { useAddToCart } from "@/features/cart/hooks/use-cart";
import {
  useAddToWishlist,
  useRemoveFromWishlist,
  useWishlistedUnitPriceIds,
} from "@/features/wishlist/hooks/use-wishlist";
import { mapVariantToStorefrontProduct } from "@/lib/storefront";
import type { StorefrontProduct } from "@/constants/storefront";

/**
 * Horizontal carousel of discounted items - only products whose selling
 * price undercuts the compare-at (base) price are shown.
 */
export function LowestPrice() {
  const router = useRouter();
  const { data: session } = useSession();
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const { data: response, isLoading } = useCustomerVariants({
    page: 1,
    pageSize: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
    onlyDefault: true,
  });

  const { wishlistedIds } = useWishlistedUnitPriceIds({ enabled: !!session });
  const addToCart = useAddToCart();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const products: StorefrontProduct[] = React.useMemo(() => {
    const all = (response?.data ?? []).map(mapVariantToStorefrontProduct);
    const discounted = all.filter((product) =>
      product.unitPrices.some((up) => up.sellingPrice < up.basePrice)
    );
    const productMap = new Map<string, StorefrontProduct>();
    for (const item of discounted) {
      const existing = productMap.get(item.productId);
      if (!existing || (item.isDefault && !existing.isDefault)) {
        productMap.set(item.productId, item);
      }
    }
    return Array.from(productMap.values());
  }, [response]);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const requireLogin = () => {
    router.push("/login?callbackUrl=/");
  };

  const handleAddToCart = (product: StorefrontProduct, unitPriceId?: string) => {
    if (!unitPriceId) return;
    addToCart.mutate(
      { variantUnitPriceId: unitPriceId, quantity: 1 },
      {
        onSuccess: () => showNotification(`Added ${product.name} to cart`),
        onError: (err: any) => {
          if (err?.status === 401 || err?.message?.toLowerCase().includes("login")) {
            requireLogin();
            return;
          }
          showNotification("Could not add item to cart");
        },
      }
    );
  };

  const handleWishlistToggle = (product: StorefrontProduct, unitPriceId?: string) => {
    if (!unitPriceId) return;
    if (wishlistedIds.has(unitPriceId)) {
      removeFromWishlist.mutate(unitPriceId, {
        onSuccess: () => showNotification(`Removed ${product.name} from wishlist`),
        onError: (err: any) => {
          if (err?.status === 401 || err?.message?.toLowerCase().includes("login")) {
            requireLogin();
            return;
          }
          showNotification("Could not remove item from wishlist");
        },
      });
    } else {
      addToWishlist.mutate(unitPriceId, {
        onSuccess: () => showNotification(`Added ${product.name} to wishlist`),
        onError: (err: any) => {
          if (err?.status === 401 || err?.message?.toLowerCase().includes("login")) {
            requireLogin();
            return;
          }
          showNotification("Could not add item to wishlist");
        },
      });
    }
  };

  const scrollByCards = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;
    const step = Math.max(240, container.clientWidth * 0.8);
    container.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  if (!isLoading && products.length === 0) return null;

  return (
    <Section className="py-12 relative">
      {toastMessage && (
        <div className="fixed top-24 right-4 z-50 rounded-xl bg-[var(--neutral-900)] text-white px-5 py-3 shadow-xl text-sm font-medium animate-in fade-in-0 duration-200">
          {toastMessage}
        </div>
      )}

      <SectionHeader
        title="Lowest Price Ever"
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollByCards("left")}
              aria-label="Previous"
              className="w-9 h-9 rounded-full btn-yellow flex items-center justify-center cursor-pointer transition-all hover:scale-105"
            >
              <ChevronLeft className="w-4 h-4 text-[var(--neutral-900)]" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCards("right")}
              aria-label="Next"
              className="w-9 h-9 rounded-full btn-yellow flex items-center justify-center cursor-pointer transition-all hover:scale-105"
            >
              <ChevronRight className="w-4 h-4 text-[var(--neutral-900)]" />
            </button>
          </div>
        }
      />

      <div
        ref={scrollRef}
        className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {isLoading &&
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="shrink-0 w-[220px] sm:w-[250px] aspect-[3/4.2] rounded-xl bg-theme-surface-alt animate-pulse"
            />
          ))}

        {!isLoading &&
          products.map((product) => (
            <LowestPriceCard
              key={product.id}
              product={product}
              isWishlisted={product.unitPrices.some((u) => wishlistedIds.has(u.id))}
              onWishlistToggle={(unitPriceId) => handleWishlistToggle(product, unitPriceId)}
              onAddToCart={(unitPriceId) => handleAddToCart(product, unitPriceId)}
              disabled={addToCart.isPending}
            />
          ))}
      </div>
    </Section>
  );
}

export default LowestPrice;
