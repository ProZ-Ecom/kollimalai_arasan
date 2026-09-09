"use client";

import {
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Package,
  Check,
  X,
  Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  pending: "Pending Assignment",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  failed: "Delivery Failed",
};

export const ASSIGNMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting Acceptance",
  accepted: "Accepted",
  rejected: "Rejected",
};

interface DeliveryStatusBadgeProps {
  status?: string | null;
  className?: string;
}

export function DeliveryStatusBadge({
  status = "pending",
  className,
}: DeliveryStatusBadgeProps) {
  const normalized = (status || "pending").toLowerCase();

  switch (normalized) {
    case "pending":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200",
            className
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          {DELIVERY_STATUS_LABELS.pending}
        </span>
      );

    case "picked_up":
    case "in_transit":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200",
            className
          )}
        >
          <Navigation className="h-3.5 w-3.5" />
          {DELIVERY_STATUS_LABELS[normalized] || "In Transit"}
        </span>
      );

    case "out_for_delivery":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse",
            className
          )}
        >
          <Truck className="h-3.5 w-3.5" />
          {DELIVERY_STATUS_LABELS.out_for_delivery}
        </span>
      );

    case "delivered":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200",
            className
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {DELIVERY_STATUS_LABELS.delivered}
        </span>
      );

    case "failed":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200",
            className
          )}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          {DELIVERY_STATUS_LABELS.failed}
        </span>
      );

    default:
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200 capitalize",
            className
          )}
        >
          <Package className="h-3.5 w-3.5" />
          {status}
        </span>
      );
  }
}

interface AssignmentStatusBadgeProps {
  status?: string | null;
  className?: string;
}

export function AssignmentStatusBadge({
  status = "pending",
  className,
}: AssignmentStatusBadgeProps) {
  const normalized = (status || "pending").toLowerCase();

  switch (normalized) {
    case "accepted":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200",
            className
          )}
        >
          <Check className="h-3 w-3" />
          Accepted
        </span>
      );

    case "rejected":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200",
            className
          )}
        >
          <X className="h-3 w-3" />
          Rejected
        </span>
      );

    case "pending":
    default:
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200",
            className
          )}
        >
          <Clock className="h-3 w-3" />
          Pending Acceptance
        </span>
      );
  }
}
