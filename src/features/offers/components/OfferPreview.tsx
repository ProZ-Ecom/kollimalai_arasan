"use client";

import * as React from "react";
import { Eye, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { priceLine } from "../services/offer-calculation";
import { OFFER_TYPE_LABELS } from "../constants/offer-options";
import type { ApplicableOffer, OfferItemTarget, OfferLevel, OfferType } from "../types";
import { formatDate } from "@/lib/utils";

interface OfferPreviewProps {
  level: OfferLevel;
  type: OfferType;
  value: number;
  buyQuantity?: number | null;
  getQuantity?: number | null;
  minQuantity: number;
  maxQuantity?: number | null;
  maxDiscountAmount?: number | null;
  startsAt: string;
  endsAt: string;
  /** Real pack sizes to price, so the preview shows actual money. */
  sampleItems: OfferItemTarget[];
}


/**
 * Runs the real offer engine against the admin's current form values, so the
 * numbers previewed here are the same ones the storefront would charge - not
 * a second, drifting implementation of the discount maths.
 */
export function OfferPreview({
  level,
  type,
  value,
  buyQuantity,
  getQuantity,
  minQuantity,
  maxQuantity,
  maxDiscountAmount,
  startsAt,
  endsAt,
  sampleItems,
}: OfferPreviewProps) {
  const draftOffer = React.useMemo<ApplicableOffer>(
    () => ({
      id: "preview",
      internalId: BigInt(0),
      name: "Preview",
      code: null,
      level,
      type,
      value: Number(value) || 0,
      buyQuantity: buyQuantity ?? null,
      getQuantity: getQuantity ?? null,
      minQuantity: Number(minQuantity) || 1,
      maxQuantity: maxQuantity ?? null,
      // The preview quotes a single line, so a cart-value gate can't be
      // judged here; it is enforced for real at cart and checkout.
      minCartValue: null,
      maxDiscountAmount: maxDiscountAmount ?? null,
      priority: 0,
      terms: null,
      // Dates are previewed as if the offer were live, so the admin sees what
      // it will do once its window opens rather than a blank row.
      startsAt: null,
      endsAt: null,
      isActive: true,
    }),
    [level, type, value, buyQuantity, getQuantity, minQuantity, maxQuantity, maxDiscountAmount]
  );

  const rows = React.useMemo(() => {
    // Quantity is the minimum that unlocks the offer, so quantity-gated and
    // Buy X Get Y offers preview meaningfully instead of showing no discount.
    const quantity = Math.max(
      Number(minQuantity) || 1,
      type === "bxgy" ? (buyQuantity ?? 0) + (getQuantity ?? 0) : 1
    );

    return sampleItems.slice(0, 5).map((item) => ({
      item,
      quantity,
      result: priceLine([draftOffer], {
        itemId: item.id,
        unitPrice: item.basePrice,
        quantity,
      }),
    }));
  }, [sampleItems, draftOffer, minQuantity, type, buyQuantity, getQuantity]);

  const hasSamples = rows.length > 0;
  const nothingApplies = hasSamples && rows.every((row) => !row.result.offerApplied);

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
          <Eye className="h-4 w-4 text-neutral-500" />
          Offer preview
        </h3>
        <Badge variant="info" className="text-[10px]">
          {OFFER_TYPE_LABELS[type]}
        </Badge>
      </div>

      <p className="mb-3 text-xs text-neutral-500">
        Valid {formatDate(startsAt, { style: "medium", fallback: "-" })} — {formatDate(endsAt, { style: "medium", fallback: "-" })}
        {(Number(minQuantity) || 1) > 1 && ` · from ${minQuantity} units`}
        {maxQuantity ? ` · up to ${maxQuantity} units` : ""}
      </p>

      {!hasSamples ? (
        <p className="rounded-lg border border-dashed border-neutral-300 bg-white px-3 py-6 text-center text-xs text-neutral-500">
          Select a product or item above to preview the discounted price.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead>
              <tr className="text-neutral-500">
                <th className="pb-2 pr-3 font-medium">Item</th>
                <th className="pb-2 pr-3 font-medium">Qty</th>
                <th className="pb-2 pr-3 font-medium">Original</th>
                <th className="pb-2 pr-3 font-medium">Discount</th>
                <th className="pb-2 font-medium">Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {rows.map(({ item, quantity, result }) => (
                <tr key={item.id} className="align-middle">
                  <td className="py-2 pr-3">
                    <span className="block truncate font-medium text-neutral-900">
                      {item.label || item.sku}
                    </span>
                    <span className="block text-[11px] text-neutral-500">{item.sku}</span>
                  </td>
                  <td className="py-2 pr-3 text-neutral-600">{quantity}</td>
                  <td className="py-2 pr-3 text-neutral-500 line-through">
                    ₹{result.originalLineTotal.toFixed(2)}
                  </td>
                  <td className="py-2 pr-3 font-medium text-emerald-700">
                    {result.discountAmount > 0
                      ? `−₹${result.discountAmount.toFixed(2)} (${result.discountPercent}%)`
                      : "—"}
                  </td>
                  <td className="py-2 font-semibold text-neutral-900">
                    ₹{result.finalLineTotal.toFixed(2)}
                    {result.freeQuantity > 0 && (
                      <span className="ml-1 text-[11px] font-medium text-emerald-700">
                        +{result.freeQuantity} free
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sampleItems.length > rows.length && (
            <p className="mt-2 text-[11px] text-neutral-500">
              Showing {rows.length} of {sampleItems.length} selected items.
            </p>
          )}
        </div>
      )}

      {nothingApplies && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          This offer produces no discount on the selected items. Check the
          discount value against their prices.
        </p>
      )}
    </div>
  );
}
