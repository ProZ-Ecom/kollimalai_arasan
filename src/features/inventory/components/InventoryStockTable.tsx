"use client";

import Image from "next/image";
import {
  Package,
  SlidersHorizontal,
  History,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InventoryListItem } from "../types";

interface InventoryStockTableProps {
  items: InventoryListItem[];
  onAdjustStock: (item: InventoryListItem) => void;
  onViewHistory: (item: InventoryListItem) => void;
  selectedIds?: number[];
  onToggleSelect?: (id: number) => void;
  onToggleSelectAll?: () => void;
  footer?: React.ReactNode;
}

export function InventoryStockTable({
  items,
  onAdjustStock,
  onViewHistory,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  footer,
}: InventoryStockTableProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-cream-border p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-cream-100 border border-cream-border flex items-center justify-center text-neutral-400 mx-auto mb-3">
          <Package className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-neutral-900">
          No inventory items found
        </h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
          No stock records match your current search or filter criteria. Try adjusting your filters.
        </p>
      </div>
    );
  }

  const allSelected = items.length > 0 && items.every((i) => selectedIds.includes(i.id));
  const someSelected = items.some((i) => selectedIds.includes(i.id)) && !allSelected;

  return (
    <div className="w-full flex-1 min-h-[300px] flex flex-col justify-between rounded-2xl overflow-hidden border border-cream-border bg-white shadow-xs relative">
      <div className="min-h-0 flex-1 flex flex-col relative">
        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto overscroll-auto scrollbar-thin">
          <table className="w-full min-w-[1000px] text-left border-separate border-spacing-0 text-xs">
            <thead className="sticky top-0 z-30 shadow-xs bg-neutral-50/95 backdrop-blur-xs">
            <tr className="bg-neutral-50/95 text-neutral-600 font-semibold tracking-tight backdrop-blur-xs">
              {/* Checkbox Select All - Sticky Top & Left */}
              <th className="py-3 px-3 w-10 text-center shrink-0 sticky top-0 left-0 z-40 bg-neutral-50 border-r border-b border-cream-border shadow-[2px_0_6px_-2px_rgba(0,0,0,0.04)]">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={onToggleSelectAll}
                  aria-label="Select all on this page"
                  className="h-4 w-4 rounded border-neutral-300 text-secondary-600 focus:ring-secondary-500 cursor-pointer accent-secondary-600"
                />
              </th>
              <th className="py-3.5 px-4 sm:px-5 min-w-[240px] whitespace-nowrap sticky top-0 z-30 bg-neutral-50 border-b border-cream-border">Product & Variant</th>
              <th className="py-3.5 px-4 min-w-[140px] whitespace-nowrap sticky top-0 z-30 bg-neutral-50 border-b border-cream-border">SKU</th>
              <th className="py-3.5 px-4 text-center min-w-[185px] whitespace-nowrap sticky top-0 z-30 bg-neutral-50 border-b border-cream-border">Stock Health</th>
              <th className="py-3.5 px-4 text-right min-w-[90px] whitespace-nowrap sticky top-0 z-30 bg-neutral-50 border-b border-cream-border">Available</th>
              <th className="py-3.5 px-4 text-right min-w-[85px] whitespace-nowrap sticky top-0 z-30 bg-neutral-50 border-b border-cream-border">Reserved</th>
              <th className="py-3.5 px-4 text-center min-w-[130px] whitespace-nowrap sticky top-0 z-30 bg-neutral-50 border-b border-cream-border">Status</th>
              {/* Actions - Sticky Top & Right */}
              <th className="py-3.5 px-4 text-right min-w-[125px] whitespace-nowrap sticky top-0 right-0 z-40 bg-neutral-50 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] border-l border-b border-cream-border">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-border/60">
            {items.map((item) => {
              const effectiveReorder = item.reorderLevel > 0 ? item.reorderLevel : 5;
              const isOutOfStock = item.availableQuantity === 0;
              const isLowStock =
                !isOutOfStock && item.availableQuantity <= effectiveReorder;

              // Health progress bar percentage (capped at 100%)
              const targetThreshold = Math.max(effectiveReorder * 2, 20);
              const stockPercent = Math.min(
                100,
                Math.round((item.availableQuantity / targetThreshold) * 100)
              );

              const isSelected = selectedIds.includes(item.id);

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-cream-50/40 transition-colors group ${isSelected ? "bg-secondary-50/30" : ""
                    }`}
                >
                  {/* Row Checkbox - Sticky Left */}
                  <td
                    className={`py-3.5 px-3 w-10 text-center shrink-0 sticky left-0 z-10 border-r border-b border-cream-border/60 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.04)] transition-colors ${isSelected
                        ? "bg-[#faf6ee] group-hover:bg-[#f5efdf]"
                        : "bg-white group-hover:bg-[#fcfaf7]"
                      }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect?.(item.id)}
                      aria-label={`Select ${item.productName}`}
                      className="h-4 w-4 rounded border-neutral-300 text-secondary-600 focus:ring-secondary-500 cursor-pointer accent-secondary-600"
                    />
                  </td>

                  {/* Product + Variant */}
                  <td className="py-3.5 px-4 sm:px-5 border-b border-cream-border/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cream-100 border border-cream-border flex items-center justify-center overflow-hidden shrink-0 relative">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.productName}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-neutral-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-neutral-900 truncate max-w-[200px] sm:max-w-[260px]">
                          {item.productName}
                        </div>
                        {item.variantName && (
                          <div className="text-xs font-semibold text-neutral-600 truncate max-w-[200px] sm:max-w-[260px] capitalize">
                            {item.variantName}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-secondary-700 bg-secondary-50 px-1.5 py-0.5 rounded text-[10px] border border-secondary-200">
                            {item.unitLabel}
                          </span>
                          {item.basePrice > 0 && (
                            <span className="text-[11px] font-mono text-neutral-500">
                              ₹{item.basePrice.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* SKU */}
                  <td className="py-3.5 px-4 min-w-[140px] whitespace-nowrap border-b border-cream-border/60">
                    <span className="font-mono text-[11px] font-bold text-neutral-700 bg-cream-100/80 border border-cream-border px-2.5 py-1 rounded-md inline-block whitespace-nowrap tracking-wide select-all">
                      {item.sku || "—"}
                    </span>
                  </td>

                  {/* Stock Health Visual Bar */}
                  <td className="py-3.5 px-4 min-w-[185px] border-b border-cream-border/60">
                    <div className="space-y-1.5 w-full">
                      <div className="flex items-center justify-between text-[10px] gap-2 whitespace-nowrap">
                        <span className="text-neutral-500 font-medium">Reorder at {effectiveReorder}</span>
                        <span className={`font-mono font-bold ${isOutOfStock ? "text-rose-600" : "text-neutral-700"}`}>
                          {item.availableQuantity} units
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${isOutOfStock ? 100 : stockPercent}%` }}
                          className={`h-full rounded-full transition-all duration-300 ${isOutOfStock
                              ? "bg-[repeating-linear-gradient(135deg,#f43f5e,#f43f5e_4px,#fda4af_4px,#fda4af_8px)]"
                              : isLowStock
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Available Quantity */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[90px] border-b border-cream-border/60">
                    <span
                      className={`font-mono text-sm font-bold ${isOutOfStock
                          ? "text-rose-600"
                          : isLowStock
                            ? "text-amber-700"
                            : "text-neutral-900"
                        }`}
                    >
                      {item.availableQuantity.toLocaleString("en-IN")}
                    </span>
                  </td>

                  {/* Reserved Quantity */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[85px] border-b border-cream-border/60">
                    <span className="font-mono text-xs font-medium text-neutral-500">
                      {item.reservedQuantity > 0 ? (
                        <button
                          type="button"
                          onClick={() => onAdjustStock(item)}
                          className="text-blue-600 font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
                          title="Click to manage or release reserved stock"
                        >
                          {item.reservedQuantity.toLocaleString("en-IN")}
                        </button>
                      ) : (
                        "0"
                      )}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[130px] border-b border-cream-border/60">
                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-300 shadow-2xs bg-[repeating-linear-gradient(135deg,rgba(244,63,94,0.08),rgba(244,63,94,0.08)_4px,transparent_4px,transparent_8px)] select-none">
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
                        </span>
                        <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span className="whitespace-nowrap font-extrabold tracking-wide">Out of Stock</span>
                      </span>
                    ) : isLowStock ? (
                      <Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] px-2 py-0.5 font-bold shadow-2xs hover:bg-amber-100">
                        <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
                        Low Stock
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 font-bold shadow-2xs hover:bg-emerald-50">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                        Healthy
                      </Badge>
                    )}
                  </td>

                  {/* Actions - Sticky Right */}
                  <td
                    className={`py-3.5 px-4 text-right whitespace-nowrap min-w-[125px] sticky right-0 z-10 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] border-l border-b border-cream-border/60 transition-colors ${isSelected
                        ? "bg-[#faf6ee] group-hover:bg-[#f5efdf]"
                        : "bg-white group-hover:bg-[#fcfaf7]"
                      }`}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onAdjustStock(item)}
                        className="h-8 px-2.5 text-xs font-bold text-secondary-700 border-secondary-200 hover:bg-secondary-50 bg-white shadow-2xs cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
                        Adjust
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewHistory(item)}
                        className="h-8 w-8 text-neutral-500 hover:text-neutral-900 cursor-pointer"
                        title="View Movement History"
                      >
                        <History className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

      {/* Unified Sticky / Pinned Footer */}
      {footer && (
        <div className="sticky bottom-0 z-20 flex-shrink-0 border-t border-cream-border bg-white shadow-[0_-2px_6px_rgba(0,0,0,0.03)]">
          {footer}
        </div>
      )}
    </div>
  );
}
