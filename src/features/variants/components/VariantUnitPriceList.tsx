"use client";

import React, { useState, useRef } from "react";
import { Plus, Pencil, Trash2, Star, Loader2, Tag, Package, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useUnits } from "@/features/units/hooks";
import type { AdminUnitResponse } from "@/features/units/types";
import {
  useVariantUnitPrices,
  useCreateVariantUnitPrice,
  useUpdateVariantUnitPrice,
  useDeleteVariantUnitPrice,
} from "../hooks";
import type { VariantUnitPriceResponse } from "../types";

interface UnitPriceRowFormState {
  unitId: string;
  unitValue: string;
  sku: string;
  basePrice: string;
  stock: string;
  isDefault: boolean;
  isActive: boolean;
}

const emptyRow: UnitPriceRowFormState = {
  unitId: "",
  unitValue: "",
  sku: "",
  basePrice: "",
  stock: "",
  isDefault: false,
  isActive: true,
};

interface VariantUnitPriceListProps {
  productUuid: string;
  variantUuid: string;
}

/**
 * Manages the (unit, price, stock) combinations for a single item/variant, e.g.
 * "500g @ Rs.99, stock: 25" and "1kg @ Rs.180, stock: 10" under the same item.
 * Selling price is not collected here - the storefront computes it from basePrice
 * minus any active offer/discount.
 *
 * The inline stock input on each row is designed for quick local / walk-in sales
 * adjustments without opening the full edit form.
 */
function VariantUnitPriceList({ productUuid, variantUuid }: VariantUnitPriceListProps) {
  const { data: unitPrices = [], isLoading } = useVariantUnitPrices(productUuid, variantUuid);
  const { data: unitsData } = useUnits({ pageSize: 100 });
  const units = unitsData?.data ?? [];

  const createMutation = useCreateVariantUnitPrice();
  const updateMutation = useUpdateVariantUnitPrice();
  const deleteMutation = useDeleteVariantUnitPrice();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UnitPriceRowFormState>(emptyRow);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VariantUnitPriceResponse | null>(null);

  // Inline stock editing state — keyed by unit price ID
  const [inlineStockValues, setInlineStockValues] = useState<Record<string, string>>({});
  const [savingInlineStockId, setSavingInlineStockId] = useState<string | null>(null);
  const inlineInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const resetForm = () => {
    setForm(emptyRow);
    setFormError(null);
    setIsAdding(false);
    setEditingId(null);
  };

  const startAdd = () => {
    const hasDefault = unitPrices.some((up) => up.isDefault);
    setForm({
      ...emptyRow,
      isDefault: !hasDefault,
    });
    setFormError(null);
    setEditingId(null);
    setIsAdding(true);
  };

  const startEdit = (item: VariantUnitPriceResponse) => {
    setForm({
      unitId: item.unitId,
      unitValue: String(item.unitValue ?? ""),
      sku: item.sku,
      basePrice: String(item.basePrice ?? ""),
      stock: item.stock !== undefined ? String(item.stock) : "",
      isDefault: item.isDefault,
      isActive: item.isActive,
    });
    setFormError(null);
    setIsAdding(false);
    setEditingId(item.id);
  };

  const isBusy = createMutation.isPending || updateMutation.isPending;

  const handleSave = async () => {
    setFormError(null);

    if (!form.unitId) {
      setFormError("Please select a unit");
      return;
    }
    const unitValue = Number(form.unitValue);
    if (!unitValue || unitValue <= 0) {
      setFormError("Pack size must be greater than 0");
      return;
    }
    if (!form.sku.trim()) {
      setFormError("SKU is required");
      return;
    }
    const basePrice = Number(form.basePrice);
    if (Number.isNaN(basePrice) || basePrice < 0) {
      setFormError("Base price must be a non-negative number");
      return;
    }

    const stockNum = form.stock.trim() !== "" ? Number(form.stock) : 0;
    if (Number.isNaN(stockNum) || !Number.isInteger(stockNum) || stockNum < 0) {
      setFormError("Stock must be a non-negative whole number");
      return;
    }

    const hasExistingDefault = unitPrices.some(
      (up) => up.isDefault && up.id !== editingId
    );
    const resolvedIsDefault = form.isDefault || !hasExistingDefault;

    const payload = {
      unitId: form.unitId,
      unitValue,
      sku: form.sku.trim(),
      basePrice,
      isDefault: resolvedIsDefault,
      isActive: form.isActive,
      stock: stockNum,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          productUuid,
          variantUuid,
          unitPriceUuid: editingId,
          data: payload,
        });
      } else {
        await createMutation.mutateAsync({
          productUuid,
          variantUuid,
          data: payload,
        });
      }
      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save unit price";
      setFormError(message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync({
        productUuid,
        variantUuid,
        unitPriceUuid: deleteTarget.id,
      });
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete unit price", err);
    }
  };

  // ── Inline stock editing ──────────────────────────────────────────────────
  const getInlineStock = (item: VariantUnitPriceResponse) => {
    if (item.id in inlineStockValues) return inlineStockValues[item.id];
    return item.stock !== undefined ? String(item.stock) : "";
  };

  const handleInlineStockSave = async (item: VariantUnitPriceResponse) => {
    const raw = inlineStockValues[item.id];
    if (raw === undefined) return; // no change
    const trimmed = raw.trim();
    const current = item.stock !== undefined ? String(item.stock) : "";
    if (trimmed === current) {
      // No real change — clear dirty state
      setInlineStockValues((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      return;
    }

    const stockNum = trimmed === "" ? 0 : Number(trimmed);
    if (Number.isNaN(stockNum) || !Number.isInteger(stockNum) || stockNum < 0) return;

    setSavingInlineStockId(item.id);
    try {
      await updateMutation.mutateAsync({
        productUuid,
        variantUuid,
        unitPriceUuid: item.id,
        data: { stock: stockNum },
      });
      setInlineStockValues((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    } catch (err) {
      console.error("Failed to update stock", err);
    } finally {
      setSavingInlineStockId(null);
    }
  };

  const showForm = isAdding || Boolean(editingId);

  return (
    <div className="bg-white border border-cream-border rounded-2xl overflow-hidden shadow-xs">
      <div className="px-6 py-4.5 border-b border-cream-border flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-neutral-900 tracking-tight flex items-center gap-2">
          <Tag className="w-4 h-4 text-secondary-600" />
          <span>Units &amp; Pricing</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cream-200 text-neutral-600 border border-cream-border">
            {unitPrices.length}
          </span>
        </h2>

        {!showForm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={startAdd}
            className="h-8 text-xs font-semibold text-secondary-700 hover:text-secondary-900 hover:bg-secondary-50 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Add unit + price</span>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="p-6 flex items-center justify-center text-neutral-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : (
        <div className="divide-y divide-cream-border-subtle">
          {unitPrices.length === 0 && !showForm && (
            <div className="py-8 px-6 text-center text-xs text-neutral-500">
              No unit / price combinations yet. Add one to make this item purchasable.
            </div>
          )}

          {unitPrices.map((item) => {
            const isSavingStock = savingInlineStockId === item.id;
            const inlineVal = getInlineStock(item);
            const isDirty = item.id in inlineStockValues;
            const stockNum = item.stock ?? 0;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-cream-50 transition-colors"
              >
                {/* Left: measurement info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-neutral-900">
                        {item.measurement?.value} {item.unitCode || item.measurement?.unit}
                      </span>
                      {item.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold">
                          <Star className="w-3 h-3" /> Default
                        </span>
                      )}
                      {!item.isActive && (
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 text-[10px] font-bold border border-neutral-200">
                          Inactive
                        </span>
                      )}
                      {stockNum === 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                          Out of Stock
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-500 font-mono truncate">
                      SKU: {item.sku}
                    </span>
                  </div>
                </div>

                {/* Right: inline stock + price + actions */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Inline stock editor */}
                  <div className="flex items-center gap-1.5 group/stock">
                    <Package className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <div className="relative flex items-center">
                      <input
                        ref={(el) => { inlineInputRefs.current[item.id] = el; }}
                        type="number"
                        min="0"
                        step="1"
                        value={inlineVal}
                        onChange={(e) =>
                          setInlineStockValues((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        onBlur={() => handleInlineStockSave(item)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.currentTarget.blur();
                          }
                          if (e.key === "Escape") {
                            setInlineStockValues((prev) => {
                              const next = { ...prev };
                              delete next[item.id];
                              return next;
                            });
                            e.currentTarget.blur();
                          }
                        }}
                        className={`w-16 h-7 px-2 text-xs font-mono text-center rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-secondary-600/20 focus:border-secondary-500
                          ${stockNum === 0 && !isDirty
                            ? "bg-rose-50 border-rose-200 text-rose-700 font-bold"
                            : stockNum <= 5 && !isDirty
                              ? "bg-amber-50 border-amber-200 text-amber-700"
                              : "bg-neutral-50 border-neutral-200 text-neutral-800"
                          } ${isDirty ? "border-secondary-400 bg-white" : ""}`}
                        title="Click to edit stock. Press Enter or click away to save."
                        aria-label={`Stock quantity for ${item.sku}`}
                      />
                      {isSavingStock && (
                        <span className="absolute -right-5">
                          <Loader2 className="w-3 h-3 animate-spin text-secondary-600" />
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-400 hidden sm:inline select-none">
                      {stockNum === 0 ? "out" : "units"}
                    </span>
                  </div>

                  {/* Price */}
                  <span className="text-sm font-bold text-secondary-900 font-mono min-w-[52px] text-right">
                    ₹{item.basePrice.toLocaleString("en-IN")}
                  </span>

                  {/* Edit / Delete */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(item)}
                      className="h-8 w-8 text-neutral-500 hover:text-secondary-700 hover:bg-secondary-50"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(item)}
                      className="h-8 w-8 text-neutral-500 hover:text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {showForm && (
            <div className="p-6 bg-cream-50/60 space-y-4">
              <p className="text-xs text-neutral-500 -mt-1">
                Add one row for every pack size you sell this item in — e.g. 250 Grams, 500
                Grams and 1 Kilogram can each have their own price and quantity.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={form.unitId}
                    onValueChange={(val) => setForm((f) => ({ ...f, unitId: val }))}
                    placeholder="Select unit"
                    className="h-10 rounded-lg text-sm"
                    options={units.map((u: AdminUnitResponse) => ({
                      value: u.id,
                      label: `${u.name} (${u.code})`,
                    }))}
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    What is it measured in — Grams, Kilograms, Millilitres, or just a count.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                    Pack Size <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={form.unitValue}
                    onChange={(e) => setForm((f) => ({ ...f, unitValue: e.target.value }))}
                    placeholder="e.g. 500"
                    className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary-600/20 focus:border-secondary-600"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    How much is in one pack, in the unit chosen on the left — e.g. 500 for a
                    500 Gram pack.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                    SKU (pack code) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                    placeholder="e.g. MIXTURE-500G"
                    className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-secondary-600/20 focus:border-secondary-600"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    A unique code just for this pack size. No two packs, even of the same item,
                    can share a code.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                    Price per pack (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={form.basePrice}
                    onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
                    placeholder="e.g. 260"
                    className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary-600/20 focus:border-secondary-600"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    What the customer pays for one pack of this size. Offers/discounts, if any,
                    are applied automatically on top.
                  </p>
                </div>
              </div>

              {/* Stock quantity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                    Stock Quantity
                    <span className="ml-1.5 text-[10px] font-normal text-neutral-400">(optional)</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                    placeholder="e.g. 50"
                    className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary-600/20 focus:border-secondary-600"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    How many packs of this size you currently have. Leave blank to track manually later.
                    When it reaches 0, this item is auto-marked Out of Stock.
                  </p>
                  {(!form.stock.trim() || Number(form.stock) === 0) && (
                    <div className="mt-2.5 flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs shadow-2xs animate-in fade-in duration-200">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-semibold text-amber-950">
                          Out of Stock Warning
                        </p>
                        <p className="text-amber-800 leading-relaxed">
                          No stock entered — this pack size will be saved as{" "}
                          <span className="font-bold text-rose-700">Out of Stock</span>.
                          You can add inventory stock later anytime from the <strong>Inventory</strong> dashboard.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                    className="rounded border-neutral-300"
                  />
                  Show this size first (default)
                </label>

                <label className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="rounded border-neutral-300"
                  />
                  Active (customers can buy this size)
                </label>
              </div>

              {formError && (
                <p className="text-xs text-red-500 font-medium">{formError}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={resetForm} disabled={isBusy}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isBusy}
                  className="bg-[var(--color-secondary-600)] text-white hover:bg-[var(--color-secondary-700)]"
                >
                  {isBusy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : null}
                  {editingId ? "Save Changes" : "Add"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Unit Price"
        description={`Are you sure you want to delete the "${deleteTarget?.sku}" unit price? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

export { VariantUnitPriceList };
