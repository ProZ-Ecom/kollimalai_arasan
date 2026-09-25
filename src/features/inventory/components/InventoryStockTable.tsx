"use client";

import Image from "next/image";
import {
  Package,
  SlidersHorizontal,
  History,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InventoryListItem } from "../types";

interface InventoryStockTableProps {
  items: InventoryListItem[];
  onAdjustStock: (item: InventoryListItem) => void;
  onViewHistory: (item: InventoryListItem) => void;
}

export function InventoryStockTable({
  items,
  onAdjustStock,
  onViewHistory,
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

  return (
    <div className="bg-white rounded-2xl border border-cream-border shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-cream-border bg-neutral-50/60 text-neutral-500 font-semibold tracking-tight">
              <th className="py-3 px-4 sm:px-5">Product & Variant</th>
              <th className="py-3 px-4">SKU</th>
              <th className="py-3 px-4 text-center">Stock Health</th>
              <th className="py-3 px-4 text-right">Available</th>
              <th className="py-3 px-4 text-right">Reserved</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4 text-right">Actions</th>
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

              return (
                <tr
                  key={item.id}
                  className="hover:bg-cream-50/40 transition-colors group"
                >
                  {/* Product + Variant */}
                  <td className="py-3.5 px-4 sm:px-5">
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
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-[11px] font-semibold text-neutral-600 bg-cream-100/70 border border-cream-border px-2 py-0.5 rounded-md">
                      {item.sku || "—"}
                    </span>
                  </td>

                  {/* Stock Health Visual Bar */}
                  <td className="py-3.5 px-4 min-w-[130px]">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-neutral-400">Reorder at {effectiveReorder}</span>
                        <span className="font-mono font-bold text-neutral-700">
                          {item.availableQuantity} units
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${stockPercent}%` }}
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOutOfStock
                              ? "bg-rose-500"
                              : isLowStock
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Available Quantity */}
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`font-mono text-sm font-bold ${
                        isOutOfStock
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
                  <td className="py-3.5 px-4 text-right">
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
                  <td className="py-3.5 px-4 text-center">
                    {isOutOfStock ? (
                      <Badge
                        variant="destructive"
                        className="text-[10px] px-2 py-0.5 font-bold shadow-2xs"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Out of Stock
                      </Badge>
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

                  {/* Warehouse Location */}
                  <td className="py-3.5 px-4">
                    {item.warehouseLocation ? (
                      <div className="flex items-center gap-1 text-[11px] text-neutral-600 font-medium">
                        <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                        <span>{item.warehouseLocation}</span>
                      </div>
                    ) : (
                      <span className="text-neutral-400 font-mono text-xs">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onAdjustStock(item)}
                        className="h-8 px-2.5 text-xs font-bold text-secondary-700 border-secondary-200 hover:bg-secondary-50"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
                        Adjust
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewHistory(item)}
                        className="h-8 w-8 text-neutral-500 hover:text-neutral-900"
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
  );
}
