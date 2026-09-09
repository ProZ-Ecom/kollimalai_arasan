"use client";

import Link from "next/link";
import { getImageUrl, formatPrice } from "@/lib/utils";
import { ProductImage } from "@/components/common/ProductImage";
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
              <p className="font-medium text-sm text-foreground truncate block">
                {item.productName}
              </p>
              {variantText && (
                <p className="text-xs text-muted-foreground">{variantText}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Qty: {item.quantity}
                {compact && (
                  <span className="ml-2 font-medium text-foreground">
                    {formatPrice(unitPrice)}
                  </span>
                )}
              </p>
            </div>

            {!compact && (
              <div className="text-right shrink-0">
                <p className="text-sm font-medium">{formatPrice(totalPrice)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(unitPrice)} x {item.quantity}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
