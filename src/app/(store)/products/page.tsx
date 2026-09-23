"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { Sparkles, ChevronRight, SlidersHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FilterSidebar } from "@/components/storefront/filters/FilterSidebar";
import { CustomerProductGrid } from "@/features/customers/components/catalog/CustomerProductGrid";
import {
  useCustomerGlobalVariants,
  useCustomerCategories,
} from "@/features/customers/hooks/use-customer-catalog";
import type { CustomerVariantListItemDto } from "@/features/customers/types/catalog.types";
import type { CustomerGlobalVariantListInput } from "@/features/customers/validations/catalog.schema";

const SORT_OPTIONS: {
  value: string;
  label: string;
  sortBy: CustomerGlobalVariantListInput["sortBy"];
  sortOrder: CustomerGlobalVariantListInput["sortOrder"];
}[] = [
  { value: "createdAt_desc", label: "Newest First", sortBy: "createdAt", sortOrder: "desc" },
  { value: "price_asc", label: "Price: Low to High", sortBy: "basePrice", sortOrder: "asc" },
  { value: "price_desc", label: "Price: High to Low", sortBy: "basePrice", sortOrder: "desc" },
  { value: "name_asc", label: "Name: A to Z", sortBy: "variantName", sortOrder: "asc" },
  { value: "name_desc", label: "Name: Z to A", sortBy: "variantName", sortOrder: "desc" },
];

function ProductCatalogSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 animate-in fade-in duration-200">
      {[1, 2, 3, 4, 5, 6,7,8,9].map((n) => (
        <div
          key={n}
          className="bg-white rounded-2xl border border-[#E5E5E5]/80 p-3.5 flex flex-col justify-between overflow-hidden shadow-2xs space-y-3"
        >
          {/* Image skeleton with shimmer */}
          <div className="relative aspect-square w-full rounded-xl skeleton-shimmer overflow-hidden bg-neutral-100" />

          {/* Info row: Category, title & pack size pills */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between gap-2">
              <div className="h-3 w-20 rounded skeleton-shimmer bg-neutral-100" />
              <div className="flex gap-1">
                <div className="h-4.5 w-10 rounded skeleton-shimmer bg-neutral-100" />
                <div className="h-4.5 w-10 rounded skeleton-shimmer bg-neutral-100" />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <div className="h-4.5 w-36 rounded skeleton-shimmer bg-neutral-100" />
              <div className="h-4.5 w-14 rounded skeleton-shimmer bg-neutral-100" />
            </div>
          </div>

          {/* Golden CTA button skeleton */}
          <div className="h-10 w-full rounded-xl skeleton-shimmer bg-[#F8BE15]/20" />
        </div>
      ))}
    </div>
  );
}

export default function ShopAllPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("createdAt_desc");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [stockStatus, setStockStatus] = useState<"all" | "in_stock" | "out_of_stock">("all");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Accumulated variants for Infinite Scroll
  const [accumulatedVariants, setAccumulatedVariants] = useState<CustomerVariantListItemDto[]>([]);

  // Fetch all categories (supports 250 categories)
  const { data: categoriesData, isLoading: isLoadingCategories } = useCustomerCategories({ pageSize: 250 });
  const categories = categoriesData?.data ?? [];

  const currentCategory = useMemo(() => {
    if (selectedCategoryIds.length !== 1) return null;
    return categories.find((c) => c.id === selectedCategoryIds[0]);
  }, [categories, selectedCategoryIds]);

  const pageTitle = useMemo(() => {
    if (selectedCategoryIds.length === 1 && currentCategory?.name) return currentCategory.name;
    if (selectedCategoryIds.length > 1) return `${selectedCategoryIds.length} Categories Selected`;
    return "Shop All Products";
  }, [currentCategory, selectedCategoryIds]);

  // Find active sort config
  const activeSort = useMemo(() => {
    return SORT_OPTIONS.find((s) => s.value === sortKey) ?? SORT_OPTIONS[0];
  }, [sortKey]);

  // Query variants with filters (Postman: POST /api/customer/variants)
  const {
    data: variantsResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useCustomerGlobalVariants({
    page,
    pageSize: 18,
    search: search.trim() ? search.trim() : undefined,
    categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
    productIds: selectedProductIds.length > 0 ? selectedProductIds : undefined,
    minPrice: minPrice > 0 ? minPrice : undefined,
    maxPrice: maxPrice < 1000 ? maxPrice : undefined,
    sortBy: activeSort.sortBy,
    sortOrder: activeSort.sortOrder,
    onlyDefault: true,
  });

  const meta = variantsResponse?.meta;

  // Infinite Scroll accumulation logic
  useEffect(() => {
    if (!variantsResponse?.data) return;

    if (page === 1) {
      setAccumulatedVariants(variantsResponse.data);
    } else {
      setAccumulatedVariants((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newItems = variantsResponse.data.filter((p) => !existingIds.has(p.id));
        return [...prev, ...newItems];
      });
    }
  }, [variantsResponse?.data, page]);

  // Derive displayed variants: on page 1 always prioritize variantsResponse.data directly
  const displayedVariants = useMemo(() => {
    if (page === 1 && variantsResponse?.data) {
      return variantsResponse.data;
    }
    return accumulatedVariants;
  }, [page, variantsResponse?.data, accumulatedVariants]);

  // Infinite Scroll IntersectionObserver sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (
          first.isIntersecting &&
          meta &&
          page < meta.totalPages &&
          !isFetching &&
          !isLoading
        ) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: "250px" }
    );

    const currentSentinel = sentinelRef.current;
    observer.observe(currentSentinel);

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
      observer.disconnect();
    };
  }, [meta, page, isFetching, isLoading]);

  // Category Selection (Multi-select)
  const handleCategorySelect = (categoryIds: string[]) => {
    setSelectedCategoryIds(categoryIds);
    setPage(1);
  };

  // Product Selection under Category (Multi-select)
  const handleProductSelect = (productIds: string[]) => {
    setSelectedProductIds(productIds);
    setPage(1);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch("");
    setSortKey("createdAt_desc");
    setSelectedCategoryIds([]);
    setSelectedProductIds([]);
    setStockStatus("all");
    setMinPrice(0);
    setMaxPrice(1000);
    setPage(1);
    refetch();
  };

  const hasActiveFilters =
    Boolean(search.trim()) ||
    selectedCategoryIds.length > 0 ||
    selectedProductIds.length > 0 ||
    stockStatus !== "all" ||
    minPrice > 0 ||
    maxPrice < 1000 ||
    sortKey !== "createdAt_desc";

  const activeFilterCount = [
    Boolean(search.trim()),
    selectedCategoryIds.length > 0,
    selectedProductIds.length > 0,
    stockStatus !== "all",
    minPrice > 0 || maxPrice < 1000,
    sortKey !== "createdAt_desc",
  ].filter(Boolean).length;

  const hasMorePages = meta ? page < meta.totalPages : false;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero / Header Banner */}
      <div className="border-b border-[#EDEDED] bg-gradient-to-b from-[#FFFFFF] via-[#FAFAFA] to-[#F5F5F5] py-8 sm:py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Breadcrumb navigation */}
          <nav className="flex items-center justify-center gap-2 text-xs sm:text-sm text-[#5A5A5A] mb-3">
            <Link href="/" className="hover:text-[#007F06] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#5A5A5A]">
              Products
            </span>
            {selectedCategoryIds.length === 1 && currentCategory && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="font-bold text-[#101010]">
                  {currentCategory.name}
                </span>
              </>
            )}
            {selectedCategoryIds.length > 1 && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="font-bold text-[#101010]">
                  {selectedCategoryIds.length} Categories
                </span>
              </>
            )}
          </nav>

          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#007F06]/10 text-[#007F06] text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="h-3.5 w-3.5 text-[#F8BE15]" />
              Authentic Collection
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#101010] font-serif tracking-tight">
              {pageTitle}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#5A5A5A] max-w-2xl mx-auto leading-relaxed">
              Authentic Kolli Hills spices, single-origin produce, and pure hill harvests cultivated with sustainable farming.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full bg-white">
        <div className="container mx-auto px-4 py-6 sm:py-10 max-w-7xl bg-white">
          {/* Mobile Filter Toggle Button */}
          <div className="lg:hidden mb-6 flex items-center justify-between gap-3 bg-white border border-[#E5E5E5] rounded-xl p-3 shadow-xs">
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#007F06] text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-4.5 h-4.5 rounded-full bg-[#F8BE15] text-[#101010] font-black text-[10px] flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <span className="text-xs text-[#5A5A5A] font-medium">
              Showing <strong className="text-[#101010]">{meta?.total ?? displayedVariants.length}</strong> products
            </span>
          </div>

          {/* 2-Column Layout: Left FilterSidebar, Right Products Grid */}
          <div className="flex flex-col lg:flex-row items-start gap-8">
            {/* Left Sticky FilterSidebar */}
            <FilterSidebar
              categories={categories}
              isLoadingCategories={isLoadingCategories && categories.length === 0}
              selectedCategoryIds={selectedCategoryIds}
              onSelectCategories={handleCategorySelect}
              selectedProductIds={selectedProductIds}
              onSelectProducts={handleProductSelect}
              searchQuery={search}
              onSearchChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              sortKey={sortKey}
              onSortChange={(val) => {
                setSortKey(val);
                setPage(1);
              }}
              stockStatus={stockStatus}
              onStockStatusChange={(val) => {
                setStockStatus(val);
                setPage(1);
              }}
              minPriceLimit={0}
              maxPriceLimit={1000}
              currentMinPrice={minPrice}
              currentMaxPrice={maxPrice}
              onPriceChange={(min, max) => {
                setMinPrice(min);
                setMaxPrice(max);
                setPage(1);
              }}
              onResetFilters={handleResetFilters}
              hasActiveFilters={hasActiveFilters}
              isMobileOpen={isMobileFilterOpen}
              onCloseMobile={() => setIsMobileFilterOpen(false)}
              totalResultsCount={meta?.total}
            />

            {/* Right Main Products Display (3 cards per row) */}
            <div className="flex-1 min-w-0 w-full min-h-[600px]">
              {/* Header info bar */}
              <div className="hidden lg:flex items-center justify-between mb-6 pb-3 border-b border-[#E5E5E5]">
                <p className="text-sm text-[#5A5A5A]">
                  Showing{" "}
                  <strong className="text-[#101010]">
                    {meta?.total ?? displayedVariants.length}
                  </strong>{" "}
                  authentic {meta?.total === 1 ? "product" : "products"}
                  {currentCategory && (
                    <>
                      {" "}in <strong className="text-[#007F06] font-bold">{currentCategory.name}</strong>
                    </>
                  )}
                  {selectedProductIds.length > 0 && (
                    <span className="ml-2 text-xs bg-[#F5F5F5] text-[#007F06] px-2 py-0.5 rounded-full font-semibold">
                      {selectedProductIds.length === 1
                        ? "1 Product filtered"
                        : `${selectedProductIds.length} Products filtered`}
                    </span>
                  )}
                </p>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-[#007F06] hover:underline cursor-pointer transition-colors"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>

              {/* Error State */}
              {error && (
                <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-8 text-center max-w-md mx-auto my-8 shadow-xs">
                  <h3 className="text-base font-bold text-[#101010] mb-2">
                    Unable to load products
                  </h3>
                  <p className="text-xs text-[#5A5A5A] mb-4">
                    We encountered a connection issue fetching the product catalog.
                  </p>
                  <Button
                    onClick={() => refetch()}
                    className="h-9 px-5 rounded-xl bg-[#007F06] hover:bg-[#005A04] text-white text-xs font-bold cursor-pointer"
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Content Area: Full Skeleton ONLY on initial load when no products exist yet */}
              {isLoading && displayedVariants.length === 0 ? (
                <ProductCatalogSkeleton />
              ) : (
                <div className={cn("transition-opacity duration-200", isFetching && page === 1 && "opacity-60 pointer-events-none")}>
                  {isFetching && page === 1 && (
                    <div className="h-1 w-full bg-emerald-100 overflow-hidden rounded-full mb-4 animate-in fade-in">
                      <div className="h-full bg-[#007F06] animate-pulse w-full" />
                    </div>
                  )}

                  <CustomerProductGrid
                    variants={displayedVariants}
                    columns={3}
                    onResetFilters={hasActiveFilters ? handleResetFilters : undefined}
                  />

                  {/* Shimmer cards appended at the bottom while next infinite scroll page loads */}
                  {isFetching && page > 1 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mt-6 animate-in fade-in duration-200">
                      {[1, 2, 3].map((n) => (
                        <div
                          key={`append-skel-${n}`}
                          className="bg-white rounded-2xl border border-[#E5E5E5]/80 p-3.5 flex flex-col justify-between overflow-hidden shadow-2xs space-y-3"
                        >
                          <div className="relative aspect-square w-full rounded-xl skeleton-shimmer overflow-hidden bg-neutral-100" />
                          <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="h-3 w-20 rounded skeleton-shimmer bg-neutral-100" />
                              <div className="h-4.5 w-10 rounded skeleton-shimmer bg-neutral-100" />
                            </div>
                            <div className="h-4.5 w-36 rounded skeleton-shimmer bg-neutral-100" />
                          </div>
                          <div className="h-10 w-full rounded-xl skeleton-shimmer bg-[#F8BE15]/20" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Infinite Scroll Sentinel & Loading Indicator */}
                  <div
                    ref={sentinelRef}
                    className="h-16 flex items-center justify-center my-6"
                  >
                    {isFetching && page > 1 && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E5E5E5] shadow-xs text-xs font-bold text-[#007F06] animate-in fade-in">
                        <Loader2 className="w-4 h-4 animate-spin text-[#007F06]" />
                        Loading more products...
                      </div>
                    )}

                    {!hasMorePages && displayedVariants.length > 0 && !isFetching && (
                      <p className="text-xs font-semibold text-[#8A8A8A] select-none">
                        ✦ You have viewed all {displayedVariants.length} products ✦
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
