"use client";

import * as React from "react";
import { Check, Package, PackageSearch, X } from "lucide-react";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/forms/label";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import {
  useOfferCategories,
  useOfferItemTargets,
  useOfferProductTargets,
} from "../hooks";
import type { OfferItemTarget, OfferLevel, OfferProductTarget } from "../types";

interface OfferTargetPickerProps {
  level: OfferLevel;
  categoryId: string;
  onCategoryChange: (categoryId: string) => void;
  productId: string;
  onProductChange: (productId: string) => void;
  selectedProductIds: string[];
  onSelectedProductIdsChange: (ids: string[]) => void;
  selectedItemIds: string[];
  onSelectedItemIdsChange: (ids: string[]) => void;
  /** Items already attached to the offer being edited, so they stay listed. */
  preloadedItems?: OfferItemTarget[];
  preloadedProducts?: OfferProductTarget[];
  error?: string;
  onLoadedItemsChange?: (items: OfferItemTarget[]) => void;
}

/**
 * Category -> Product -> Item/Variant, where each level narrows the next.
 *
 * A product-wise offer supports choosing multiple products.
 * An item-wise offer allows choosing multiple items across products or within a product.
 */
export function OfferTargetPicker({
  level,
  categoryId,
  onCategoryChange,
  productId,
  onProductChange,
  selectedProductIds,
  onSelectedProductIdsChange,
  selectedItemIds,
  onSelectedItemIdsChange,
  preloadedItems = [],
  preloadedProducts = [],
  error,
  onLoadedItemsChange,
}: OfferTargetPickerProps) {
  const [productSearch, setProductSearch] = React.useState("");
  const [itemSearch, setItemSearch] = React.useState("");

  const { data: categories = [], isLoading: categoriesLoading } = useOfferCategories();

  const { data: products = [], isLoading: productsLoading } = useOfferProductTargets({
    categoryId: categoryId || undefined,
    search: productSearch || undefined,
  });

  const { data: items = [], isLoading: itemsLoading } = useOfferItemTargets({
    productId: productId || undefined,
    categoryId: categoryId || undefined,
    search: itemSearch || undefined,
    enabled: level === "item",
  });

  // Persistent cache of known products and items across filter changes and searches
  const productCacheRef = React.useRef<Map<string, OfferProductTarget>>(new Map());
  const itemCacheRef = React.useRef<Map<string, OfferItemTarget>>(new Map());

  React.useEffect(() => {
    products.forEach((p) => productCacheRef.current.set(p.id, p));
  }, [products]);

  React.useEffect(() => {
    items.forEach((i) => itemCacheRef.current.set(i.id, i));
    if (onLoadedItemsChange && items.length > 0) {
      onLoadedItemsChange(items);
    }
  }, [items, onLoadedItemsChange]);

  React.useEffect(() => {
    preloadedProducts.forEach((p) => productCacheRef.current.set(p.id, p));
  }, [preloadedProducts]);

  React.useEffect(() => {
    preloadedItems.forEach((i) => itemCacheRef.current.set(i.id, i));
    if (onLoadedItemsChange && preloadedItems.length > 0) {
      onLoadedItemsChange(preloadedItems);
    }
  }, [preloadedItems, onLoadedItemsChange]);

  const categoryOptions = React.useMemo(
    () => [
      { value: "", label: "All categories" },
      ...categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    ],
    [categories]
  );

  const productOptions = React.useMemo(
    () => [
      { value: "", label: "All products" },
      ...products.map((product) => ({ value: product.id, label: product.name })),
    ],
    [products]
  );

  // Keep already-selected targets visible even when current filters would exclude them
  const visibleProducts = React.useMemo(() => {
    const byId = new Map<string, OfferProductTarget>();
    for (const p of products) {
      byId.set(p.id, p);
    }
    for (const p of preloadedProducts) {
      if (selectedProductIds.includes(p.id)) byId.set(p.id, p);
    }
    for (const id of selectedProductIds) {
      const cached = productCacheRef.current.get(id);
      if (cached && !byId.has(id)) {
        byId.set(id, cached);
      }
    }
    return [...byId.values()];
  }, [products, preloadedProducts, selectedProductIds]);

  const visibleItems = React.useMemo(() => {
    const byId = new Map<string, OfferItemTarget>();
    for (const i of items) {
      byId.set(i.id, i);
    }
    for (const i of preloadedItems) {
      if (selectedItemIds.includes(i.id)) byId.set(i.id, i);
    }
    for (const id of selectedItemIds) {
      const cached = itemCacheRef.current.get(id);
      if (cached && !byId.has(id)) {
        byId.set(id, cached);
      }
    }
    return [...byId.values()];
  }, [items, preloadedItems, selectedItemIds]);

  // List of selected product items for chips
  const selectedProductsList = React.useMemo(() => {
    return selectedProductIds
      .map((id) => productCacheRef.current.get(id) || preloadedProducts.find((p) => p.id === id))
      .filter((p): p is OfferProductTarget => Boolean(p));
  }, [selectedProductIds, preloadedProducts]);

  // List of selected items for chips
  const selectedItemsList = React.useMemo(() => {
    return selectedItemIds
      .map((id) => itemCacheRef.current.get(id) || preloadedItems.find((i) => i.id === id))
      .filter((i): i is OfferItemTarget => Boolean(i));
  }, [selectedItemIds, preloadedItems]);

  const toggleProduct = (id: string) => {
    onSelectedProductIdsChange(
      selectedProductIds.includes(id)
        ? selectedProductIds.filter((value) => value !== id)
        : [...selectedProductIds, id]
    );
  };

  const toggleItem = (id: string) => {
    onSelectedItemIdsChange(
      selectedItemIds.includes(id)
        ? selectedItemIds.filter((value) => value !== id)
        : [...selectedItemIds, id]
    );
  };

  const selectedCount = level === "product" ? selectedProductIds.length : selectedItemIds.length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="offer-category">Category</Label>
          <Select
            id="offer-category"
            value={categoryId}
            options={categoryOptions}
            placeholder={categoriesLoading ? "Loading categories..." : "All categories"}
            disabled={categoriesLoading}
            onValueChange={(value) => {
              onCategoryChange(value);
              onProductChange("");
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="offer-product-filter">
            {level === "item" ? "Product Filter" : "Product"}
          </Label>
          <Select
            id="offer-product-filter"
            value={productId}
            options={productOptions}
            placeholder={productsLoading ? "Loading products..." : "All products"}
            disabled={productsLoading}
            onValueChange={onProductChange}
          />
          {level === "item" && (
            <p className="text-xs text-neutral-500">
              Filter by product or search below to pick items across multiple products.
            </p>
          )}
        </div>
      </div>

      {level === "product" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label>
              Select products
              <span className="text-error-600 font-bold ml-1">*</span>
            </Label>
            <Badge variant={selectedCount > 0 ? "success" : "secondary"} className="text-xs">
              {selectedCount} selected
            </Badge>
          </div>

          {/* Selected Products Chips Bar */}
          {selectedProductsList.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
              <span className="text-xs font-semibold text-neutral-600 mr-1">Selected:</span>
              {selectedProductsList.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary-50 text-secondary-900 border border-secondary-200 text-xs font-medium shadow-2xs"
                >
                  <span className="truncate max-w-[160px]">{p.name}</span>
                  <button
                    type="button"
                    onClick={() => toggleProduct(p.id)}
                    className="hover:text-error-600 cursor-pointer p-0.5 rounded transition-colors"
                    title="Remove product"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => onSelectedProductIdsChange([])}
                className="text-[11px] text-neutral-500 hover:text-error-600 ml-auto cursor-pointer underline px-1"
              >
                Clear all
              </button>
            </div>
          )}

          <SearchInput
            placeholder="Search products by name..."
            onSearch={setProductSearch}
            className="max-w-md"
          />

          <TargetList
            isLoading={productsLoading}
            isEmpty={visibleProducts.length === 0}
            emptyIcon={<Package className="h-6 w-6" />}
            emptyTitle="No products found"
            emptyDescription="Try a different category or search term."
          >
            {visibleProducts.map((product) => (
              <TargetRow
                key={product.id}
                selected={selectedProductIds.includes(product.id)}
                onToggle={() => toggleProduct(product.id)}
                title={product.name}
                subtitle={product.categoryName ?? "Uncategorised"}
              />
            ))}
          </TargetList>

          <p className="text-xs text-neutral-500">
            A product-wise offer applies to every item and pack size under all selected products.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label>
              Select items / variants
              <span className="text-error-600 font-bold ml-1">*</span>
            </Label>
            <Badge variant={selectedCount > 0 ? "success" : "secondary"} className="text-xs">
              {selectedCount} selected
            </Badge>
          </div>

          {/* Selected Items Chips Bar */}
          {selectedItemsList.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
              <span className="text-xs font-semibold text-neutral-600 mr-1">Selected:</span>
              {selectedItemsList.map((i) => (
                <span
                  key={i.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary-50 text-secondary-900 border border-secondary-200 text-xs font-medium shadow-2xs"
                >
                  <span className="truncate max-w-[160px]">{i.label || i.sku}</span>
                  <button
                    type="button"
                    onClick={() => toggleItem(i.id)}
                    className="hover:text-error-600 cursor-pointer p-0.5 rounded transition-colors"
                    title="Remove item"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => onSelectedItemIdsChange([])}
                className="text-[11px] text-neutral-500 hover:text-error-600 ml-auto cursor-pointer underline px-1"
              >
                Clear all
              </button>
            </div>
          )}

          <SearchInput
            placeholder="Search by item name or SKU..."
            onSearch={setItemSearch}
            className="max-w-md"
          />

          <TargetList
            isLoading={itemsLoading}
            isEmpty={visibleItems.length === 0}
            emptyIcon={<PackageSearch className="h-6 w-6" />}
            emptyTitle="No items found"
            emptyDescription="Try selecting a different product, category, or changing your search term."
          >
            {visibleItems.map((item) => {
              const isOutOfStock = !item.inStock || item.stockQuantity <= 0;
              return (
                <TargetRow
                  key={item.id}
                  selected={selectedItemIds.includes(item.id)}
                  disabled={isOutOfStock}
                  disabledTooltip={isOutOfStock ? "Cannot apply offer to out-of-stock items" : undefined}
                  onToggle={() => toggleItem(item.id)}
                  title={item.label || item.sku}
                  subtitle={`SKU ${item.sku}`}
                  meta={
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900">
                        ₹{item.basePrice.toFixed(2)}
                      </span>
                      <Badge
                        variant={item.inStock ? "success" : "warning"}
                        className="text-[10px]"
                      >
                        {item.inStock ? `In stock (${item.stockQuantity})` : "Out of stock"}
                      </Badge>
                    </div>
                  }
                />
              );
            })}
          </TargetList>

          <p className="text-xs text-neutral-500">
            An item-wise offer applies only to the exact pack sizes you select.
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm font-medium text-error-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function TargetList({
  isLoading,
  isEmpty,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  children,
}: {
  isLoading: boolean;
  isEmpty: boolean;
  emptyIcon: React.ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-h-64 overflow-y-auto rounded-xl border border-neutral-200 bg-white scrollbar-thin">
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 p-8 text-sm text-neutral-500">
          <Spinner className="h-4 w-4" />
          Loading...
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          className="py-8"
        />
      ) : (
        <ul className="divide-y divide-neutral-100">{children}</ul>
      )}
    </div>
  );
}

function TargetRow({
  selected,
  onToggle,
  title,
  subtitle,
  meta,
  disabled,
  disabledTooltip,
}: {
  selected: boolean;
  onToggle: () => void;
  title: string;
  subtitle: string;
  meta?: React.ReactNode;
  disabled?: boolean;
  disabledTooltip?: string;
}) {
  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        title={disabledTooltip}
        onClick={disabled ? undefined : onToggle}
        aria-pressed={selected}
        className={cn(
          "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
          disabled
            ? "opacity-50 cursor-not-allowed bg-neutral-50/50"
            : selected
            ? "bg-emerald-50/70 cursor-pointer"
            : "hover:bg-neutral-50 cursor-pointer"
        )}
      >
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
            disabled
              ? "border-neutral-200 bg-neutral-100 text-neutral-300"
              : selected
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-neutral-300 bg-white"
          )}
        >
          {selected && <Check className="h-3.5 w-3.5" />}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-neutral-900">
            {title}
          </span>
          <span className="block truncate text-xs text-neutral-500">{subtitle}</span>
        </span>

        {meta && <span className="shrink-0 text-xs">{meta}</span>}
      </button>
    </li>
  );
}
