"use client";

import * as React from "react";
import Image from "next/image";
import { ProductCardSkeleton } from "./cards/ProductCardSkeleton";
import { SectionHeader } from "./heading/SectionHeader";
import { PrimaryButton } from "./buttons/PrimaryButton";
import { Section } from "./Section";
import { useCustomerVariants } from "@/features/variants";
import { CustomerVariantCard } from "@/features/customers/components/catalog/CustomerVariantCard";
import { ICONS } from "@/constants/storefront";
import type { CustomerVariantListItemDto } from "@/features/customers/types/catalog.types";

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
}: ProductSectionProps) {
  const [showAll, setShowAll] = React.useState(false);

  // Fetch variants from the real Customer Catalog API
  const { data: response, isLoading, isError } = useCustomerVariants({
    categoryIds: selectedCategoryId ? [selectedCategoryId] : undefined,
    page: 1,
    pageSize: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
    onlyDefault: true,
  });

  const uniqueVariants = React.useMemo(() => {
    const raw = response?.data ?? [];
    const map = new Map<string, CustomerVariantListItemDto>();
    for (const v of raw) {
      const existing = map.get(v.productId);
      if (!existing || (v.isDefault && !existing.isDefault)) {
        map.set(v.productId, v);
      }
    }
    return Array.from(map.values());
  }, [response]);

  const visibleVariants = showAll
    ? uniqueVariants
    : uniqueVariants.slice(0, initialCount);

  return (
    <Section className="py-12 relative">
      <SectionHeader
        title={title}
        accent={accent}
        action={
          uniqueVariants.length > initialCount ? (
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
          visibleVariants.map((variant) => (
            <CustomerVariantCard key={variant.id} variant={variant} />
          ))}
      </div>

      {/* Empty State */}
      {!isLoading && !isError && uniqueVariants.length === 0 && (
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
