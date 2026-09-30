"use client";

import { useState } from "react";
import {
  History,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, type SelectOption } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useAllInventoryTransactions } from "../hooks";
import { formatDate } from "@/lib/utils";
import type { InventoryTransactionItem } from "../types";

interface InventoryHistoryTabProps {
  initialSearch?: string;
  onClearFilterItem?: () => void;
  filteredItemName?: string;
}

const typeOptions: SelectOption[] = [
  { value: "all", label: "All Movement Types" },
  { value: "PURCHASE", label: "Purchases / Restock" },
  { value: "SALE", label: "Sales / Dispatched" },
  { value: "RETURN", label: "Customer Returns" },
  { value: "ADJUSTMENT", label: "Count Adjustments" },
  { value: "DAMAGE", label: "Damaged / Expired" },
  { value: "TRANSFER", label: "Warehouse Transfers" },
];

function getMovementBadge(type: string, qty: number) {
  const normalized = (type || "").toUpperCase();

  if (normalized.includes("PURCHASE") || normalized.includes("IN") || (normalized === "RETURN")) {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
        <ArrowDownLeft className="w-3 h-3 mr-0.5" />
        Stock In (+{qty})
      </Badge>
    );
  }

  if (normalized.includes("SALE") || normalized.includes("OUT") || normalized.includes("DAMAGE")) {
    return (
      <Badge className="bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
        <ArrowUpRight className="w-3 h-3 mr-0.5" />
        Stock Out (-{qty})
      </Badge>
    );
  }

  return (
    <Badge className="bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[10px]">
      Adjustment ({qty})
    </Badge>
  );
}

export function InventoryHistoryTab({
  initialSearch = "",
  filteredItemName,
  onClearFilterItem,
}: InventoryHistoryTabProps) {
  const [search, setSearch] = useState(initialSearch);
  const [type, setType] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useAllInventoryTransactions({
    page,
    limit: 20,
    type: type !== "all" ? type : undefined,
    search: search.trim() || undefined,
  });

  const transactions: InventoryTransactionItem[] = data?.data?.data ?? [];
  const meta = data?.data?.meta;

  return (
    <div className="space-y-4">
      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-cream-border shadow-xs">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <SearchInput
            placeholder="Search movement by product, SKU, note..."
            value={search}
            onSearch={(val) => {
              setSearch(val);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {filteredItemName && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary-50 text-secondary-800 border border-secondary-200 text-xs font-semibold">
              <span>Item: {filteredItemName}</span>
              <button
                type="button"
                onClick={onClearFilterItem}
                className="text-secondary-600 hover:text-secondary-900 ml-1 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <div className="w-[200px] shrink-0">
            <Select
              options={typeOptions}
              value={type}
              onValueChange={(val) => {
                setType(val);
                setPage(1);
              }}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {isLoading ? (
        <AdminTableSkeleton />
      ) : error ? (
        <ErrorState
          message="Failed to load stock movement audit log."
          onRetry={() => refetch()}
        />
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-border p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-cream-100 border border-cream-border flex items-center justify-center text-neutral-400 mx-auto mb-3">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-neutral-900">
            No stock movement recorded
          </h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Audit logs are created automatically whenever stock is purchased, adjusted, sold, or returned.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-cream-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-cream-border bg-neutral-50/60 text-neutral-500 font-semibold tracking-tight">
                  <th className="py-3 px-4 sm:px-5">Timestamp</th>
                  <th className="py-3 px-4">Product / Item</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-center">Movement Type</th>
                  <th className="py-3 px-4 text-right">Units</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-border/60">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-cream-50/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap text-neutral-500 font-mono">
                      {formatDate(tx.createdAt)}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-neutral-900">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate max-w-[200px]">
                          {tx.productName || "Inventory Item"}
                        </span>
                        {tx.unitLabel && (
                          <span className="text-[10px] font-semibold text-secondary-700 bg-secondary-50 px-1.5 py-0.2 rounded border border-secondary-200">
                            {tx.unitLabel}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-neutral-600">
                      {tx.sku || "—"}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {getMovementBadge(tx.type, tx.quantity)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-neutral-900">
                      {tx.quantity.toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4 text-neutral-600 max-w-[220px] truncate">
                      {tx.notes || "—"}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-neutral-400">
                      {tx.referenceType
                        ? `${tx.referenceType} ${tx.referenceId ? `#${tx.referenceId}` : ""}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-cream-border flex items-center justify-between text-xs text-neutral-500 bg-neutral-50/30">
              <span>
                Page {meta.page} of {meta.totalPages} ({meta.total} total logs)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={meta.page <= 1}
                  className="h-7 text-xs"
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={meta.page >= meta.totalPages}
                  className="h-7 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
