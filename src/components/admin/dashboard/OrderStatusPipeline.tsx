"use client";

import { CheckCircle2, Clock, PackageCheck, Truck, XCircle } from "lucide-react";
import Link from "next/link";

interface OrderStatusPipelineProps {
  statusBreakdown: Record<string, number>;
  totalOrders: number;
}

export function OrderStatusPipeline({ statusBreakdown, totalOrders }: OrderStatusPipelineProps) {
  const placed = (statusBreakdown.pending || 0) + (statusBreakdown.confirmed || 0);
  const packed = (statusBreakdown.processing || 0) + (statusBreakdown.packed || 0);
  const transit = (statusBreakdown.shipped || 0) + (statusBreakdown.out_for_delivery || 0);
  const delivered = statusBreakdown.delivered || 0;
  const issues = (statusBreakdown.cancelled || 0) + (statusBreakdown.returned || 0);

  const safeTotal = totalOrders > 0 ? totalOrders : 1;
  const deliveredPercent = Math.round((delivered / safeTotal) * 100);

  const stages = [
    {
      label: "Placed",
      count: placed,
      icon: Clock,
      color: "text-amber-600 bg-amber-50 border-amber-200",
      barColor: "bg-amber-400",
      description: "Pending / Confirmed",
    },
    {
      label: "Processing",
      count: packed,
      icon: PackageCheck,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      barColor: "bg-blue-500",
      description: "Packed / In prep",
    },
    {
      label: "In Transit",
      count: transit,
      icon: Truck,
      color: "text-purple-600 bg-purple-50 border-purple-200",
      barColor: "bg-purple-500",
      description: "Shipped / Out for delivery",
    },
    {
      label: "Delivered",
      count: delivered,
      icon: CheckCircle2,
      color: "text-secondary-700 bg-secondary-50 border-secondary-200",
      barColor: "bg-secondary-600",
      description: "Successfully fulfilled",
    },
    {
      label: "Issues",
      count: issues,
      icon: XCircle,
      color: "text-red-600 bg-red-50 border-red-200",
      barColor: "bg-red-400",
      description: "Cancelled / Returned",
    },
  ];

  return (
    <div className="rounded-2xl border border-[var(--color-neutral-200)] bg-white p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-neutral-100 gap-2">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">
            Order Fulfillment Pipeline
          </h3>
          <p className="text-xs text-neutral-500">Live order state tracking across the store</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-neutral-500">
            Fulfilled: <strong className="text-secondary-700">{deliveredPercent}%</strong>
          </span>
          <Link
            href="/admin/dashboard/orders"
            className="text-xs font-semibold text-secondary-700 hover:text-secondary-800 hover:underline"
          >
            Manage Orders &rarr;
          </Link>
        </div>
      </div>

      {/* Multi-segment progress bar */}
      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-neutral-100 flex">
        {stages.map((stage) => {
          const width = totalOrders > 0 ? (stage.count / totalOrders) * 100 : 0;
          if (width === 0) return null;
          return (
            <div
              key={stage.label}
              className={`h-full ${stage.barColor} transition-all duration-300`}
              style={{ width: `${width}%` }}
              title={`${stage.label}: ${stage.count} orders (${Math.round(width)}%)`}
            />
          );
        })}
      </div>

      {/* Grid of pipeline stages */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stages.map((stage) => {
          const Icon = stage.icon;
          return (
            <div
              key={stage.label}
              className="flex flex-col justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 p-3 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-neutral-600">{stage.label}</span>
                <div className={`p-1 rounded-lg border ${stage.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <span className="text-xl font-bold text-neutral-900">{stage.count}</span>
                <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                  {stage.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
