"use client";

import { useState } from "react";
import {
  Boxes,
  RefreshCw,
  AlertTriangle,
  History,
  SlidersHorizontal,
  Layers,
  PlusCircle,
} from "lucide-react";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import {
  AdminPageHeader,
  AdminContent,
} from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Select, type SelectOption } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { ClearFiltersButton } from "@/components/common/clear-filters-button";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { ErrorState } from "@/components/ui/error-state";
import {
  useInventory,
  useInventoryStats,
} from "@/features/inventory/hooks";
import {
  InventoryKpiCards,
  InventoryStockTable,
  AdjustStockModal,
  BulkRestockModal,
  InventoryHistoryTab,
} from "@/features/inventory/components";
import type { InventoryListItem } from "@/features/inventory/types";

type TabMode = "stock" | "low_stock" | "history";

const statusFilterOptions: SelectOption[] = [
  { value: "all", label: "All Stock Statuses" },
  { value: "in_stock", label: "In Stock (> 0 units)" },
  { value: "low_stock", label: "Low Stock (Reorder Level)" },
  { value: "low_stock_10", label: "Low Stock (< 10 units)" },
  { value: "low_stock_50", label: "Low Stock (< 50 units)" },
  { value: "reserved", label: "Has Reserved Stock (> 0)" },
  { value: "out_of_stock", label: "Out of Stock (0 units)" },
];

export default function InventoryDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabMode>("stock");
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Selected item for single adjust modal
  const [adjustItem, setAdjustItem] = useState<InventoryListItem | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // Multi-selection for bulk restock
  const [selectedItemsMap, setSelectedItemsMap] = useState<
    Record<number, InventoryListItem>
  >({});
  const [isBulkRestockModalOpen, setIsBulkRestockModalOpen] = useState(false);

  // Filter history by specific item
  const [historyFilterItem, setHistoryFilterItem] =
    useState<InventoryListItem | null>(null);

  // Live KPI stats query
  const {
    data: statsResponse,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useInventoryStats();

  const stats = (statsResponse as any)?.data ?? statsResponse;

  // Live inventory list query
  const isLowStockFilter =
    activeTab === "low_stock" || statusFilter === "low_stock";
  const isLowStock10 = statusFilter === "low_stock_10";
  const isLowStock50 = statusFilter === "low_stock_50";
  const isReservedFilter = statusFilter === "reserved";
  const isOutOfStockFilter = statusFilter === "out_of_stock";

  const {
    data: inventoryResponse,
    isLoading: isLoadingInventory,
    error: inventoryError,
    refetch: refetchInventory,
  } = useInventory({
    page,
    limit: pageSize,
    search: search.trim() || undefined,
    lowStock: isLowStockFilter || undefined,
    lowStockThreshold: isLowStock10 ? 10 : isLowStock50 ? 50 : undefined,
    reserved: isReservedFilter || undefined,
    outOfStock: isOutOfStockFilter || undefined,
  });

  const inventoryData = (inventoryResponse as any)?.data;
  const items: InventoryListItem[] = inventoryData?.data ?? [];
  const meta = inventoryData?.meta;

  const selectedIds = Object.keys(selectedItemsMap).map(Number);
  const selectedItems = Object.values(selectedItemsMap);

  const handleToggleSelect = (id: number) => {
    const item = items.find((i) => i.id === id) || selectedItemsMap[id];
    if (!item) return;
    setSelectedItemsMap((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = item;
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (items.length === 0) return;
    const allPageSelected = items.every((i) => !!selectedItemsMap[i.id]);
    setSelectedItemsMap((prev) => {
      const next = { ...prev };
      if (allPageSelected) {
        items.forEach((i) => delete next[i.id]);
      } else {
        items.forEach((i) => {
          next[i.id] = i;
        });
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedItemsMap({});
  };

  const hasActiveFilters =
    search.trim() !== "" || statusFilter !== "all" || activeTab !== "stock";

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setActiveTab("stock");
    setHistoryFilterItem(null);
    setPage(1);
  };

  const handleOpenAdjust = (item: InventoryListItem) => {
    setAdjustItem(item);
    setIsAdjustModalOpen(true);
  };

  const handleViewHistoryForItem = (item: InventoryListItem) => {
    setHistoryFilterItem(item);
    setActiveTab("history");
  };

  const handleKpiCardFilter = (filterId: string) => {
    if (filterId === "low_stock") {
      setActiveTab("low_stock");
      setStatusFilter("low_stock");
    } else if (filterId === "out_of_stock") {
      setActiveTab("stock");
      setStatusFilter("out_of_stock");
    } else if (filterId === "in_stock") {
      setActiveTab("stock");
      setStatusFilter("in_stock");
    } else if (filterId === "reserved") {
      setActiveTab("stock");
      setStatusFilter("reserved");
    } else {
      setActiveTab("stock");
      setStatusFilter("all");
    }
    setPage(1);
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <AdminBreadcrumb
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Inventory" },
        ]}
      />

      <AdminPageHeader
        title="Inventory Management"
        description="Real-time warehouse stock tracking, bulk restock, and audit movement"
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                refetchStats();
                refetchInventory();
              }}
              className="text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
            {selectedIds.length > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={() => setIsBulkRestockModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                Bulk Restock ({selectedIds.length})
              </Button>
            )}
            {items.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenAdjust(items[0])}
                className="text-secondary-700 border-secondary-200 hover:bg-secondary-50 font-bold text-xs shadow-xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
                Quick Adjust Stock
              </Button>
            )}
          </div>
        }
      />

      <AdminContent className="space-y-6 pb-24">
        {/* KPI Metric Cards */}
        <InventoryKpiCards
          stats={stats}
          isLoading={isLoadingStats}
          activeFilter={
            statusFilter !== "all"
              ? statusFilter
              : activeTab === "low_stock"
              ? "low_stock"
              : "all"
          }
          onFilterChange={handleKpiCardFilter}
        />

        {/* Navigation Tabs & Search Controls Card */}
        <div className="bg-white rounded-2xl border border-cream-border p-4 sm:p-5 shadow-xs space-y-4">
          {/* Tab Selector */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-cream-border/70 flex-wrap">
            <div className="flex items-center p-1 bg-cream-100 rounded-xl border border-cream-border gap-1 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("stock");
                  setStatusFilter("all");
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "stock"
                    ? "bg-secondary-600 text-white shadow-xs font-bold"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-white"
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>All Inventory ({stats?.totalSkus ?? 0})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("low_stock");
                  setStatusFilter("low_stock");
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "low_stock"
                    ? "bg-amber-600 text-white shadow-xs font-bold"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-white"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Low Stock Alerts ({stats?.lowStockCount ?? 0})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("history");
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "history"
                    ? "bg-secondary-600 text-white shadow-xs font-bold"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-white"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Stock Movement & Audit Log</span>
              </button>
            </div>

            {hasActiveFilters && (
              <ClearFiltersButton onClick={handleClearFilters} />
            )}
          </div>

          {/* Search & Status Filter (visible on stock & low stock tabs) */}
          {activeTab !== "history" && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex-1 max-w-md">
                <SearchInput
                  placeholder="Search by product name, SKU, or variant..."
                  value={search}
                  onSearch={(val) => {
                    setSearch(val);
                    setPage(1);
                  }}
                />
              </div>

              <div className="w-[200px] shrink-0">
                <Select
                  options={statusFilterOptions}
                  value={statusFilter}
                  onValueChange={(val) => {
                    setStatusFilter(val);
                    setPage(1);
                  }}
                  size="sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bulk Action Sticky Banner when items are selected */}
        {selectedIds.length > 0 && activeTab !== "history" && (
          <div className="bg-gradient-to-r from-secondary-900 to-secondary-800 text-white rounded-2xl p-3.5 sm:px-5 shadow-lg flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-secondary-700/80 border border-secondary-600 flex items-center justify-center text-secondary-200 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>
                    {selectedIds.length}{" "}
                    {selectedIds.length === 1 ? "product" : "products"} selected
                  </span>
                  <span className="text-secondary-300 text-[11px] font-normal hidden sm:inline">
                    • Ready for bulk stock update
                  </span>
                </p>
                <p className="text-[11px] text-secondary-300 truncate hidden md:block">
                  Apply identical restock quantity (e.g. 50 units) across all selected products at once.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-3 py-1.5 text-xs font-medium text-secondary-200 hover:text-white hover:bg-secondary-700/60 rounded-lg transition-colors cursor-pointer"
              >
                Clear Selection
              </button>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsBulkRestockModalOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md border-0 gap-1.5 px-4"
              >
                <PlusCircle className="w-4 h-4" />
                Bulk Restock ({selectedIds.length})
              </Button>
            </div>
          </div>
        )}

        {/* Content based on Active Tab */}
        {activeTab === "history" ? (
          <InventoryHistoryTab
            initialSearch={historyFilterItem?.sku || ""}
            filteredItemName={
              historyFilterItem
                ? `${historyFilterItem.productName} (${historyFilterItem.unitLabel})`
                : undefined
            }
            onClearFilterItem={() => setHistoryFilterItem(null)}
          />
        ) : isLoadingInventory ? (
          <AdminTableSkeleton />
        ) : inventoryError ? (
          <ErrorState
            message="Failed to load inventory stock records."
            onRetry={() => refetchInventory()}
          />
        ) : (
          <div className="w-full">
            <InventoryStockTable
              items={items}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onAdjustStock={handleOpenAdjust}
              onViewHistory={handleViewHistoryForItem}
              footer={
                meta ? (
                  <div className="px-4 py-3 sm:px-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
                    <div className="flex items-center gap-3.5 flex-wrap w-full sm:w-auto justify-between sm:justify-start">
                      <span>
                        Showing{" "}
                        <strong className="text-neutral-800">
                          {meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1}
                        </strong>{" "}
                        to{" "}
                        <strong className="text-neutral-800">
                          {Math.min(meta.page * meta.limit, meta.total)}
                        </strong>{" "}
                        of <strong className="text-neutral-800">{meta.total}</strong> products
                      </span>

                      {/* Rows per page selector chips */}
                      <div className="flex items-center gap-2 pl-3 border-l border-cream-border/80">
                        <span className="text-neutral-500 text-xs font-medium">Show:</span>
                        <div className="flex items-center gap-1">
                          {[5, 10, 20, 50].map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => {
                                setPageSize(size);
                                setPage(1);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer font-mono ${
                                pageSize === size
                                  ? "bg-secondary-600 text-white shadow-2xs"
                                  : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 border border-cream-border"
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Page Navigation */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <span className="text-xs text-neutral-500 mr-1 whitespace-nowrap">
                        Page <strong className="text-neutral-800">{meta.page}</strong> of{" "}
                        <strong className="text-neutral-800">{meta.totalPages || 1}</strong>
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={meta.page <= 1}
                        className="h-8 px-3 text-xs font-semibold cursor-pointer"
                      >
                        Previous
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                        disabled={meta.page >= meta.totalPages}
                        className="h-8 px-3 text-xs font-semibold cursor-pointer"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : null
              }
            />
          </div>
        )}

        {/* Stock Adjustment Modal */}
        <AdjustStockModal
          item={adjustItem}
          open={isAdjustModalOpen}
          onClose={() => {
            setIsAdjustModalOpen(false);
            setAdjustItem(null);
          }}
          onSuccess={() => {
            refetchInventory();
            refetchStats();
          }}
        />

        {/* Bulk Restock Modal */}
        <BulkRestockModal
          items={selectedItems}
          open={isBulkRestockModalOpen}
          onClose={() => setIsBulkRestockModalOpen(false)}
          onSuccess={() => {
            setSelectedItemsMap({});
            refetchInventory();
            refetchStats();
          }}
        />
      </AdminContent>
    </div>
  );
}
