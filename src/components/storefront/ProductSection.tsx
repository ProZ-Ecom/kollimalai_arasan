"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { SnackCard } from "./cards/SnackCard";
import { ProductCardSkeleton } from "./cards/ProductCardSkeleton";
import { SectionHeader } from "./heading/SectionHeader";
import { PrimaryButton } from "./buttons/PrimaryButton";
import { Section } from "./Section";
import { useCustomerVariants } from "@/features/variants";
import { useAddToCart } from "@/features/cart/hooks/use-cart";
import {
  useAddToWishlist,
  useRemoveFromWishlist,
  useWishlistedUnitPriceIds,
} from "@/features/wishlist/hooks/use-wishlist";
import { mapVariantToStorefrontProduct } from "@/lib/storefront";
import { ICONS, type StorefrontProduct } from "@/constants/storefront";

export interface ProductSectionProps {
  selectedCategoryId?: string | null;
  /** Leading heading words, in the primary text colour. */
  title?: string;
  /** Trailing heading words, in the accent colour. */
  accent?: string;
  /** Cards shown before "View All" reveals the rest. */
  initialCount?: number;
  /** Card treatment - see SnackCard's `layout` prop. */
  cardLayout?: "split" | "stacked";
}

export function ProductSection({
  selectedCategoryId,
  title = "Freshly Launched",
  accent = "Flavours",
  initialCount = 8,
  cardLayout = "stacked",
}: ProductSectionProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [showAll, setShowAll] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Fetch variants from the real Customer Catalog API
  const { data: response, isLoading, isError } = useCustomerVariants({
    categoryIds: selectedCategoryId ? [selectedCategoryId] : undefined,
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
    const raw = (response?.data ?? []).map(mapVariantToStorefrontProduct);
    const productMap = new Map<string, StorefrontProduct>();
    for (const item of raw) {
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

  const handleAddToCart = (product: StorefrontProduct, unitPriceId: string) => {
    if (!session) return requireLogin();
    addToCart.mutate(
      { variantUnitPriceId: unitPriceId, quantity: 1 },
      {
        onSuccess: () => showNotification(`Added ${product.name} to cart`),
        onError: () => showNotification("Could not add item to cart"),
      }
    );
  };

  const handleWishlistToggle = (product: StorefrontProduct, unitPriceId: string) => {
    if (!session) return requireLogin();
    if (wishlistedIds.has(unitPriceId)) {
      removeFromWishlist.mutate(unitPriceId, {
        onSuccess: () => showNotification(`Removed ${product.name} from wishlist`),
      });
    } else {
      addToWishlist.mutate(unitPriceId, {
        onSuccess: () => showNotification(`Added ${product.name} to wishlist`),
      });
    }
  };

  const visibleProducts = showAll ? products : products.slice(0, initialCount);

  return (
    <Section className="py-12 relative">
      {/* Toast alert feedback */}
      {toastMessage && (
        <div className="fixed top-24 right-4 z-50 rounded-xl bg-[var(--neutral-900)] text-white px-5 py-3 shadow-xl text-sm font-medium animate-in fade-in-0 duration-200">
          {toastMessage}
        </div>
      )}

      <SectionHeader
        title={title}
        accent={accent}
        action={
          products.length > initialCount ? (
            <PrimaryButton
              variant="brown"
              onClick={() => setShowAll(!showAll)}
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm cursor-pointer transition-all hover:scale-105 duration-300"
            >
              <Image
                src={ICONS.view_all}
                alt=""
                aria-hidden="true"
                width={14}
                height={14}
                className=""
              />
              <span className="header-font">
                {showAll ? "Show Less" : "View All"}
              </span>
            </PrimaryButton>
          ) : null
        }
      />

      {/* Products Grid */}
      <div
        className="
          grid
          grid-cols-2
          gap-3
          sm:gap-6
          md:grid-cols-3
          lg:grid-cols-4
        "
      >
        {isLoading &&
          Array.from({ length: initialCount }).map((_, index) => (
            <ProductCardSkeleton key={`skeleton-${index}`} />
          ))}

        {!isLoading &&
          visibleProducts.map((product) => (
            <SnackCard
              key={product.id}
              product={product}
              isWishlisted={product.unitPrices.some((u) => wishlistedIds.has(u.id))}
              onWishlistToggle={(unitPriceId) =>
                handleWishlistToggle(product, unitPriceId || product.unitPrices[0]?.id)
              }
              onAddToCart={(unitPriceId) =>
                handleAddToCart(product, unitPriceId || product.unitPrices[0]?.id)
              }
              layout={cardLayout}
              disabled={addToCart.isPending}
            />
          ))}
      </div>

      {/* Empty State */}
      {!isLoading && !isError && products.length === 0 && (
        <div className="py-16 text-center text-sm text-[var(--color-neutral-500)]">
          <p className="text-base font-medium text-[var(--neutral-900)]">
            No snacks found in this category.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Please explore our other delicious snack categories.
          </p>
        </div>
      )}

    </Section>
  );
}

export default ProductSection;
