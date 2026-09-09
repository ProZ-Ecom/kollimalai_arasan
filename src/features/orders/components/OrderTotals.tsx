"use client";

import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { OrderTotals } from "../types";

interface OrderTotalsProps {
  totals: OrderTotals;
  couponLabel?: string | null;
  className?: string;
}

export function OrderTotals({ totals, couponLabel, className }: OrderTotalsProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-medium">{formatPrice(totals.subtotal)}</span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Tax</span>
        <span className="font-medium">{formatPrice(totals.taxAmount)}</span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Delivery Charge</span>
        <span className="font-medium">
          {totals.shippingAmount === 0
            ? "Free"
            : formatPrice(totals.shippingAmount)}
        </span>
      </div>

      {totals.discountAmount > 0 && (
        <div className="flex items-center justify-between text-sm text-green-600">
          <span>
            Coupon Discount
            {couponLabel ? ` (${couponLabel})` : ""}
          </span>
          <span className="font-medium">
            - {formatPrice(totals.discountAmount)}
          </span>
        </div>
      )}

      <div className="border-t pt-3 flex items-center justify-between">
        <span className="font-semibold">Grand Total</span>
        <span className="text-lg font-bold">{formatPrice(totals.totalAmount)}</span>
      </div>
    </div>
  );
}
