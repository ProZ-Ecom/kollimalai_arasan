"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  X,
  Clock,
  ArrowRight,
  TrendingUp,
  Folder,
  Package,
  Layers,
  Sparkles,
  AlertCircle,
  CornerDownLeft,
} from "lucide-react";
import {
  useCustomerCatalogSearch,
  useCustomerPopularSearches,
} from "@/features/customers/hooks/use-customer-catalog";
import { customerCatalogApi } from "@/features/customers/api/customer-catalog.api";
import { resolveCategoryIcon } from "@/components/layout/CategoryNavDropdown";
import { ProductImage } from "@/components/common/ProductImage";
import { formatPrice } from "@/lib/utils";
import { formatMeasurementLabel } from "@/features/variants/utils/measurement.util";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type {
  CustomerCategoryDto,
  CustomerProductListItemDto,
  CustomerVariantListItemDto,
} from "@/features/customers/types/catalog.types";

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const RECENT_SEARCHES_KEY = "kollimalai_recent_searches";
const MAX_RECENT_SEARCHES = 6;

type SearchResultItem =
  | { type: "category"; data: CustomerCategoryDto }
  | { type: "product"; data: CustomerProductListItemDto }
  | { type: "item"; data: CustomerVariantListItemDto };

export function GlobalSearchModal({ isOpen, onClose, initialQuery = "" }: GlobalSearchModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState(initialQuery);
  const [debouncedTerm, setDebouncedTerm] = React.useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const resultsContainerRef = React.useRef<HTMLDivElement>(null);

  // Mount check for createPortal
  React.useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Debounce user input by 350ms
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
      setSelectedIndex(-1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Lock body scroll when open, initialize query & focus input
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (initialQuery) {
        setSearchTerm(initialQuery);
        setDebouncedTerm(initialQuery);
      }
      const focusTimer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          if (initialQuery) {
            inputRef.current.setSelectionRange(initialQuery.length, initialQuery.length);
          }
        }
      }, 50);
      return () => {
        clearTimeout(focusTimer);
        document.body.style.overflow = "unset";
      };
    } else {
      document.body.style.overflow = "unset";
      setSearchTerm("");
      setDebouncedTerm("");
      setSelectedIndex(-1);
    }
  }, [isOpen, initialQuery]);

  // Catalog search query
  const isSearchActive = debouncedTerm.trim().length >= 2;
  const {
    data: searchResults,
    isLoading: isSearching,
    isError,
    refetch,
  } = useCustomerCatalogSearch(debouncedTerm, {
    enabled: isOpen && isSearchActive,
  });

  // Dynamic popular searches & popular categories (tracked from user visits, with new items fallback)
  const { data: popularData, isLoading: isLoadingPopular } = useCustomerPopularSearches(10, {
    enabled: isOpen,
  });
  const popularSearches = popularData?.popularSearches ?? [];
  const popularCategories = popularData?.popularCategories ?? [];

  // Flattened results for keyboard navigation
  const flattenedResults: SearchResultItem[] = React.useMemo(() => {
    if (!searchResults || !isSearchActive) return [];
    const list: SearchResultItem[] = [];
    searchResults.categories.forEach((cat) => list.push({ type: "category", data: cat }));
    searchResults.products.forEach((prod) => list.push({ type: "product", data: prod }));
    searchResults.items.forEach((item) => list.push({ type: "item", data: item }));
    return list;
  }, [searchResults, isSearchActive]);

  // Save recent search
  const saveRecentSearch = React.useCallback((term: string) => {
    const clean = term.trim();
    if (!clean) return;
    try {
      setRecentSearches((prev) => {
        const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
        const updated = [clean, ...filtered].slice(0, MAX_RECENT_SEARCHES);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch {
      // Ignore localStorage error
    }
  }, []);

  const removeRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setRecentSearches((prev) => {
        const updated = prev.filter((item) => item !== term);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch {
      // Ignore
    }
  };

  const clearAllRecent = () => {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch {
      // Ignore
    }
  };

  // Navigation handlers with telemetry tracking
  const handleNavigateToResult = (item: SearchResultItem) => {
    if (searchTerm.trim()) {
      saveRecentSearch(searchTerm.trim());
      customerCatalogApi.trackSearchVisit({
        keyword: searchTerm.trim(),
        type: "search",
      });
    }
    onClose();

    if (item.type === "category") {
      customerCatalogApi.trackSearchVisit({
        keyword: item.data.name,
        type: "category",
        entityId: item.data.id,
      });
      router.push(`/categories/${item.data.id}`);
    } else if (item.type === "product") {
      customerCatalogApi.trackSearchVisit({
        keyword: item.data.name,
        type: "product",
        entityId: item.data.id,
      });
      const categoryId = item.data.category?.id;
      if (categoryId) {
        router.push(`/categories/${categoryId}?productId=${item.data.id}`);
      } else {
        router.push(`/products?productId=${item.data.id}`);
      }
    } else if (item.type === "item") {
      customerCatalogApi.trackSearchVisit({
        keyword: item.data.variantName || item.data.productName,
        type: "variant",
        entityId: item.data.id,
      });
      router.push(`/products/${item.data.productId}?variant=${item.data.id}`);
    }
  };

  const handleNavigateToAllResults = (queryToUse?: string) => {
    const q = (queryToUse || searchTerm).trim();
    if (!q) return;
    saveRecentSearch(q);
    customerCatalogApi.trackSearchVisit({
      keyword: q,
      type: "search",
    });
    onClose();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handlePopularSearchClick = (keyword: string) => {
    setSearchTerm(keyword);
    setDebouncedTerm(keyword);
    customerCatalogApi.trackSearchVisit({
      keyword,
      type: "search",
    });
  };

  const handlePopularCategoryClick = (cat: { id: string; name: string }) => {
    customerCatalogApi.trackSearchVisit({
      keyword: cat.name,
      type: "category",
      entityId: cat.id,
    });
    onClose();
    router.push(`/categories/${cat.id}`);
  };

  // Keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (flattenedResults.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < flattenedResults.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : flattenedResults.length - 1
          );
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < flattenedResults.length) {
            handleNavigateToResult(flattenedResults[selectedIndex]);
          } else if (searchTerm.trim().length >= 2) {
            handleNavigateToAllResults();
          }
        }
      } else if (e.key === "Enter" && searchTerm.trim().length >= 2) {
        e.preventDefault();
        handleNavigateToAllResults();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, flattenedResults, selectedIndex, searchTerm, onClose]);

  // Keep highlighted item in view during keyboard arrow navigation
  React.useEffect(() => {
    if (selectedIndex < 0 || !resultsContainerRef.current) return;
    const activeEl = resultsContainerRef.current.querySelector(
      `[data-search-index="${selectedIndex}"]`
    );
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  if (!isOpen || !mounted) return null;

  const hasAnyResults =
    searchResults &&
    (searchResults.categories.length > 0 ||
      searchResults.products.length > 0 ||
      searchResults.items.length > 0);

  const isTyping = searchTerm !== debouncedTerm;
  const isLoading = isSearching || isTyping;

  let runningIndex = 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Global Catalog Search"
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Search Modal Card with smooth dynamic height expansion & shrinking */}
      <div
        className="
          relative z-10 w-full sm:max-w-2xl lg:max-w-3xl
          h-full sm:h-auto sm:max-h-[85vh]
          bg-white sm:rounded-2xl border-0 sm:border border-theme-border
          shadow-2xl flex flex-col overflow-hidden
          transition-[max-height,height] duration-300 ease-out
          animate-in zoom-in-95 sm:fade-in-0 duration-200
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar (Header) reusing project Input component */}
        <div className="relative flex items-center px-4 sm:px-6 py-3 sm:py-3.5 border-b border-theme-border bg-theme-surface-warm shrink-0 gap-3">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search black pepper, cardamom, cloves, spices..."
              size="lg"
              leftIcon={<Search className="w-5 h-5 text-theme-primary shrink-0" />}
              rightIcon={
                <div className="flex items-center gap-1.5 shrink-0 pr-1">
                  {isLoading && (
                    <div className="w-4 h-4 rounded-full border-2 border-theme-primary border-t-transparent animate-spin shrink-0" />
                  )}

                  {searchTerm.length > 0 && !isLoading && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSearchTerm("");
                        setDebouncedTerm("");
                        inputRef.current?.focus();
                      }}
                      className="h-7 w-7 rounded-full text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-surface-alt cursor-pointer"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}

                  <div className="hidden sm:flex items-center">
                    <kbd className="px-2 py-0.5 text-[10px] font-semibold text-theme-text-muted bg-theme-surface-alt border border-theme-border rounded-md shadow-2xs">
                      ESC
                    </kbd>
                  </div>
                </div>
              }
              className="w-full bg-white border-theme-border hover:border-theme-border-accent focus:border-theme-primary focus:ring-1 focus:ring-theme-primary text-theme-text-primary placeholder:text-theme-text-muted font-medium text-sm sm:text-base rounded-xl shadow-2xs"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="sm:hidden h-10 w-10 text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-surface-alt shrink-0 rounded-xl"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Modal Scrollable Body with smooth height adaptation */}
        <div
          ref={resultsContainerRef}
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6 scrollbar-thin transition-all duration-300 ease-out min-h-[260px]"
        >
          {/* STATE 1: Empty Query State (Recent, Popular Searches, Popular Categories) */}
          {!isSearchActive && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-theme-text-subtle uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-theme-primary" />
                      <span>Recent Searches</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearAllRecent}
                      className="h-6 px-2 text-[11px] font-semibold text-theme-primary hover:text-theme-primary hover:bg-theme-surface-alt"
                    >
                      Clear all
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <Button
                        key={term}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchTerm(term);
                          setDebouncedTerm(term);
                        }}
                        className="h-8 rounded-full border-theme-border bg-theme-surface-warm hover:bg-theme-surface-alt text-xs font-medium text-theme-text-primary gap-1.5 transition-all shadow-2xs"
                      >
                        <Clock className="w-3 h-3 text-theme-text-muted" />
                        <span>{term}</span>
                        <span
                          role="button"
                          onClick={(e) => removeRecentSearch(term, e)}
                          className="p-0.5 rounded-full hover:bg-theme-border-subtle text-theme-text-muted hover:text-theme-text-primary"
                          aria-label={`Remove ${term}`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches (Top 8-10 counted visits, fallback to newly added products) */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-theme-text-subtle uppercase tracking-wider">
                  <TrendingUp className="w-3.5 h-3.5 text-theme-secondary" />
                  <span>Popular Searches</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {popularSearches.length > 0 ? (
                    popularSearches.slice(0, 10).map((item) => (
                      <Button
                        key={item.keyword}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handlePopularSearchClick(item.keyword)}
                        className="h-8 rounded-full border-theme-border bg-theme-surface-warm hover:bg-theme-surface-alt hover:border-theme-primary/40 text-xs font-semibold text-theme-text-primary gap-1.5 transition-all shadow-2xs cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-theme-secondary" />
                        <span>{item.keyword}</span>
                        {item.count > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-theme-surface-alt text-theme-text-muted font-normal">
                            {item.count} {item.count === 1 ? "visit" : "visits"}
                          </span>
                        )}
                      </Button>
                    ))
                  ) : (
                    <div className="text-xs text-theme-text-muted">Loading popular products...</div>
                  )}
                </div>
              </div>

              {/* Popular Categories (Top 8-10 counted visits, fallback to newly added categories) */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-theme-text-subtle uppercase tracking-wider">
                  <Folder className="w-3.5 h-3.5 text-theme-primary" />
                  <span>Popular Categories</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {popularCategories.slice(0, 8).map((cat) => {
                    const iconSrc = resolveCategoryIcon(cat as any);
                    return (
                      <Button
                        key={cat.id}
                        type="button"
                        variant="outline"
                        onClick={() => handlePopularCategoryClick(cat)}
                        className="h-auto p-2.5 rounded-xl border-theme-border bg-theme-surface-warm hover:bg-theme-surface-alt hover:border-theme-primary/40 flex items-center gap-2.5 text-left transition-all justify-start shadow-2xs cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-theme-surface-alt border border-theme-border flex items-center justify-center shrink-0 overflow-hidden p-1">
                          <Image
                            src={iconSrc}
                            alt={cat.name}
                            width={24}
                            height={24}
                            className="w-full h-full object-contain"
                            unoptimized
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-theme-text-primary truncate block">
                            {cat.name}
                          </span>
                          {cat.count > 0 && (
                            <span className="text-[10px] text-theme-text-muted font-normal block">
                              {cat.count} {cat.count === 1 ? "visit" : "visits"}
                            </span>
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: Loading State */}
          {isSearchActive && isLoading && (
            <div className="py-6 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-theme-text-subtle uppercase tracking-wider">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-theme-primary border-t-transparent animate-spin" />
                <span>Searching catalog...</span>
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-theme-border bg-theme-surface-warm/60 flex items-center gap-3 animate-pulse"
                  >
                    <div className="w-10 h-10 rounded-lg bg-theme-border shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-theme-border rounded w-2/5" />
                      <div className="h-3 bg-theme-border/60 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STATE 3: Error State */}
          {isSearchActive && !isLoading && isError && (
            <div className="py-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-theme-text-primary">
                Search encountered an issue
              </h4>
              <p className="text-xs text-theme-text-muted max-w-xs mx-auto">
                We could not connect to search right now. Please try again.
              </p>
              <Button
                type="button"
                onClick={() => refetch()}
                className="rounded-lg bg-theme-primary text-white text-xs font-bold hover:bg-theme-primary-hover transition-colors cursor-pointer"
              >
                Retry Search
              </Button>
            </div>
          )}

          {/* STATE 4: No Results State */}
          {isSearchActive && !isLoading && !isError && !hasAnyResults && (
            <div className="py-10 text-center space-y-4 animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-full bg-theme-surface-alt text-theme-primary border border-theme-border flex items-center justify-center mx-auto">
                <Search className="w-6 h-6 text-theme-primary/60" />
              </div>
              <div>
                <h3 className="text-base font-bold text-theme-text-primary">
                  No products found for &ldquo;{debouncedTerm}&rdquo;
                </h3>
                <p className="mt-1 text-xs text-theme-text-muted max-w-sm mx-auto leading-relaxed">
                  Check your spelling or try searching for{" "}
                  <strong>Pepper</strong>, <strong>Cardamom</strong>, <strong>Millet</strong>, or <strong>Honey</strong>.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="rounded-lg bg-theme-surface-warm border-theme-border text-xs font-bold text-theme-primary hover:bg-theme-surface-alt cursor-pointer"
                >
                  Clear search
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    onClose();
                    router.push("/products");
                  }}
                  className="rounded-lg bg-theme-primary text-white text-xs font-bold hover:bg-theme-primary-hover cursor-pointer"
                >
                  Browse all products
                </Button>
              </div>
            </div>
          )}

          {/* STATE 5: Live Results Grouped */}
          {isSearchActive && !isLoading && !isError && hasAnyResults && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Group 1: Categories */}
              {searchResults.categories.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-theme-text-subtle uppercase tracking-wider mb-2.5">
                    <Folder className="w-3.5 h-3.5 text-theme-primary" />
                    <span>Categories ({searchResults.categories.length})</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {searchResults.categories.map((category) => {
                      const itemIndex = runningIndex++;
                      const isSelected = selectedIndex === itemIndex;
                      const catIcon = resolveCategoryIcon(category);

                      return (
                        <div
                          key={category.id}
                          data-search-index={itemIndex}
                          onClick={() =>
                            handleNavigateToResult({ type: "category", data: category })
                          }
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          className={`
                            flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer
                            ${isSelected
                              ? "bg-theme-surface-alt border-theme-primary shadow-xs"
                              : "bg-white border-theme-border hover:bg-theme-surface-alt/60"
                            }
                          `}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-theme-surface-alt border border-theme-border flex items-center justify-center p-1 shrink-0">
                              <Image
                                src={catIcon}
                                alt={category.name}
                                width={24}
                                height={24}
                                className="w-5 h-5 object-contain"
                              />
                            </div>
                            <span className="text-xs font-bold text-theme-text-primary truncate capitalize">
                              {category.name}
                            </span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-theme-text-muted shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Group 2: Products */}
              {searchResults.products.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-theme-text-subtle uppercase tracking-wider mb-2.5">
                    <Package className="w-3.5 h-3.5 text-theme-primary" />
                    <span>Products ({searchResults.products.length})</span>
                  </div>

                  <div className="space-y-1.5">
                    {searchResults.products.map((product) => {
                      const itemIndex = runningIndex++;
                      const isSelected = selectedIndex === itemIndex;
                      const hasPriceRange =
                        product.minPrice > 0 &&
                        product.maxPrice > product.minPrice;

                      return (
                        <div
                          key={product.id}
                          data-search-index={itemIndex}
                          onClick={() =>
                            handleNavigateToResult({ type: "product", data: product })
                          }
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          className={`
                            flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer
                            ${isSelected
                              ? "bg-theme-surface-alt border-theme-primary shadow-xs"
                              : "bg-white border-theme-border hover:bg-theme-surface-alt/60"
                            }
                          `}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-lg border border-theme-border overflow-hidden shrink-0 bg-stone-50">
                              <ProductImage
                                src={product.image}
                                alt={product.name}
                                width={44}
                                height={44}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-xs sm:text-sm font-bold text-theme-text-primary truncate capitalize">
                                {product.name}
                              </h5>
                              {product.brand && (
                                <p className="text-[11px] text-theme-text-muted truncate capitalize">
                                  {product.brand.name}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-3 text-right">
                            {product.minPrice > 0 && (
                              <div className="text-xs font-bold text-theme-primary">
                                {hasPriceRange
                                  ? `${formatPrice(product.minPrice)} – ${formatPrice(product.maxPrice)}`
                                  : formatPrice(product.minPrice)}
                              </div>
                            )}
                            <ArrowRight className="w-3.5 h-3.5 text-theme-text-muted" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Group 3: Items / Variants */}
              {searchResults.items.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-theme-text-subtle uppercase tracking-wider mb-2.5">
                    <Layers className="w-3.5 h-3.5 text-theme-primary" />
                    <span>Items &amp; Pack Sizes ({searchResults.items.length})</span>
                  </div>

                  <div className="space-y-1.5">
                    {searchResults.items.map((item) => {
                      const itemIndex = runningIndex++;
                      const isSelected = selectedIndex === itemIndex;
                      const hasDiscount = item.basePrice > item.salePrice && item.salePrice > 0;
                      const measurementLabel =
                        typeof item.measurement === "string"
                          ? item.measurement
                          : formatMeasurementLabel(item.measurement as any);

                      return (
                        <div
                          key={item.id}
                          data-search-index={itemIndex}
                          onClick={() =>
                            handleNavigateToResult({ type: "item", data: item })
                          }
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          className={`
                            flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer
                            ${isSelected
                              ? "bg-theme-surface-alt border-theme-primary shadow-xs"
                              : "bg-white border-theme-border hover:bg-theme-surface-alt/60"
                            }
                          `}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-lg border border-theme-border overflow-hidden shrink-0 bg-stone-50">
                              <ProductImage
                                src={item.primaryImage}
                                alt={item.variantName || item.productName}
                                width={44}
                                height={44}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h5 className="text-xs sm:text-sm font-bold text-theme-text-primary truncate">
                                  {item.variantName || item.productName}
                                </h5>
                                {measurementLabel && (
                                  <span className="text-[10px] font-semibold bg-theme-surface-alt text-theme-primary px-1.5 py-0.5 rounded border border-theme-border shrink-0">
                                    {measurementLabel}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-theme-text-muted truncate">
                                in {item.productName}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-3 text-right">
                            <div>
                              <div className="text-xs font-bold text-theme-primary">
                                {formatPrice(item.salePrice || item.basePrice)}
                              </div>
                              {hasDiscount && (
                                <div className="text-[10px] text-theme-text-muted line-through">
                                  {formatPrice(item.basePrice)}
                                </div>
                              )}
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-theme-text-muted" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Sticky Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-theme-border bg-theme-surface-warm shrink-0 flex items-center justify-between gap-3">
          {isSearchActive && debouncedTerm.trim().length >= 2 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleNavigateToAllResults()}
              className="
                h-8 px-2 inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-theme-primary
                hover:text-theme-primary-hover hover:bg-theme-surface-alt transition-colors cursor-pointer group
              "
            >
              <span>View all matching results for &ldquo;{debouncedTerm}&rdquo;</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Button>
          ) : (
            <span className="text-[11px] text-theme-text-muted">
              Type at least 2 characters to search products
            </span>
          )}

          <div className="hidden sm:flex items-center gap-3 text-[11px] text-theme-text-muted">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-theme-border bg-white font-mono text-[9px] shadow-2xs">
                ↑↓
              </kbd>{" "}
              navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-theme-border bg-white font-mono text-[9px] shadow-2xs">
                <CornerDownLeft className="w-2.5 h-2.5 inline" />
              </kbd>{" "}
              select
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-theme-border bg-white font-mono text-[9px] shadow-2xs">
                ESC
              </kbd>{" "}
              close
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default GlobalSearchModal;
