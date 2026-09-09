"use client";

import React, { useState } from "react";
import { Plus, Pencil, Trash2, Star, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  isDefault: boolean;
  isActive: boolean;
}

const emptyRow: UnitPriceRowFormState = {
  unitId: "",
  unitValue: "",
  sku: "",
  basePrice: "",
  isDefault: false,
  isActive: true,
};

interface VariantUnitPriceListProps {
  productUuid: string;
  variantUuid: string;
}

/**
 * Manages the (unit, price) combinations for a single item/variant, e.g.
 * "500g @ Rs.99" and "1kg @ Rs.180" under the same item. Selling price is not
 * collected here - the storefront computes it from basePrice minus any
 * active offer/discount.
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

  const resetForm = () => {
    setForm(emptyRow);
    setFormError(null);
    setIsAdding(false);
    setEditingId(null);
  };

  const startAdd = () => {
    setForm(emptyRow);
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

    const payload = {
      unitId: form.unitId,
      unitValue,
      sku: form.sku.trim(),
      basePrice,
      isDefault: form.isDefault,
      isActive: form.isActive,
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

  const showForm = isAdding || Boolean(editingId);

  return (
    <div className="bg-white border border-cream-border rounded-2xl overflow-hidden shadow-xs">
      <div className="px-6 py-4.5 border-b border-cream-border flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-neutral-900 tracking-tight flex items-center gap-2">
          <Tag className="w-4 h-4 text-secondary-600" />
          <span>Units & Pricing</span>
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

          {unitPrices.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 px-6 py-3.5 hover:bg-cream-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
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
                  </div>
                  <span className="text-[11px] text-neutral-500 font-mono truncate">
                    SKU: {item.sku}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <span className="text-sm font-bold text-secondary-900 font-mono">
                  ₹{item.basePrice.toLocaleString("en-IN")}
                </span>
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
          ))}

          {showForm && (
            <div className="p-6 bg-cream-50/60 space-y-4">
              <p className="text-xs text-neutral-500 -mt-1">
                Add one row for every pack size you sell this item in — e.g. 250 Grams, 500
                Grams and 1 Kilogram can each have their own price.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.unitId}
                    onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary-600/20 focus:border-secondary-600"
                  >
                    <option value="">Select unit</option>
                    {units.map((u: AdminUnitResponse) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.code})
                      </option>
                    ))}
                  </select>
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
