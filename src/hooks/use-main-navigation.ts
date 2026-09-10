"use client";

import * as React from "react";
import { useCustomerCategories } from "@/features/customers/hooks/use-customer-catalog";
import type { CustomerCategoryDto } from "@/features/customers/types/catalog.types";

/** Named categories surfaced directly in the nav (e.g. Spices, Millets). */
export const MAX_CATEGORY_NAV_ITEMS = 2;

export interface MainNavItem {
  label: string;
  href: string;
}

const STATIC_LEADING: MainNavItem[] = [
  { label: "Home", href: "/" },
  { label: "Shop All", href: "/products" },
];

const STATIC_TRAILING: MainNavItem[] = [
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/**
 * The storefront's primary navigation, shared by the header nav row, the
 * mobile drawer and the footer's Quick Links.
 *
 * The named category entries come from the catalog rather than a hardcoded
 * list, so adding a category in admin surfaces it everywhere at once.
 */
export function useMainNavigation(): {
  items: MainNavItem[];
  categoryItems: MainNavItem[];
  /** The same named categories as `categoryItems`, as full catalog records. */
  navCategories: CustomerCategoryDto[];
  categories: CustomerCategoryDto[];
  isLoading: boolean;
} {
  const { data, isLoading } = useCustomerCategories({
    page: 1,
    pageSize: 50,
    sortBy: "name",
    sortOrder: "asc",
  });

  const categories = React.useMemo(() => data?.data ?? [], [data]);

  const navCategories = React.useMemo(
    () => categories.slice(0, MAX_CATEGORY_NAV_ITEMS),
    [categories]
  );

  const categoryItems = React.useMemo(
    () =>
      navCategories.map((category) => ({
        label: category.name,
        href: `/categories/${category.id}`,
      })),
    [navCategories]
  );

  const items = React.useMemo(
    () => [...STATIC_LEADING, ...categoryItems, ...STATIC_TRAILING],
    [categoryItems]
  );

  return { items, categoryItems, navCategories, categories, isLoading };
}
