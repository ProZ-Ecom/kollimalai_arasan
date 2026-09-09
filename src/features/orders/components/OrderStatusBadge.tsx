"use client";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus, PaymentStatus } from "../types";

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
  partial_refund: "Partial Refund",
  PENDING: "Pending",
  PAID: "Paid",
  COMPLETED: "Completed",
  FAILED: "Failed",
  REFUNDED: "Refunded",
  CANCELLED: "Cancelled",
};

const ORDER_STATUS_VARIANTS: Record<string, BadgeProps["variant"]> = {
  pending: "warning",
  confirmed: "info",
  processing: "info",
  packed: "info",
  shipped: "info",
  out_for_delivery: "info",
  delivered: "success",
  cancelled: "destructive",
  returned: "warning",
  PENDING: "warning",
  CONFIRMED: "info",
  PROCESSING: "info",
  PACKED: "info",
  SHIPPED: "info",
  OUT_FOR_DELIVERY: "info",
  DELIVERED: "success",
  CANCELLED: "destructive",
  RETURNED: "warning",
};

const PAYMENT_STATUS_VARIANTS: Record<string, BadgeProps["variant"]> = {
  pending: "warning",
  paid: "success",
  failed: "destructive",
  refunded: "secondary",
  partial_refund: "warning",
  PENDING: "warning",
  PAID: "success",
  COMPLETED: "success",
  FAILED: "destructive",
  REFUNDED: "secondary",
  CANCELLED: "destructive",
};

interface OrderStatusBadgeProps {
  status: OrderStatus | string;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const normalized = (status || "").toLowerCase();
  return (
    <Badge
      variant={
        ORDER_STATUS_VARIANTS[status] ??
        ORDER_STATUS_VARIANTS[normalized] ??
        "secondary"
      }
      className={cn(className)}
    >
      {ORDER_STATUS_LABELS[status] ??
        ORDER_STATUS_LABELS[normalized] ??
        status}
    </Badge>
  );
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus | string;
  className?: string;
}

export function PaymentStatusBadge({
  status,
  className,
}: PaymentStatusBadgeProps) {
  const normalized = (status || "").toLowerCase();
  return (
    <Badge
      variant={
        PAYMENT_STATUS_VARIANTS[status] ??
        PAYMENT_STATUS_VARIANTS[normalized] ??
        "secondary"
      }
      className={cn(className)}
    >
      {PAYMENT_STATUS_LABELS[status] ??
        PAYMENT_STATUS_LABELS[normalized] ??
        status}
    </Badge>
  );
}
