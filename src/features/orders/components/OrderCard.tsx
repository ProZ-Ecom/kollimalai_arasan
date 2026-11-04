"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ArrowRight, Package, Calendar, Truck, Eye } from "lucide-react";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { ProductImage } from "@/components/common/ProductImage";
import { LiveTrackingModal } from "./LiveTrackingModal";
import type {
  OrderListItem,
  OrderListItemResponse,
  OrderDetailResponse,
} from "../types";

export type AnyOrderListItem =
  | OrderListItem
  | OrderDetailResponse
  | OrderListItemResponse;

interface OrderCardProps {
  order: AnyOrderListItem;
}

function getStatusBadgeMeta(status?: string) {
  switch (status?.toLowerCase()) {
    case "delivered":
      return {
        bg: "bg-secondary-50 text-secondary-700 border-secondary-200",
        dot: "bg-secondary-500",
      };
    case "cancelled":
      return {
        bg: "bg-red-50 text-red-700 border-red-200",
        dot: "bg-red-500",
      };
    case "returned":
      return {
        bg: "bg-purple-50 text-purple-700 border-purple-200",
        dot: "bg-purple-500",
      };
    case "out_for_delivery":
    case "shipped":
      return {
        bg: "bg-blue-50 text-blue-700 border-blue-200",
        dot: "bg-blue-500",
      };
    case "packed":
    case "processing":
      return {
        bg: "bg-primary-50 text-primary-700 border-primary-200",
        dot: "bg-primary-500",
      };
    case "pending":
    case "confirmed":
      return {
        bg: "bg-orange-50 text-orange-700 border-orange-200",
        dot: "bg-orange-500",
      };
    default:
      return {
        bg: "bg-theme-surface-alt text-theme-text-muted border-theme-border",
        dot: "bg-theme-border",
      };
  }
}

function getOrderStepIndex(status?: string) {
  switch (status?.toLowerCase()) {
    case "pending":
    case "confirmed":
      return 0;
    case "processing":
    case "packed":
      return 1;
    case "shipped":
    case "out_for_delivery":
      return 2;
    case "delivered":
    case "returned":
    case "cancelled":
      return 3;
    default:
      return 0;
  }
}

export function OrderCard({ order }: OrderCardProps) {
  const [isLiveTrackingOpen, setIsLiveTrackingOpen] = useState(false);
  const [isStatusTrackingOpen, setIsStatusTrackingOpen] = useState(false);

  const anyOrder = order as any;
  const items: any[] = anyOrder.items ?? [];
  const statusMeta = getStatusBadgeMeta(order.status);
  const totalCount = anyOrder.totalItems ?? items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);

  const statusLower = String(order.status || "").toLowerCase();
  const isOngoing =
    statusLower !== "delivered" &&
    statusLower !== "cancelled" &&
    statusLower !== "returned";

  const awb = anyOrder.delivery?.trackingNumber || anyOrder.delivery?.awb || anyOrder.trackingNumber || null;
  const courierPartner =
    anyOrder.delivery?.deliveryPartner?.name ||
    anyOrder.delivery?.courierPartnerName ||
    anyOrder.courierName ||
    (Number(anyOrder.shippingCharge) === 200 ? "MSS (Mettur Super Services)" : "Shiprocket Express");

  const handleTrackClick = () => {
    if (awb) {
      setIsLiveTrackingOpen(true);
    } else {
      setIsStatusTrackingOpen(true);
    }
  };

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-surface shadow-2xs hover:shadow-md hover:border-theme-border-accent transition-all duration-200 overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-theme-surface-alt border-b border-theme-border-subtle">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div>
            <span className="block text-[10px] uppercase tracking-wider font-semibold text-theme-text-muted">
              Order ID
            </span>
            <span className="font-mono text-xs sm:text-sm font-bold text-theme-text-primary">
              {order.orderNumber || `#${String(order.id).slice(0, 8)}`}
            </span>
          </div>

          <div>
            <span className="block text-[10px] uppercase tracking-wider font-semibold text-theme-text-muted">
              Placed On
            </span>
            <span className="text-xs sm:text-sm font-semibold text-theme-text-primary flex items-center gap-1 mt-0.5">
              <Calendar className="h-3 w-3 text-theme-text-muted shrink-0" />
              {formattedDate}
            </span>
          </div>

          <div>
            <span className="block text-[10px] uppercase tracking-wider font-semibold text-theme-text-muted">
              Total Amount
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-theme-primary">
              {formatPrice(order.totalAmount)}
            </span>
          </div>

          {totalCount > 0 && (
            <div className="hidden sm:block">
              <span className="block text-[10px] uppercase tracking-wider font-semibold text-theme-text-muted">
                Items
              </span>
              <span className="text-xs sm:text-sm font-semibold text-theme-text-primary">
                {totalCount} {totalCount === 1 ? "item" : "items"}
              </span>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide uppercase ${statusMeta.bg}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
            {String(order.status).replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Ordered Items Breakdown */}
      <div className="px-5 py-4 divide-y divide-theme-border-subtle">
        {items.length > 0 ? (
          items.map((item: any, idx: number) => {
            const imgSrc =
              item.primaryImage ||
              item.image ||
              item.productImage ||
              item.variant?.product_variant_images?.[0]?.image_url ||
              item.product?.images?.[0]?.image_url ||
              null;
            const productName = item.productName || item.product_name_snapshot || "Product Item";
            const variantName = item.variantName || item.variant_snapshot || "";
            const quantity = item.quantity || 1;
            const unitPrice = item.unitPrice || item.unit_price;
            const totalPrice = item.totalPrice || item.total_price || (unitPrice ? unitPrice * quantity : null);

            return (
              <div
                key={item.id || idx}
                className="flex items-center gap-3.5 py-3 first:pt-0 last:pb-0"
              >
                {/* Product Thumbnail with Fallback */}
                <div className="relative h-13 w-13 sm:h-14 sm:w-14 rounded-xl border border-theme-border-subtle bg-theme-surface-alt shrink-0 overflow-hidden">
                  <ProductImage
                    src={imgSrc}
                    alt={productName}
                    fallbackText={productName}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Product & Variant Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-theme-text-primary truncate">
                    {productName}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-theme-text-subtle">
                    {variantName && (
                      <span className="font-medium text-theme-text-secondary">
                        {variantName}
                      </span>
                    )}
                    {variantName && <span>•</span>}
                    <span>Qty: {quantity}</span>
                    {unitPrice && (
                      <>
                        <span>•</span>
                        <span>{formatPrice(unitPrice)} each</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Line Item Total */}
                {totalPrice && (
                  <div className="text-right shrink-0">
                    <span className="text-xs sm:text-sm font-bold text-theme-text-primary">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-3 flex items-center gap-2 text-xs text-theme-text-muted">
            <Package className="h-4 w-4" />
            <span>Order details logged ({totalCount} items)</span>
          </div>
        )}
      </div>

      {/* Card Footer Bar with CTA */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 bg-theme-surface-alt/40 border-t border-theme-border-subtle flex-wrap">
        <div className="text-xs text-theme-text-subtle">
          <span>Total: </span>
          <span className="font-bold text-theme-text-primary">
            {formatPrice(order.totalAmount)}
          </span>
          {anyOrder.paymentStatus && (
            <span className="ml-2 inline-block rounded bg-secondary-100/70 border border-secondary-200 px-2 py-0.5 text-[10px] font-bold text-secondary-800 uppercase">
              {anyOrder.paymentStatus}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isOngoing && (
            <button
              type="button"
              onClick={handleTrackClick}
              className="inline-flex items-center gap-1.5 rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-white px-3.5 py-1.5 text-xs font-bold transition-colors shadow-2xs cursor-pointer min-h-[34px]"
            >
              <Truck className="h-3.5 w-3.5" />
              <span>Track Order</span>
            </button>
          )}

          <Link
            href={`/orders/${order.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-theme-border bg-theme-surface px-3.5 py-1.5 text-xs font-bold text-theme-primary hover:bg-theme-surface-warm hover:border-theme-border-accent transition-colors shadow-2xs min-h-[34px]"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>View Details</span>
          </Link>
        </div>
      </div>

      {/* Live Interactive Tracking Modal (ST Courier / Shiprocket / MSS) */}
      {awb && (
        <LiveTrackingModal
          open={isLiveTrackingOpen}
          onClose={() => setIsLiveTrackingOpen(false)}
          awb={awb}
          courierName={courierPartner}
          orderNumber={order.orderNumber}
        />
      )}

      {/* Fallback Dispatch Status Stepper Modal when AWB is not yet generated */}
      {isStatusTrackingOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-theme-surface border border-theme-border rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-4 border-b border-theme-border-subtle pb-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider font-bold text-theme-text-muted">
                  Shipment Tracking Status
                </div>
                <h3 className="text-base sm:text-lg font-bold font-mono text-theme-text-primary mt-0.5">
                  Order {order.orderNumber || `#${String(order.id).slice(0, 8)}`}
                </h3>
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border mt-1.5 ${statusMeta.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                  {String(order.status).replace(/_/g, " ")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsStatusTrackingOpen(false)}
                className="w-8 h-8 rounded-full border border-theme-border flex items-center justify-center text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-surface-alt transition-colors cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Stepper */}
            <div className="bg-theme-surface-alt rounded-xl p-4 border border-theme-border-subtle">
              <div className="grid grid-cols-4 gap-0 items-start">
                {[
                  { label: "Placed", desc: "Order Received" },
                  { label: "Packed", desc: "In Preparation" },
                  { label: "Dispatched", desc: "Handed to Courier" },
                  { label: "Delivered", desc: "At your door" },
                ].map((step, idx) => {
                  const current = getOrderStepIndex(order.status);
                  const isDone = idx <= current;
                  const isLast = idx === 3;
                  return (
                    <div key={step.label} className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex items-center">
                        <span
                          className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${
                            isDone ? "bg-secondary-500 ring-2 ring-secondary-100" : "bg-theme-border"
                          }`}
                        />
                        {!isLast && (
                          <span
                            className={`h-0.5 flex-1 ${
                              idx < current ? "bg-secondary-400" : "bg-theme-border"
                            }`}
                          />
                        )}
                      </div>
                      <span className={`text-[11px] font-semibold truncate ${isDone ? "text-theme-text-primary" : "text-theme-text-muted"}`}>
                        {step.label}
                      </span>
                      <span className="text-[9px] text-theme-text-muted truncate">
                        {step.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Courier partner info */}
            <div className="p-3.5 rounded-xl bg-theme-surface-warm border border-theme-border-subtle text-xs space-y-1.5">
              <div className="font-bold text-theme-text-primary flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-theme-secondary" />
                <span>Courier Partner: {courierPartner}</span>
              </div>
              <p className="text-theme-text-subtle text-[11px] leading-relaxed">
                Your order is currently being prepared at our Kolli Hills warehouse. Live tracking updates and AWB consignment number will become active as soon as the courier partner scans the package.
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-theme-border-subtle">
              <Link
                href={`/orders/${order.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-theme-border bg-theme-surface px-4 py-2 text-xs font-bold text-theme-primary hover:bg-theme-surface-warm transition-colors cursor-pointer"
              >
                <span>View Full Details</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setIsStatusTrackingOpen(false)}
                className="rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-white px-5 py-2 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
