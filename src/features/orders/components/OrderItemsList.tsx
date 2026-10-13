"use client";

import Link from "next/link";
import { getImageUrl, formatPrice } from "@/lib/utils";
import { ProductImage } from "@/components/common/ProductImage";
import { formatMeasurementLabel } from "@/features/variants/utils/measurement.util";
import type { OrderItemResponse, OrderItemDisplay } from "../types";

interface OrderItemsListProps {
  items: (OrderItemResponse | OrderItemDisplay)[];
  compact?: boolean;
}

export function OrderItemsList({
  items,
  compact = false,
}: OrderItemsListProps) {
  if (!items || items.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        No items in this order.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {items.map((item) => {
        const image =
          ("primaryImage" in item ? item.primaryImage : item.image) || null;
        const unitPrice =
          "unitPrice" in item ? item.unitPrice : item.price || 0;
        const totalPrice =
          "totalPrice" in item ? item.totalPrice : item.total || 0;
        const sku = "sku" in item ? item.sku : "";
        const variantText = item.variantName || sku || "";
        const packSize =
          "measurement" in item && item.measurement
            ? formatMeasurementLabel(item.measurement)
            : "";

        return (
          <div key={item.id} className="flex items-center gap-4 py-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              <ProductImage
                src={image ? getImageUrl(image) : null}
                alt={item.productName}
                fallbackText={item.productName}
                containerClassName="w-full h-full"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-foreground truncate block">
                {item.productName}
              </p>
              {variantText && (
                <p className="text-xs text-muted-foreground">{variantText}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {packSize && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-100 text-[11px] font-semibold text-neutral-800 border border-neutral-200">
                    Unit: {packSize}
                  </span>
                )}
                <span className="text-xs text-muted-foreground font-medium">
                  Qty: {item.quantity}
                </span>
                {compact && (
                  <span className="ml-1 font-medium text-foreground">
                    {formatPrice(unitPrice)}
                  </span>
                )}
              </div>
            </div>

            {!compact && (
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-foreground">{formatPrice(totalPrice)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(unitPrice)} {packSize ? `(${packSize}) ` : ""}× {item.quantity}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
