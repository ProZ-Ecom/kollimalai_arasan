"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getAdminProducts } from "@/features/products/api/get-products";
import { getCategories } from "@/features/categories/api/get-categories";
import { getAdminVariants } from "@/features/variants/api/get-variants";
import type { SelectOption } from "@/components/ui/select";

export interface UseInfiniteSelectOptions {
  pageSize?: number;
  initialSelectedId?: string;
  initialSelectedOption?: SelectOption;
  includeAllOption?: boolean;
  allOptionLabel?: string;
}

/**
 * Hook for Products with debounced server-side search and infinite scroll pagination.
 */
export function useInfiniteProductsSelect(options?: UseInfiniteSelectOptions) {
  const pageSize = options?.pageSize ?? 20;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<{ id: string; name: string; slug?: string }[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchPage = useCallback(
    async (targetPage: number, targetSearch: string, isAppend = false) => {
      if (targetPage === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const res = await getAdminProducts({
          page: targetPage,
          pageSize,
          search: targetSearch.trim() || undefined,
        });

        const newItems = (res.data ?? []).map((p: any) => ({
          id: String(p.id),
          name: p.name,
          slug: p.slug,
        }));

        setItems((prev) => (isAppend ? [...prev, ...newItems] : newItems));
        setTotalPages(res.meta?.totalPages ?? 1);
      } catch (err) {
        console.error("Failed to fetch infinite products:", err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [pageSize]
  );

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearch(query);
      setPage(1);
      fetchPage(1, query, false);
    },
    [fetchPage]
  );

  useEffect(() => {
    fetchPage(1, "", false);
  }, [fetchPage]);

  const handleLoadMore = useCallback(() => {
    if (isLoading || isLoadingMore || page >= totalPages) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(nextPage, search, true);
  }, [isLoading, isLoadingMore, page, totalPages, search, fetchPage]);

  const selectOptions: SelectOption[] = useMemo(() => {
    const list: SelectOption[] = [];
    const isSearching = Boolean(search.trim());
    if (options?.includeAllOption && !isSearching) {
      list.push({ value: "", label: options.allOptionLabel || "All Products" });
    }
    if (
      !isSearching &&
      options?.initialSelectedOption &&
      !items.some((item) => item.id === options.initialSelectedOption!.value)
    ) {
      list.push(options.initialSelectedOption);
    }
    items.forEach((item) => {
      if (!list.some((existing) => existing.value === item.id)) {
        list.push({
          value: item.id,
          label: item.name,
          slug: item.slug,
        });
      }
    });
    return list;
  }, [options?.includeAllOption, options?.allOptionLabel, options?.initialSelectedOption, items, search]);

  return {
    options: selectOptions,
    items,
    search,
    onSearchChange: handleSearchChange,
    onLoadMore: handleLoadMore,
    hasMore: page < totalPages,
    isLoading,
    isLoadingMore,
    refetch: () => fetchPage(1, search, false),
  };
}

/**
 * Hook for Categories with debounced server-side search and infinite scroll pagination.
 */
export function useInfiniteCategoriesSelect(options?: UseInfiniteSelectOptions) {
  const pageSize = options?.pageSize ?? 20;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<{ id: string; name: string; slug?: string }[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchPage = useCallback(
    async (targetPage: number, targetSearch: string, isAppend = false) => {
      if (targetPage === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const res = await getCategories({
          page: targetPage,
          pageSize,
          search: targetSearch.trim() || undefined,
        });

        const newItems = (res.data ?? []).map((c: any) => ({
          id: String(c.id || c.uuid),
          name: c.name,
          slug: c.slug,
        }));

        setItems((prev) => (isAppend ? [...prev, ...newItems] : newItems));
        setTotalPages(res.meta?.totalPages ?? 1);
      } catch (err) {
        console.error("Failed to fetch infinite categories:", err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [pageSize]
  );

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearch(query);
      setPage(1);
      fetchPage(1, query, false);
    },
    [fetchPage]
  );

  useEffect(() => {
    fetchPage(1, "", false);
  }, [fetchPage]);

  const handleLoadMore = useCallback(() => {
    if (isLoading || isLoadingMore || page >= totalPages) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(nextPage, search, true);
  }, [isLoading, isLoadingMore, page, totalPages, search, fetchPage]);

  const selectOptions: SelectOption[] = useMemo(() => {
    const list: SelectOption[] = [];
    const isSearching = Boolean(search.trim());
    if (options?.includeAllOption && !isSearching) {
      list.push({ value: "", label: options.allOptionLabel || "All Categories" });
    }
    if (
      !isSearching &&
      options?.initialSelectedOption &&
      !items.some((item) => item.id === options.initialSelectedOption!.value)
    ) {
      list.push(options.initialSelectedOption);
    }
    items.forEach((item) => {
      if (!list.some((existing) => existing.value === item.id)) {
        list.push({
          value: item.id,
          label: item.name,
          slug: item.slug,
        });
      }
    });
    return list;
  }, [options?.includeAllOption, options?.allOptionLabel, options?.initialSelectedOption, items, search]);

  return {
    options: selectOptions,
    items,
    search,
    onSearchChange: handleSearchChange,
    onLoadMore: handleLoadMore,
    hasMore: page < totalPages,
    isLoading,
    isLoadingMore,
    refetch: () => fetchPage(1, search, false),
  };
}

export interface UseInfiniteVariantsOptions extends UseInfiniteSelectOptions {
  productIds?: string[];
}

/**
 * Hook for Variants / Items with debounced server-side search and infinite scroll pagination.
 */
export function useInfiniteVariantsSelect(options?: UseInfiniteVariantsOptions) {
  const pageSize = options?.pageSize ?? 20;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<{ id: string; name: string; sku?: string }[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchPage = useCallback(
    async (targetPage: number, targetSearch: string, isAppend = false) => {
      if (targetPage === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const res = await getAdminVariants({
          page: targetPage,
          pageSize,
          search: targetSearch.trim() || undefined,
          productIds: options?.productIds,
        });

        const newItems = (res.data ?? []).map((v: any) => ({
          id: String(v.id),
          name: `${v.productName ? `${v.productName} - ` : ""}${v.variantName}${v.sku ? ` (${v.sku})` : ""}`,
          sku: v.sku,
        }));

        setItems((prev) => (isAppend ? [...prev, ...newItems] : newItems));
        setTotalPages(res.meta?.totalPages ?? 1);
      } catch (err) {
        console.error("Failed to fetch infinite variants:", err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [pageSize, options?.productIds]
  );

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearch(query);
      setPage(1);
      fetchPage(1, query, false);
    },
    [fetchPage]
  );

  useEffect(() => {
    fetchPage(1, "", false);
  }, [fetchPage]);

  const handleLoadMore = useCallback(() => {
    if (isLoading || isLoadingMore || page >= totalPages) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(nextPage, search, true);
  }, [isLoading, isLoadingMore, page, totalPages, search, fetchPage]);

  const selectOptions: SelectOption[] = useMemo(() => {
    const list: SelectOption[] = [];
    const isSearching = Boolean(search.trim());
    if (options?.includeAllOption && !isSearching) {
      list.push({ value: "", label: options.allOptionLabel || "All Items" });
    }
    if (
      !isSearching &&
      options?.initialSelectedOption &&
      !items.some((item) => item.id === options.initialSelectedOption!.value)
    ) {
      list.push(options.initialSelectedOption);
    }
    items.forEach((item) => {
      if (!list.some((existing) => existing.value === item.id)) {
        list.push({
          value: item.id,
          label: item.name,
        });
      }
    });
    return list;
  }, [options?.includeAllOption, options?.allOptionLabel, options?.initialSelectedOption, items, search]);

  return {
    options: selectOptions,
    items,
    search,
    onSearchChange: handleSearchChange,
    onLoadMore: handleLoadMore,
    hasMore: page < totalPages,
    isLoading,
    isLoadingMore,
    refetch: () => fetchPage(1, search, false),
  };
}
