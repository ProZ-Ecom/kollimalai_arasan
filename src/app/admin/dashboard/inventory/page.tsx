"use client";

import { useState } from "react";
import {
  Boxes,
  Plus,
  RefreshCw,
  AlertTriangle,
  History,
  SlidersHorizontal,
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
  InventoryHistoryTab,
} from "@/features/inventory/components";
import type { InventoryListItem } from "@/features/inventory/types";

type TabMode = "stock" | "low_stock" | "history";

const statusFilterOptions: SelectOption[] = [
  { value: "all", label: "All Stock Statuses" },
  { value: "in_stock", label: "In Stock (Healthy)" },
  { value: "low_stock", label: "Low Stock (Reorder)" },
  { value: "out_of_stock", label: "Out of Stock" },
];

export default function InventoryDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabMode>("stock");
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState<number>(1);
  const pageSize = 12;

  // Selected item for modal
  const [adjustItem, setAdjustItem] = useState<InventoryListItem | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

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
    outOfStock: isOutOfStockFilter || undefined,
  });

  const inventoryData = (inventoryResponse as any)?.data;
  const items: InventoryListItem[] = inventoryData?.data ?? [];
  const meta = inventoryData?.meta;

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
        description="Real-time warehouse stock tracking, reorder thresholds, and audit movement"
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
            {items.length > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={() => handleOpenAdjust(items[0])}
                className="bg-secondary-600 hover:bg-secondary-700 text-white font-bold text-xs shadow-xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
                Quick Adjust Stock
              </Button>
            )}
          </div>
        }
      />

      <AdminContent className="space-y-6">
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
          <div className="space-y-4">
            <InventoryStockTable
              items={items}
              onAdjustStock={handleOpenAdjust}
              onViewHistory={handleViewHistoryForItem}
            />

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="px-4 py-3 bg-white rounded-2xl border border-cream-border shadow-xs flex items-center justify-between text-xs text-neutral-500">
                <span>
                  Showing page <strong className="text-neutral-800">{meta.page}</strong> of{" "}
                  <strong className="text-neutral-800">{meta.totalPages}</strong> (
                  {meta.total} total items)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={meta.page <= 1}
                    className="h-8 text-xs font-semibold"
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    disabled={meta.page >= meta.totalPages}
                    className="h-8 text-xs font-semibold"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
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
      </AdminContent>
    </div>
  );
}
