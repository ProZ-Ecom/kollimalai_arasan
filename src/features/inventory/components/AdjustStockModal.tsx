"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Package, ArrowRight, AlertCircle, Plus, Minus } from "lucide-react";
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
  const [deltaQty, setDeltaQty] = useState<number>(10);
  const [notes, setNotes] = useState<string>("");

  const adjustStockMutation = useAdjustStock();

  const currentAvailable = item?.availableQuantity ?? 0;

  // Compute final quantity based on operation type
  const effectiveChange = useMemo(() => {
    if (type === "DAMAGE" || type === "TRANSFER") {
      return -Math.abs(deltaQty);
    }
    return deltaQty;
  }, [type, deltaQty]);

  const newAvailable = Math.max(0, currentAvailable + effectiveChange);
  const isNegativeStock = currentAvailable + effectiveChange < 0;

  const quickPresets = [
    { label: "+10", val: 10 },
    { label: "+25", val: 25 },
    { label: "+50", val: 50 },
    { label: "+100", val: 100 },
    { label: "-5", val: -5 },
    { label: "-10", val: -10 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    if (deltaQty === 0) {
      toast.error("Please enter a non-zero quantity to adjust.");
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
        notes: notes.trim() || undefined,
      });

      toast.success(
        `Stock adjusted for ${item.productName} (${item.unitLabel}): ${currentAvailable} → ${newAvailable}`
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
      title="Adjust Stock Quantity"
      description="Update warehouse inventory with an instant audit log entry"
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

            <div className="text-right shrink-0">
              <div className="text-[11px] text-neutral-400 font-medium">
                Current Stock
              </div>
              <div className="text-base font-bold font-mono text-neutral-900">
                {currentAvailable.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {/* Transaction Type Select */}
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
                Adjustment Quantity
              </label>
              <span className="text-[11px] text-neutral-400">
                Click preset or enter custom value
              </span>
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
                  className="px-2.5 py-1 text-xs font-bold font-mono rounded-lg border border-cream-border bg-white text-neutral-700 hover:border-secondary-500 hover:text-secondary-700 transition-colors shadow-2xs"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="relative mt-2">
              <input
                type="number"
                min="1"
                step="1"
                value={deltaQty || ""}
                onChange={(e) => setDeltaQty(Number(e.target.value) || 0)}
                className="w-full h-11 px-3.5 text-sm font-mono font-bold text-neutral-900 bg-white border border-cream-border rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500/20 focus:border-secondary-500 transition-colors"
                placeholder="Enter units to adjust..."
                required
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
              <span className={effectiveChange >= 0 ? "text-emerald-700" : "text-rose-700"}>
                {newAvailable}
              </span>
              <span className="text-[11px] font-normal opacity-70">
                ({effectiveChange >= 0 ? `+${effectiveChange}` : effectiveChange})
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
              placeholder="e.g. PO-84920, Supplier Restock, Batch #49"
              className="w-full h-10 px-3.5 text-xs text-neutral-800 bg-white border border-cream-border rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500/20 focus:border-secondary-500 transition-colors"
            />
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
              disabled={isNegativeStock || deltaQty === 0}
              className="bg-secondary-600 hover:bg-secondary-700 text-white font-bold"
            >
              Confirm Adjustment
            </Button>
          </div>
        </form>
      )}
    </FormModal>
  );
}
