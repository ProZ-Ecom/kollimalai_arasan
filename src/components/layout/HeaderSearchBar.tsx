"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Clock,
  TrendingUp,
  Folder,
  Package,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  useCustomerCatalogSearch,
  useCustomerPopularSearches,
} from "@/features/customers/hooks/use-customer-catalog";
import { customerCatalogApi } from "@/features/customers/api/customer-catalog.api";
import { resolveCategoryIcon } from "./CategoryNavDropdown";
import { ProductImage } from "@/components/common/ProductImage";
import { formatPrice } from "@/lib/utils";
import { formatMeasurementLabel } from "@/features/variants/utils/measurement.util";
import { useClickOutside } from "@/hooks/useClickOutside";

const RECENT_SEARCHES_KEY = "kollimalai_recent_searches";
const MAX_RECENT_SEARCHES = 5;

const POPULAR_FALLBACK_TAGS = [
  "Black Pepper",
  "Cardamom",
  "Millets",
  "Cold Pressed Oil",
  "Honey",
  "Traditional Rice",
];

export function HeaderSearchBar({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedTerm, setDebouncedTerm] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useClickOutside([containerRef], () => {
    setIsOpen(false);
  });

  // Load recent searches from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, []);

  // Debounce search input by 250ms
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Catalog live search query
  const isSearchActive = debouncedTerm.length >= 2;
  const {
    data: searchResults,
    isLoading: isSearching,
  } = useCustomerCatalogSearch(debouncedTerm, {
    enabled: isOpen && isSearchActive,
  });

  // Popular searches API
  const { data: popularData } = useCustomerPopularSearches(8, {
    enabled: isOpen && !isSearchActive,
  });

  const popularTags = React.useMemo(() => {
    if (popularData?.popularSearches && popularData.popularSearches.length > 0) {
      return popularData.popularSearches.map((s) => s.keyword).slice(0, 6);
    }
    return POPULAR_FALLBACK_TAGS;
  }, [popularData]);

  const saveRecentSearch = React.useCallback((term: string) => {
    const clean = term.trim();
    if (!clean) return;
    try {
      setRecentSearches((prev) => {
        const filtered = prev.filter((t) => t.toLowerCase() !== clean.toLowerCase());
        const updated = [clean, ...filtered].slice(0, MAX_RECENT_SEARCHES);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch {
      // Ignore
    }
  }, []);

  const removeRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setRecentSearches((prev) => {
        const updated = prev.filter((t) => t !== term);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch {
      // Ignore
    }
  };

  const handleSelectQuery = (term: string) => {
    setSearchTerm(term);
    setDebouncedTerm(term);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    saveRecentSearch(q);
    customerCatalogApi.trackSearchVisit({
      keyword: q,
      type: "search",
    });
    setIsOpen(false);
    inputRef.current?.blur();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleNavigateToCategory = (catId: string, catName: string) => {
    if (searchTerm.trim()) saveRecentSearch(searchTerm.trim());
    customerCatalogApi.trackSearchVisit({
      keyword: catName,
      type: "category",
      entityId: catId,
    });
    setIsOpen(false);
    router.push(`/categories/${catId}`);
  };

  const handleNavigateToProduct = (productId: string, variantId: string, name: string) => {
    if (searchTerm.trim()) saveRecentSearch(searchTerm.trim());
    customerCatalogApi.trackSearchVisit({
      keyword: name,
      type: "variant",
      entityId: variantId,
    });
    setIsOpen(false);
    router.push(`/products/${productId}?variant=${variantId}`);
  };

  const categories = searchResults?.categories ?? [];
  const products = searchResults?.products ?? [];
  const items = searchResults?.items ?? [];
  const hasResults = categories.length > 0 || products.length > 0 || items.length > 0;

  return (
    <div ref={containerRef} className={`relative flex-1 max-w-[620px] mx-auto ${className}`}>
      {/* Search Input Bar */}
      <form onSubmit={handleSubmit} className="relative">
        <label htmlFor="site-search" className="sr-only">
          Search products
        </label>
        <input
          ref={inputRef}
          id="site-search"
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsOpen(false);
              inputRef.current?.blur();
            }
          }}
          placeholder="Search products, spices, millets, honey..."
          autoComplete="off"
          className="w-full h-10 lg:h-11 rounded-full bg-white pl-5 pr-20 text-sm text-theme-text-primary placeholder:text-theme-text-muted shadow-sm ring-1 ring-transparent hover:ring-2 hover:ring-white/70 focus:ring-2 focus:ring-white focus:outline-none transition-all"
        />

        {/* Action Controls in Bar: Clear & Search Button */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchTerm.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setDebouncedTerm("");
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            aria-label="Search"
            className="grid place-items-center w-9 h-9 rounded-full text-theme-text-primary hover:bg-secondary-50 hover:text-secondary-600 transition-colors cursor-pointer"
          >
            {isSearching ? (
              <Loader2 className="w-[18px] h-[18px] animate-spin text-secondary-600" />
            ) : (
              <Search className="w-[18px] h-[18px]" strokeWidth={2} />
            )}
          </button>
        </div>
      </form>

      {/* Floating Live Search Dropdown Panel */}
      {isOpen && (
        <div
          className="
            absolute top-full left-0 right-0 mt-2 z-50
            bg-white rounded-2xl border border-neutral-200
            shadow-[0_12px_40px_rgba(0,0,0,0.14)]
            overflow-hidden animate-in fade-in zoom-in-95 duration-150
          "
        >
          {/* STATE 1: Empty Query State - Show Recent & Popular searches */}
          {!isSearchActive && (
            <div className="p-4 space-y-4 max-h-[380px] overflow-y-auto scrollbar-thin">
              {recentSearches.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-secondary-600" />
                    <span>Recent Searches</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((term) => (
                      <span
                        key={term}
                        onClick={() => handleSelectQuery(term)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-secondary-50 hover:text-secondary-700 text-xs font-medium text-neutral-700 cursor-pointer transition-colors"
                      >
                        <span>{term}</span>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(term, e)}
                          className="hover:text-neutral-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  <TrendingUp className="w-3.5 h-3.5 text-secondary-600" />
                  <span>Popular Searches</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {popularTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleSelectQuery(tag)}
                      className="px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-secondary-50 hover:text-secondary-700 text-xs font-medium text-neutral-700 cursor-pointer transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: Actively Searching / Loading */}
          {isSearchActive && isSearching && !searchResults && (
            <div className="p-6 text-center space-y-2 text-neutral-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-secondary-600" />
              <p className="text-xs">Searching for &ldquo;{debouncedTerm}&rdquo;...</p>
            </div>
          )}

          {/* STATE 3: No Results Found (e.g. jhgjhg) */}
          {isSearchActive && !isSearching && !hasResults && (
            <div className="p-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center mx-auto">
                <Search className="w-5 h-5 text-neutral-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900">
                  No products found for &ldquo;{debouncedTerm}&rdquo;
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Check your spelling or try popular items below
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                {POPULAR_FALLBACK_TAGS.slice(0, 5).map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleSelectQuery(term)}
                    className="px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-secondary-50 hover:text-secondary-700 text-xs font-medium text-neutral-700 cursor-pointer transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STATE 4: Matched Search Results */}
          {isSearchActive && hasResults && (
            <div className="max-h-[420px] overflow-y-auto scrollbar-thin divide-y divide-neutral-100">
              {/* Category Matches */}
              {categories.length > 0 && (
                <div className="p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-2">
                    <Folder className="w-3 h-3 text-secondary-600" />
                    <span>Categories</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {categories.map((cat) => {
                      const icon = resolveCategoryIcon(cat);
                      return (
                        <div
                          key={cat.id}
                          onClick={() => handleNavigateToCategory(cat.id, cat.name)}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary-50 cursor-pointer transition-colors group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-white border border-neutral-200 flex items-center justify-center p-1 shrink-0">
                            <Image
                              src={icon}
                              alt={cat.name}
                              width={20}
                              height={20}
                              className="w-4 h-4 object-contain"
                            />
                          </div>
                          <span className="text-xs font-bold text-neutral-800 group-hover:text-secondary-700 truncate">
                            {cat.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Product & Variant Item Matches */}
              {(items.length > 0 || products.length > 0) && (
                <div className="p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-2">
                    <Package className="w-3 h-3 text-secondary-600" />
                    <span>Products</span>
                  </div>
                  <div className="space-y-1">
                    {items.slice(0, 6).map((item) => {
                      const measurement =
                        typeof item.measurement === "string"
                          ? item.measurement
                          : formatMeasurementLabel(item.measurement as any);

                      return (
                        <div
                          key={item.id}
                          onClick={() =>
                            handleNavigateToProduct(
                              item.productId,
                              item.id,
                              item.variantName || item.productName
                            )
                          }
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-secondary-50/70 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg border border-neutral-200 overflow-hidden shrink-0 bg-stone-50">
                              <ProductImage
                                src={item.primaryImage}
                                alt={item.variantName || item.productName}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-neutral-900 group-hover:text-secondary-700 truncate">
                                  {item.variantName || item.productName}
                                </span>
                                {measurement && (
                                  <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-600 px-1.5 py-0.2 rounded shrink-0">
                                    {measurement}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-neutral-500 truncate">
                                {item.productName}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 ml-3">
                            <span className="text-xs font-bold text-secondary-700">
                              {formatPrice(item.salePrice || item.basePrice)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Bar: View All Results */}
          {isSearchActive && hasResults && (
            <div className="p-2.5 bg-neutral-50 border-t border-neutral-200 text-center">
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="w-full py-1.5 text-xs font-bold text-secondary-700 hover:text-secondary-800 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View all results for &ldquo;{debouncedTerm}&rdquo;</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default HeaderSearchBar;
