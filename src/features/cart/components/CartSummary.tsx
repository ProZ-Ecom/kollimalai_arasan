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
        {/* Weight & Courier Info */}
        <div className="rounded-xl border border-theme-border-subtle bg-theme-surface-alt p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-theme-text-primary font-medium">
            <Truck className="h-4 w-4 text-theme-primary shrink-0" />
            <span>
              Total Weight:{" "}
              <span className="font-bold text-theme-primary">
                {summary.totalWeightKg ? `${summary.totalWeightKg} kg` : "Calculated at checkout"}
              </span>
            </span>
          </div>
          <span className="text-[11px] font-semibold text-theme-text-subtle bg-theme-surface px-2.5 py-0.5 rounded-md border border-theme-border">
            {summary.courierName || "ST Courier"}
          </span>
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
            <div className="space-y-0.5">
              <span className="text-theme-text-subtle">Delivery Charges</span>
              {summary.rateDescription && (
                <span className="block text-[11px] text-theme-text-muted">
                  {summary.rateDescription}
                </span>
              )}
            </div>
            {summary.shippingCharge === 0 ? (
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

