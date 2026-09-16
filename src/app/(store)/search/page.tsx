"use client";

import { Suspense, useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Sparkles, ChevronRight, SlidersHorizontal, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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

function SearchCatalogSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-5 sm:gap-6 animate-in fade-in duration-200">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
        <div
          key={n}
          className="bg-white rounded-2xl border border-[#E8D9CD]/80 p-3.5 flex flex-col justify-between overflow-hidden shadow-2xs space-y-3"
        >
          <div className="relative aspect-square w-full rounded-xl skeleton-shimmer overflow-hidden bg-stone-100" />
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between gap-2">
              <div className="h-3 w-20 rounded skeleton-shimmer bg-stone-100" />
              <div className="flex gap-1">
                <div className="h-4.5 w-10 rounded skeleton-shimmer bg-stone-100" />
                <div className="h-4.5 w-10 rounded skeleton-shimmer bg-stone-100" />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <div className="h-4.5 w-36 rounded skeleton-shimmer bg-stone-100" />
              <div className="h-4.5 w-14 rounded skeleton-shimmer bg-stone-100" />
            </div>
          </div>
          <div className="h-10 w-full rounded-xl skeleton-shimmer bg-[#F8BE15]/20" />
        </div>
      ))}
    </div>
  );
}

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(initialQuery);
  const [sortKey, setSortKey] = useState("createdAt_desc");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [stockStatus, setStockStatus] = useState<"all" | "in_stock" | "out_of_stock">("all");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sync state if URL query param changes
  useEffect(() => {
    const q = searchParams.get("q") || "";
    setSearch(q);
    setPage(1);
  }, [searchParams]);

  // Accumulated variants for Infinite Scroll
  const [accumulatedVariants, setAccumulatedVariants] = useState<CustomerVariantListItemDto[]>([]);

  // Fetch all categories for filter sidebar
  const { data: categoriesData, isLoading: isLoadingCategories } = useCustomerCategories({ pageSize: 250 });
  const categories = categoriesData?.data ?? [];

  // Active sort config
  const activeSort = useMemo(() => {
    return SORT_OPTIONS.find((s) => s.value === sortKey) ?? SORT_OPTIONS[0];
  }, [sortKey]);

  const inStockParam =
    stockStatus === "in_stock" ? true : stockStatus === "out_of_stock" ? false : undefined;

  // Query variants matching search term and filters
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
  });

  const meta = variantsResponse?.meta;

  // Infinite scroll accumulator
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

  const displayedVariants = useMemo(() => {
    if (page === 1 && variantsResponse?.data) {
      return variantsResponse.data;
    }
    return accumulatedVariants;
  }, [page, variantsResponse?.data, accumulatedVariants]);

  // Catalog container ref for smooth scroll
  const catalogContentRef = useRef<HTMLDivElement>(null);
  const scrollToCatalogTop = () => {
    if (typeof window === "undefined" || !catalogContentRef.current) return;
    const rect = catalogContentRef.current.getBoundingClientRect();
    if (rect.top < 80) {
      const targetY = window.scrollY + rect.top - 90;
      window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
    }
  };

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
          !isLoading &&
          displayedVariants.length < (meta.total ?? 0)
        ) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: "150px" }
    );

    const currentSentinel = sentinelRef.current;
    observer.observe(currentSentinel);

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
      observer.disconnect();
    };
  }, [meta, page, isFetching, isLoading, displayedVariants.length]);

  const handleCategorySelect = (categoryIds: string[]) => {
    setSelectedCategoryIds(categoryIds);
    setPage(1);
    scrollToCatalogTop();
  };

  const handleProductSelect = (productIds: string[]) => {
    setSelectedProductIds(productIds);
    setPage(1);
    scrollToCatalogTop();
  };

  const hasActiveFilters =
    Boolean(search.trim()) ||
    selectedCategoryIds.length > 0 ||
    selectedProductIds.length > 0 ||
    stockStatus !== "all" ||
    minPrice > 0 ||
    maxPrice < 1000 ||
    sortKey !== "createdAt_desc";

  const handleResetFilters = () => {
    setSearch("");
    setSortKey("createdAt_desc");
    setSelectedCategoryIds([]);
    setSelectedProductIds([]);
    setStockStatus("all");
    setMinPrice(0);
    setMaxPrice(1000);
    setPage(1);
    scrollToCatalogTop();
  };

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
      <div className="border-b border-[#F0E4D8] bg-gradient-to-b from-[#FFFDF9] via-[#FAF4ED] to-[#F5ECE1] py-8 sm:py-12">
        <div className="w-full max-w-7xl 2xl:max-w-[1600px] 3xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb navigation */}
          <nav className="flex items-center justify-center gap-2 text-xs sm:text-sm text-[#7A6258] mb-3">
            <Link href="/" className="hover:text-[#7A2224] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/products" className="hover:text-[#7A2224] transition-colors">
              Products
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-bold text-[#2D1810]">
              Search Results
            </span>
          </nav>

          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#7A2224]/10 text-[#7A2224] text-xs font-bold uppercase tracking-wider mb-2">
              <Search className="h-3.5 w-3.5 text-[#F8BE15]" />
              Catalog Search
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#2D1810] font-serif tracking-tight">
              {search.trim() ? (
                <>Results for &ldquo;{search}&rdquo;</>
              ) : (
                "Search All Snacks"
              )}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#7A6258] max-w-2xl mx-auto leading-relaxed">
              Discover authentic handmade South Indian murukku, savories, and traditional sweets crafted with pure ingredients.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full bg-white">
        <div className="w-full max-w-7xl 2xl:max-w-[1600px] 3xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 bg-white">
          {/* Mobile Filter Toggle Button */}
          <div className="lg:hidden mb-6 flex items-center justify-between gap-3 bg-white border border-[#E8D9CD] rounded-xl p-3 shadow-xs">
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7A2224] text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-4.5 h-4.5 rounded-full bg-[#F8BE15] text-[#2D1810] font-black text-[10px] flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <span className="text-xs text-[#7A6258] font-medium">
              Showing <strong className="text-[#2D1810]">{meta?.total ?? displayedVariants.length}</strong> snacks
            </span>
          </div>

          {/* 2-Column Layout: Left FilterSidebar, Right Products Grid */}
          <div className="flex flex-col lg:flex-row items-start gap-8">
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
                scrollToCatalogTop();
              }}
              sortKey={sortKey}
              onSortChange={(val) => {
                setSortKey(val);
                setPage(1);
                scrollToCatalogTop();
              }}
              stockStatus={stockStatus}
              onStockStatusChange={(val) => {
                setStockStatus(val);
                setPage(1);
                scrollToCatalogTop();
              }}
              minPriceLimit={0}
              maxPriceLimit={1000}
              currentMinPrice={minPrice}
              currentMaxPrice={maxPrice}
              onPriceChange={(min, max) => {
                setMinPrice(min);
                setMaxPrice(max);
                setPage(1);
                scrollToCatalogTop();
              }}
              onResetFilters={handleResetFilters}
              hasActiveFilters={hasActiveFilters}
              isMobileOpen={isMobileFilterOpen}
              onCloseMobile={() => setIsMobileFilterOpen(false)}
              totalResultsCount={meta?.total}
            />

            <div ref={catalogContentRef} className="flex-1 min-w-0 w-full min-h-[750px] lg:min-h-[850px]">
              {/* Header info bar */}
              <div className="hidden lg:flex items-center justify-between mb-6 pb-3 border-b border-neutral-200">
                <p className="text-sm text-neutral-600">
                  Showing{" "}
                  <strong className="text-neutral-900">
                    {meta?.total ?? displayedVariants.length}
                  </strong>{" "}
                  {meta?.total === 1 ? "product" : "products"}
                  {search.trim() && (
                    <>
                      {" "}matching &ldquo;<strong className="text-secondary-700">{search}</strong>&rdquo;
                    </>
                  )}
                </p>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-secondary-600 hover:text-secondary-700 hover:underline cursor-pointer transition-colors"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>

              {/* Error State */}
              {error && (
                <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center max-w-md mx-auto my-8 shadow-xs">
                  <h3 className="text-base font-bold text-neutral-900 mb-2">
                    Unable to load search results
                  </h3>
                  <p className="text-xs text-neutral-600 mb-4">
                    We encountered a connection issue fetching the search catalog.
                  </p>
                  <Button
                    onClick={() => refetch()}
                    className="h-9 px-5 rounded-xl bg-secondary-600 hover:bg-secondary-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Empty Results State */}
              {!isLoading && !error && displayedVariants.length === 0 && (
                <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center max-w-md mx-auto my-8 shadow-xs space-y-4">
                  <div className="w-12 h-12 rounded-full bg-secondary-50 text-secondary-600 border border-secondary-100 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6 text-secondary-600/70" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">
                      No products found
                    </h3>
                    <p className="mt-1 text-xs text-neutral-600 leading-relaxed">
                      We could not find any products matching your search criteria. Try adjusting your search keywords or clearing active filters.
                    </p>
                  </div>
                  <div className="flex justify-center gap-2 pt-2">
                    <Button
                      onClick={handleResetFilters}
                      className="h-9 px-4 rounded-xl bg-secondary-600 hover:bg-secondary-700 text-white text-xs font-bold cursor-pointer"
                    >
                      Clear Filters
                    </Button>
                    <Link href="/products">
                      <Button
                        variant="outline"
                        className="h-9 px-4 rounded-xl border-neutral-200 text-secondary-700 hover:bg-neutral-50 text-xs font-bold cursor-pointer"
                      >
                        Browse All Products
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Content Area: Skeleton or Grid */}
              {isLoading && displayedVariants.length === 0 ? (
                <SearchCatalogSkeleton />
              ) : displayedVariants.length > 0 ? (
                <div className={isFetching && page === 1 ? "opacity-60 transition-opacity duration-200" : "transition-opacity duration-200"}>
                  <CustomerProductGrid
                    variants={displayedVariants}
                    columns={3}
                    onResetFilters={hasActiveFilters ? handleResetFilters : undefined}
                  />

                  {isFetching && page > 1 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-5 sm:gap-6 mt-6 animate-in fade-in duration-200">
                      {[1, 2, 3, 4].map((n) => (
                        <div
                          key={`append-skel-${n}`}
                          className="bg-white rounded-2xl border border-[#E8D9CD]/80 p-3.5 flex flex-col justify-between overflow-hidden shadow-2xs space-y-3"
                        >
                          <div className="relative aspect-square w-full rounded-xl skeleton-shimmer overflow-hidden bg-stone-100" />
                          <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="h-3 w-20 rounded skeleton-shimmer bg-stone-100" />
                              <div className="h-4.5 w-10 rounded skeleton-shimmer bg-stone-100" />
                            </div>
                            <div className="h-4.5 w-36 rounded skeleton-shimmer bg-stone-100" />
                          </div>
                          <div className="h-10 w-full rounded-xl skeleton-shimmer bg-[#F8BE15]/20" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Infinite Scroll Sentinel */}
                  <div
                    ref={sentinelRef}
                    className="h-16 flex items-center justify-center my-6"
                  >
                    {isFetching && page > 1 && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E8D9CD] shadow-xs text-xs font-bold text-[#7A2224] animate-in fade-in">
                        <Loader2 className="w-4 h-4 animate-spin text-[#7A2224]" />
                        Loading more snacks...
                      </div>
                    )}

                    {!hasMorePages && displayedVariants.length > 0 && !isFetching && (
                      <p className="text-xs font-semibold text-[#9C8274] select-none">
                        ✦ You have viewed all {displayedVariants.length} snacks ✦
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchCatalogSkeleton />}>
      <SearchResultsContent />
    </Suspense>
  );
}
