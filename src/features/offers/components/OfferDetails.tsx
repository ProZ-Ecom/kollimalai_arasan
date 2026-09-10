"use client";

import * as React from "react";
import { Calendar, Package, Layers, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  OFFER_LEVEL_LABELS,
  OFFER_STATUS_BADGE,
  OFFER_STATUS_LABELS,
  OFFER_TYPE_BADGE,
  OFFER_TYPE_LABELS,
  formatOfferDiscount,
} from "../constants/offer-options";
import type { OfferListItem } from "../types";
import { formatDate } from "@/lib/utils";


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-neutral-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-neutral-900">{children}</dd>
    </div>
  );
}

/** Read-only view of an offer, including everything it targets. */
export function OfferDetails({ offer }: { offer: OfferListItem }) {
  const targets = offer.level === "product" ? offer.products : offer.items;
  const TargetIcon = offer.level === "product" ? Package : Layers;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={OFFER_STATUS_BADGE[offer.status]}>
          {OFFER_STATUS_LABELS[offer.status]}
        </Badge>
        <Badge variant={OFFER_TYPE_BADGE[offer.type]}>{OFFER_TYPE_LABELS[offer.type]}</Badge>
        <Badge variant="outline">{OFFER_LEVEL_LABELS[offer.level]}</Badge>
        {offer.code && (
          <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 font-mono text-xs font-semibold text-neutral-700">
            <Tag className="h-3 w-3" />
            {offer.code}
          </span>
        )}
      </div>

      <dl className="grid gap-4 sm:grid-cols-3">
        <Field label="Discount">{formatOfferDiscount(offer)}</Field>
        <Field label="Priority">{offer.priority}</Field>
        <Field label="Minimum Quantity">{offer.minQuantity}</Field>
        <Field label="Maximum Quantity">{offer.maxQuantity ?? "No limit"}</Field>
        <Field label="Minimum Cart Value">
          {offer.minCartValue != null ? `₹${offer.minCartValue.toFixed(2)}` : "—"}
        </Field>
        <Field label="Maximum Discount">
          {offer.maxDiscountAmount != null ? `₹${offer.maxDiscountAmount.toFixed(2)}` : "No cap"}
        </Field>
      </dl>

      <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700">
        <Calendar className="h-4 w-4 text-neutral-500" />
        <span>
          {formatDate(offer.startsAt, { style: "medium", fallback: "—" })} — {formatDate(offer.endsAt, { style: "medium", fallback: "—" })}
        </span>
      </div>

      <div>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-900">
          <TargetIcon className="h-4 w-4 text-neutral-500" />
          {offer.level === "product" ? "Products covered" : "Items covered"}
          <Badge variant="secondary" className="text-[10px]">
            {targets.length}
          </Badge>
        </h3>

        {targets.length === 0 ? (
          <p className="rounded-lg border border-dashed border-neutral-300 px-3 py-4 text-center text-xs text-neutral-500">
            This offer no longer targets anything — the product or item it
            pointed at may have been removed.
          </p>
        ) : (
          <ul className="max-h-56 divide-y divide-neutral-100 overflow-y-auto rounded-xl border border-neutral-200 scrollbar-thin">
            {offer.level === "product"
              ? offer.products.map((product) => (
                  <li key={product.id} className="px-3 py-2">
                    <span className="block text-sm font-medium text-neutral-900">
                      {product.name}
                    </span>
                    <span className="block text-xs text-neutral-500">
                      {product.categoryName ?? "Uncategorised"}
                    </span>
                  </li>
                ))
              : offer.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-neutral-900">
                        {item.label || item.sku}
                      </span>
                      <span className="block text-xs text-neutral-500">SKU {item.sku}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-neutral-900">
                      ₹{item.basePrice.toFixed(2)}
                    </span>
                  </li>
                ))}
          </ul>
        )}
      </div>

      {offer.terms && (
        <div>
          <h3 className="mb-1.5 text-sm font-semibold text-neutral-900">
            Terms &amp; Conditions
          </h3>
          <p className="whitespace-pre-wrap rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-600">
            {offer.terms}
          </p>
        </div>
      )}

      <p className="text-xs text-neutral-400">
        Created {formatDate(offer.createdAt, { style: "medium", fallback: "—" })} · Last updated {formatDate(offer.updatedAt, { style: "medium", fallback: "—" })}
      </p>
    </div>
  );
}
