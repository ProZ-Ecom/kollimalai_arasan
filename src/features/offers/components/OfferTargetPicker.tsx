"use client";

import * as React from "react";
import { Check, Package, PackageSearch } from "lucide-react";
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
}

/**
 * Category -> Product -> Item/Variant, where each level narrows the next.
 *
 * A product-wise offer needs only the product, so the item list is hidden.
 * An item-wise offer requires at least one pack size, and shows the SKU,
 * price and stock of each so the admin can tell "500g" from "1kg".
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

  // Keep already-selected targets visible even when the current filters would
  // exclude them, so a selection can always be reviewed and removed.
  const visibleProducts = React.useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    for (const product of preloadedProducts) {
      if (selectedProductIds.includes(product.id)) byId.set(product.id, product);
    }
    return [...byId.values()];
  }, [products, preloadedProducts, selectedProductIds]);

  const visibleItems = React.useMemo(() => {
    const byId = new Map(items.map((i) => [i.id, i]));
    for (const item of preloadedItems) {
      if (selectedItemIds.includes(item.id)) byId.set(item.id, item);
    }
    return [...byId.values()];
  }, [items, preloadedItems, selectedItemIds]);

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
              // The chosen product may not belong to the new category.
              onProductChange("");
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="offer-product-filter">
            Product
            {level === "item" && <span className="text-error-600 font-bold ml-1">*</span>}
          </Label>
          <Select
            id="offer-product-filter"
            value={productId}
            options={productOptions}
            placeholder={productsLoading ? "Loading products..." : "All products"}
            disabled={productsLoading}
            onValueChange={onProductChange}
          />
          {level === "item" && !productId && !itemSearch && (
            <p className="text-xs text-neutral-500">
              Pick a product to list its items/variants.
            </p>
          )}
        </div>
      </div>

      {level === "product" ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label>
              Select products
              <span className="text-error-600 font-bold ml-1">*</span>
            </Label>
            <Badge variant={selectedCount > 0 ? "success" : "secondary"} className="text-xs">
              {selectedCount} selected
            </Badge>
          </div>

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
            A product-wise offer applies to every item and pack size under the
            products you select.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label>
              Select items / variants
              <span className="text-error-600 font-bold ml-1">*</span>
            </Label>
            <Badge variant={selectedCount > 0 ? "success" : "secondary"} className="text-xs">
              {selectedCount} selected
            </Badge>
          </div>

          <SearchInput
            placeholder="Search by item name or SKU..."
            onSearch={setItemSearch}
            className="max-w-md"
          />

          <TargetList
            isLoading={itemsLoading}
            isEmpty={visibleItems.length === 0}
            emptyIcon={<PackageSearch className="h-6 w-6" />}
            emptyTitle={productId || itemSearch ? "No items found" : "Choose a product first"}
            emptyDescription={
              productId || itemSearch
                ? "This product has no active pack sizes matching your search."
                : "Select a product above, or search by SKU, to list its items."
            }
          >
            {visibleItems.map((item) => (
              <TargetRow
                key={item.id}
                selected={selectedItemIds.includes(item.id)}
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
            ))}
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
}: {
  selected: boolean;
  onToggle: () => void;
  title: string;
  subtitle: string;
  meta?: React.ReactNode;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        className={cn(
          "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer",
          selected ? "bg-emerald-50/70" : "hover:bg-neutral-50"
        )}
      >
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
            selected
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
