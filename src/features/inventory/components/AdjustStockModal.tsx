"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  Package,
  ArrowRight,
  AlertCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { FormModal } from "@/components/common/FormModal";
import { Select, type SelectOption } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/Toast";
import { useAdjustStock } from "../hooks";
import type { InventoryListItem, InventoryTransactionType } from "../types";

interface AdjustStockModalProps {
  item: InventoryListItem | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const transactionTypeOptions: SelectOption[] = [
  { value: "PURCHASE", label: "Restock / Purchase (Stock In)" },
  { value: "ADJUSTMENT", label: "Count Correction / Adjustment" },
  { value: "RETURN", label: "Customer Return (Stock In)" },
  { value: "DAMAGE", label: "Damaged / Expired (Stock Out)" },
  { value: "TRANSFER", label: "Internal Transfer (Stock Out)" },
];

export function AdjustStockModal({
  item,
  open,
  onClose,
  onSuccess,
}: AdjustStockModalProps) {
  const [type, setType] = useState<InventoryTransactionType>("PURCHASE");
  const [deltaQty, setDeltaQty] = useState<number>(0);
  const [reorderLevel, setReorderLevel] = useState<number>(5);
  const [releaseReserved, setReleaseReserved] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");

  const adjustStockMutation = useAdjustStock();

  useEffect(() => {
    if (item) {
      setReorderLevel(item.reorderLevel > 0 ? item.reorderLevel : 5);
      setDeltaQty(0);
      setReleaseReserved(false);
      setNotes("");
    }
  }, [item]);

  const currentAvailable = item?.availableQuantity ?? 0;
  const currentReserved = item?.reservedQuantity ?? 0;

  // Compute final quantity based on operation type
  const effectiveChange = useMemo(() => {
    if (type === "DAMAGE" || type === "TRANSFER") {
      return -Math.abs(deltaQty);
    }
    return deltaQty;
  }, [type, deltaQty]);

  const newAvailable = Math.max(
    0,
    currentAvailable + effectiveChange + (releaseReserved ? currentReserved : 0)
  );
  const isNegativeStock = currentAvailable + effectiveChange < 0;

  const quickPresets = [
    { label: "+10", val: 10 },
    { label: "+25", val: 25 },
    { label: "+50", val: 50 },
    { label: "+100", val: 100 },
    { label: "-5", val: -5 },
    { label: "-10", val: -10 },
  ];

  const reorderPresets = [
    { label: "< 5 units", val: 5 },
    { label: "< 10 units", val: 10 },
    { label: "< 25 units", val: 25 },
    { label: "< 50 units", val: 50 },
    { label: "< 100 units", val: 100 },
  ];

  const hasModifications =
    deltaQty !== 0 ||
    reorderLevel !== (item?.reorderLevel || 5) ||
    releaseReserved;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    if (!hasModifications) {
      toast.error("Please enter a quantity, adjust the reorder limit, or release reserved units.");
      return;
    }

    if (isNegativeStock) {
      toast.error(
        `Insufficient stock. Available: ${currentAvailable}, requested reduction: ${Math.abs(effectiveChange)}`
      );
      return;
    }

    try {
      await adjustStockMutation.mutateAsync({
        inventoryId: item.id,
        type,
        quantity: effectiveChange,
        reorderLevel,
        releaseReserved: releaseReserved ? true : undefined,
        notes: notes.trim() || undefined,
      });

      toast.success(
        `Inventory updated for ${item.productName} (${item.unitLabel}): Available: ${newAvailable}, Reorder Alert Limit: ${reorderLevel}`
      );
      onClose();
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || "Failed to adjust stock. Please try again.");
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Adjust Inventory & Stock Thresholds"
      description="Update warehouse quantity, modify low stock alert limits, and manage reserved holds"
      size="md"
    >
      {item && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Preview Card */}
          <div className="flex items-center gap-3.5 p-3.5 bg-cream-50/70 border border-cream-border rounded-xl">
            <div className="w-12 h-12 rounded-lg bg-cream-100 border border-cream-border flex items-center justify-center overflow-hidden shrink-0 relative">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.productName}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <Package className="w-5 h-5 text-neutral-400" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-neutral-900 truncate">
                {item.productName}
              </h4>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500">
                <span className="font-semibold text-secondary-700 bg-secondary-50 px-2 py-0.5 rounded border border-secondary-200">
                  {item.unitLabel}
                </span>
                {item.sku && (
                  <span className="font-mono text-neutral-400">
                    SKU: {item.sku}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-right shrink-0">
              <div>
                <div className="text-[10px] text-neutral-400 font-medium">
                  Available
                </div>
                <div className="text-sm font-bold font-mono text-neutral-900">
                  {currentAvailable.toLocaleString("en-IN")}
                </div>
              </div>
              {currentReserved > 0 && (
                <div>
                  <div className="text-[10px] text-blue-500 font-medium">
                    Reserved
                  </div>
                  <div className="text-sm font-bold font-mono text-blue-600">
                    {currentReserved.toLocaleString("en-IN")}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 1: Low Stock Alert Limit (Admin customizable <10, <50, etc.) */}
          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Low Stock Alert Limit (Reorder Level)
              </label>
              <span className="text-[11px] font-mono text-amber-800">
                Current: &le; {item.reorderLevel > 0 ? item.reorderLevel : 5} units
              </span>
            </div>

            <p className="text-[11px] text-amber-800/90 leading-relaxed">
              Triggers a Low Stock warning banner and adds to Low Stock Alerts whenever available units fall to or below this number.
            </p>

            <div className="flex items-center gap-1.5 flex-wrap">
              {reorderPresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setReorderLevel(preset.val)}
                  className={`px-2 py-1 text-xs font-bold font-mono rounded-lg border transition-all cursor-pointer ${
                    reorderLevel === preset.val
                      ? "bg-amber-600 text-white border-amber-700 shadow-xs"
                      : "bg-white text-neutral-700 border-amber-200 hover:border-amber-400 hover:bg-amber-50"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-neutral-600">
                Custom Limit:
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(Math.max(0, Number(e.target.value) || 0))}
                className="w-28 h-8 px-2.5 text-xs font-mono font-bold text-neutral-900 bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
              <span className="text-xs text-neutral-500">units</span>
            </div>
          </div>

          {/* Section 2: Reserved Stock Access & Release (Admin action) */}
          {currentReserved > 0 && (
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Reserved Stock Hold ({currentReserved} units)
                </span>
                <span className="text-[11px] text-blue-700">
                  Allocated in pending orders
                </span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Reserved units are automatically subtracted when orders are delivered or released when orders are cancelled. As an admin, you can manually release them back to available stock.
              </p>
              <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={releaseReserved}
                  onChange={(e) => setReleaseReserved(e.target.checked)}
                  className="rounded border-blue-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-blue-900 flex items-center gap-1">
                  <RotateCcw className="w-3 h-3 text-blue-600" />
                  Release all {currentReserved} reserved units back to Available Stock
                </span>
              </label>
            </div>
          )}

          {/* Section 3: Stock Quantity Adjustment */}
          <div className="space-y-3 pt-1 border-t border-cream-border/70">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700">
                Adjustment Reason / Movement Type
              </label>
              <Select
                options={transactionTypeOptions}
                value={type}
                onValueChange={(val) => setType(val as InventoryTransactionType)}
                size="md"
              />
            </div>

            {/* Quick Increment Preset Chips */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-700">
                  Add / Deduct Quantity (Leave 0 to only change limits)
                </label>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {quickPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      if (preset.val < 0) {
                        setType("DAMAGE");
                        setDeltaQty(Math.abs(preset.val));
                      } else {
                        if (type === "DAMAGE" || type === "TRANSFER") {
                          setType("PURCHASE");
                        }
                        setDeltaQty(preset.val);
                      }
                    }}
                    className="px-2.5 py-1 text-xs font-bold font-mono rounded-lg border border-cream-border bg-white text-neutral-700 hover:border-secondary-500 hover:text-secondary-700 transition-colors shadow-2xs cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="relative mt-2">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={deltaQty || ""}
                  onChange={(e) => setDeltaQty(Number(e.target.value) || 0)}
                  className="w-full h-10 px-3.5 text-sm font-mono font-bold text-neutral-900 bg-white border border-cream-border rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500/20 focus:border-secondary-500 transition-colors"
                  placeholder="0 (Enter units to adjust)..."
                />
              </div>
            </div>

            {/* Live Balance Preview Banner */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                isNegativeStock
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : "bg-secondary-50/70 border-secondary-200 text-secondary-900"
              }`}
            >
              <div className="flex items-center gap-2">
                {isNegativeStock ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <Package className="w-4 h-4 text-secondary-700 shrink-0" />
                )}
                <span className="font-semibold">
                  {isNegativeStock ? "Stock cannot be negative" : "Calculated Balance:"}
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono font-bold text-sm">
                <span>{currentAvailable}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                <span className={newAvailable >= currentAvailable ? "text-emerald-700" : "text-rose-700"}>
                  {newAvailable}
                </span>
                <span className="text-[11px] font-normal opacity-70">
                  ({newAvailable - currentAvailable >= 0 ? `+${newAvailable - currentAvailable}` : newAvailable - currentAvailable})
                </span>
              </div>
            </div>

            {/* Notes / Reference input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700">
                Reference / Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Set limit <10, restock PO-84920, released reserved hold"
                className="w-full h-10 px-3.5 text-xs text-neutral-800 bg-white border border-cream-border rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500/20 focus:border-secondary-500 transition-colors"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-cream-border/70">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={adjustStockMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={adjustStockMutation.isPending}
              disabled={isNegativeStock || !hasModifications}
              className="bg-secondary-600 hover:bg-secondary-700 text-white font-bold"
            >
              Confirm Changes
            </Button>
          </div>
        </form>
      )}
    </FormModal>
  );
}
