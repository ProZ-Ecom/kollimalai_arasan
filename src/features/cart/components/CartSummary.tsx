"use client";

import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, cn } from "@/lib/utils";
import type { CartSummary as CartSummaryType } from "../types";

interface CartSummaryProps {
  summary: CartSummaryType;
  onCheckout?: () => void;
  isCheckingOut?: boolean;
  isAdminUser?: boolean;
}

function CartSummary({
  summary,
  onCheckout,
  isCheckingOut = false,
  isAdminUser = false,
}: CartSummaryProps) {
  const freeShippingThreshold = 500;
  const subtotal = Number(summary.subtotal || 0);
  const discount = Number(summary.discount || 0);
  const effectiveSubtotal = Math.max(0, subtotal - discount);
  const remainingForFreeShipping = Math.max(
    0,
    freeShippingThreshold - effectiveSubtotal
  );
  const progressPercent = Math.min(
    100,
    Math.round((effectiveSubtotal / freeShippingThreshold) * 100)
  );

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-surface shadow-xs overflow-hidden">
      {/* Header */}
      <div className="border-b border-theme-border-subtle bg-theme-surface-alt px-5 py-4">
        <h2 className="text-base font-bold text-theme-text-primary flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-theme-secondary" />
          Order Summary
        </h2>
      </div>

      <div className="p-5 space-y-5">
        {/* Free Shipping Progress */}
        <div className="rounded-xl border border-theme-border-subtle bg-theme-surface-alt p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="flex items-center gap-1.5 text-theme-primary">
              <Truck className="h-3.5 w-3.5 text-theme-secondary" />
              {remainingForFreeShipping > 0
                ? `Add ${formatPrice(remainingForFreeShipping)} more for FREE delivery`
                : "You unlocked FREE Standard Delivery!"}
            </span>
            <span className="text-theme-text-muted font-semibold">
              {progressPercent}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-theme-border">
            <div
              className="h-full rounded-full bg-theme-secondary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Pricing Breakdown */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-theme-text-subtle">
              Subtotal ({summary.totalItems} items)
            </span>
            <span className="font-semibold text-theme-text-primary">
              {formatPrice(summary.subtotal)}
            </span>
          </div>

          {summary.discount > 0 && (
            <div className="flex justify-between text-theme-status-del-fg">
              <span>Special Discount</span>
              <span className="font-semibold">
                -{formatPrice(summary.discount)}
              </span>
            </div>
          )}

          {summary.tax > 0 && (
            <div className="flex justify-between text-theme-text-subtle">
              <span>Taxes & GST</span>
              <span className="font-medium">{formatPrice(summary.tax)}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-sm">
            <span className="text-theme-text-subtle">Delivery Charges</span>
            {summary.shippingCharge === 0 || remainingForFreeShipping === 0 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-theme-status-del-bg text-theme-status-del-fg font-bold text-xs">
                FREE
              </span>
            ) : (
              <span className="font-semibold text-theme-text-primary">
                {formatPrice(summary.shippingCharge)}
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-theme-border-subtle" />

        {/* Grand Total */}
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-base font-bold text-theme-text-primary">Grand Total</div>
            <div className="text-xs text-theme-text-muted">
              Inclusive of all taxes
            </div>
          </div>
          <div className="text-2xl font-extrabold text-theme-primary">
            {formatPrice(summary.grandTotal)}
          </div>
        </div>

        {/* Admin Warning Banner */}
        {isAdminUser && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-amber-900 text-xs font-medium space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-800 text-xs sm:text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>Admin Account Detected</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              You are admin kindly comes with customer login to place orders.
            </p>
          </div>
        )}

        {/* Checkout CTA */}
        {onCheckout && (
          <Button
            type="button"
            className={cn(
              "w-full h-12 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2",
              isAdminUser
                ? "bg-neutral-200 text-neutral-500 cursor-not-allowed border border-neutral-300 shadow-none hover:bg-neutral-200"
                : "bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-fg hover:shadow-md cursor-pointer"
            )}
            onClick={isAdminUser ? undefined : onCheckout}
            disabled={isAdminUser || isCheckingOut || summary.totalItems === 0}
          >
            <span>
              {isAdminUser
                ? "Checkout Disabled for Admin"
                : isCheckingOut
                ? "Preparing Order..."
                : "Proceed to Checkout"}
            </span>
            {!isAdminUser && <ArrowRight className="h-4 w-4" />}
          </Button>
        )}

        {/* Trust & Guarantee Badges */}
        <div className="pt-2 space-y-2 border-t border-theme-border-subtle">
          <div className="flex items-center gap-2 text-xs text-theme-text-subtle">
            <ShieldCheck className="h-4 w-4 text-theme-status-del-fg shrink-0" />
            <span>100% Authentic Kolli Hills Spices & Natural Products</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-theme-text-subtle">
            <Lock className="h-4 w-4 text-theme-status-out-fg shrink-0" />
            <span>Encrypted 256-bit Secure Checkout</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export { CartSummary };

