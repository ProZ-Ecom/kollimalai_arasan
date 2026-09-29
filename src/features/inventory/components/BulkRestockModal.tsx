"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Package,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Sparkles,
} from "lucide-react";
import { FormModal } from "@/components/common/FormModal";
import { Select, type SelectOption } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/Toast";
import { useBulkAdjustStock } from "../hooks";
import type { InventoryListItem, InventoryTransactionType } from "../types";

interface BulkRestockModalProps {
  items: InventoryListItem[];
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const transactionTypeOptions: SelectOption[] = [
  { value: "PURCHASE", label: "Restock / Supplier Purchase (Stock In)" },
  { value: "ADJUSTMENT", label: "Count Correction / Audit (Stock In)" },
  { value: "RETURN", label: "Customer Return (Stock In)" },
];

export function BulkRestockModal({
  items,
  open,
  onClose,
  onSuccess,
}: BulkRestockModalProps) {
  const [restockQty, setRestockQty] = useState<number>(50);
  const [type, setType] = useState<InventoryTransactionType>("PURCHASE");
  const [notes, setNotes] = useState<string>("");

  const bulkAdjustMutation = useBulkAdjustStock();

  const presets = [
    { label: "+10", val: 10 },
    { label: "+25", val: 25 },
    { label: "+50", val: 50 },
    { label: "+100", val: 100 },
    { label: "+250", val: 250 },
    { label: "+500", val: 500 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Please select at least one item to restock.");
      return;
    }

    if (restockQty <= 0) {
      toast.error("Please enter a positive restock quantity.");
      return;
    }

    try {
      const inventoryIds = items.map((i) => i.id);
      const res = await bulkAdjustMutation.mutateAsync({
        inventoryIds,
        quantity: restockQty,
        type,
        notes: notes.trim() || undefined,
      });

      const updatedCount = (res as any)?.data?.updatedCount ?? items.length;
      toast.success(
        `Successfully added +${restockQty} units to ${updatedCount} products!`
      );
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to perform bulk restock. Please try again."
      );
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Bulk Restock Inventory"
      description={`Apply identical stock additions across ${items.length} selected items simultaneously`}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-neutral-500 font-medium">
            Total items affected: <strong className="text-neutral-800">{items.length}</strong>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={bulkAdjustMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={bulkAdjustMutation.isPending || restockQty <= 0 || items.length === 0}
              className="bg-secondary-600 hover:bg-secondary-700 text-white font-bold shadow-xs px-4"
            >
              {bulkAdjustMutation.isPending ? (
                "Applying Restock..."
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  Apply +{restockQty > 0 ? restockQty : 0} to All ({items.length})
                </>
              )}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Banner explanation */}
        <div className="rounded-xl p-3.5 bg-secondary-50/70 border border-secondary-200 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-secondary-100 border border-secondary-300 flex items-center justify-center shrink-0 text-secondary-700">
            <Layers className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-0.5">
            <p className="font-bold text-secondary-900">
              Bulk Restock Mode Active
            </p>
            <p className="text-secondary-700">
              The quantity specified below will be added to each of the {items.length} selected products at the same time. Any &quot;Out of Stock&quot; items will be automatically marked as available.
            </p>
          </div>
        </div>

        {/* Quantity Input with Presets */}
        <div className="rounded-xl border border-cream-border p-4 bg-white shadow-2xs space-y-3">
          <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
            Quantity to Add per Product / Variant
          </label>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                min="1"
                step="1"
                value={restockQty || ""}
                onChange={(e) => setRestockQty(parseInt(e.target.value, 10) || 0)}
                placeholder="e.g. 50"
                className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 font-mono text-lg font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-secondary-600/30 focus:border-secondary-600 transition-all"
                autoFocus
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400">
                Units each
              </span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] font-semibold text-neutral-500 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-secondary-600" /> Presets:
            </span>
            {presets.map((p) => (
              <button
                key={p.val}
                type="button"
                onClick={() => setRestockQty(p.val)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
                  restockQty === p.val
                    ? "bg-secondary-600 text-white border-secondary-600 shadow-2xs"
                    : "bg-cream-50 text-neutral-700 border-cream-border hover:bg-cream-100 hover:border-neutral-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Items Preview List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-neutral-800 uppercase tracking-wider">
              Selected Products ({items.length})
            </span>
            <span className="text-neutral-500 text-[11px]">
              Stock Preview (Current &rarr; New)
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto rounded-xl border border-cream-border divide-y divide-cream-border/70 bg-neutral-50/40">
            {items.map((item) => {
              const current = item.availableQuantity;
              const projected = current + (restockQty > 0 ? restockQty : 0);
              const wasOutOfStock = current === 0;

              return (
                <div
                  key={item.id}
                  className="p-2.5 px-3 flex items-center justify-between gap-3 hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-cream-100 border border-cream-border flex items-center justify-center overflow-hidden shrink-0 relative">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="32px"
                        />
                      ) : (
                        <Package className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-neutral-900 truncate max-w-[200px] sm:max-w-[280px]">
                        {item.productName}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        {item.variantName && (
                          <span className="font-semibold text-neutral-600 capitalize truncate max-w-[140px]">
                            {item.variantName}
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 bg-secondary-100 text-secondary-800 rounded font-semibold border border-secondary-200">
                          {item.unitLabel}
                        </span>
                        <span className="font-mono text-neutral-400">
                          {item.sku}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stock projection */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-mono text-xs font-semibold ${
                        wasOutOfStock ? "text-rose-600" : "text-neutral-500"
                      }`}
                    >
                      {current}
                    </span>
                    <ArrowRight className="w-3 h-3 text-neutral-400" />
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {projected} units
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Movement Type & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Transaction Reason
            </label>
            <Select
              options={transactionTypeOptions}
              value={type}
              onValueChange={(val) => setType(val as InventoryTransactionType)}
              size="sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Internal Reference / Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Kolli Hills fresh batch restock"
              className="w-full h-9 px-3 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-secondary-600 focus:border-secondary-600"
            />
          </div>
        </div>
      </form>
    </FormModal>
  );
}
