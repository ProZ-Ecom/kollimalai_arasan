"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag, ArrowUpRight } from "lucide-react";
import type { DashboardRecentOrder } from "@/features/dashboard/api/get-stats";

interface RecentOrdersProps {
  orders: DashboardRecentOrder[];
}

const statusBadgeConfig: Record<
  string,
  { label: string; variant: "success" | "info" | "warning" | "destructive" | "secondary" }
> = {
  delivered: { label: "Delivered", variant: "success" },
  shipped: { label: "Shipped", variant: "info" },
  out_for_delivery: { label: "Out for Delivery", variant: "info" },
  packed: { label: "Packed", variant: "secondary" },
  processing: { label: "Processing", variant: "secondary" },
  confirmed: { label: "Confirmed", variant: "warning" },
  pending: { label: "Pending", variant: "warning" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  returned: { label: "Returned", variant: "destructive" },
};

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-neutral-200)] bg-white p-5 shadow-xs">
      <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-3">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">Recent Orders</h3>
          <p className="text-xs text-neutral-500">Live order activity from customers</p>
        </div>
        <Link
          href="/admin/dashboard/orders"
          className="inline-flex items-center text-xs font-semibold text-secondary-700 hover:text-secondary-800 hover:underline gap-0.5"
        >
          View all orders
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center text-center">
          <ShoppingBag className="h-8 w-8 text-neutral-300" />
          <p className="mt-2 text-sm font-medium text-neutral-600">No orders recorded yet</p>
          <p className="text-xs text-neutral-400">Incoming orders will show up here in real time.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                <th className="pb-3 pr-4">Order</th>
                <th className="pb-3 pr-4">Customer</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const config = statusBadgeConfig[order.status] || {
                  label: order.status,
                  variant: "secondary",
                };
                const initials = (order.customer || "U")
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <tr
                    key={order.id}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50 transition-colors"
                  >
                    <td className="py-3 pr-4 font-semibold text-neutral-900">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-secondary-100 text-[11px] font-bold text-secondary-800">
                          {initials}
                        </div>
                        <span className="font-medium text-neutral-800 truncate max-w-[140px]">
                          {order.customer}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-xs text-neutral-500">{order.date}</td>
                    <td className="py-3 pr-4 font-semibold text-neutral-900">
                      {formatPrice(order.amount)}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={config.variant} className="capitalize text-[11px]">
                        {config.label}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/admin/dashboard/orders`}
                        className="text-xs font-medium text-secondary-700 hover:text-secondary-800 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Backward compatibility export
export type DummyOrder = DashboardRecentOrder;

