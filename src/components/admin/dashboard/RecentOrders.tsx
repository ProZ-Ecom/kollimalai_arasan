"use client";

import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface DummyOrder {
  id: string;
  customer: string;
  date: string;
  amount: number;
  status: "Delivered" | "Processing" | "Pending" | "Cancelled";
}

const statusVariant: Record<DummyOrder["status"], "success" | "info" | "warning" | "destructive"> = {
  Delivered: "success",
  Processing: "info",
  Pending: "warning",
  Cancelled: "destructive",
};

interface RecentOrdersProps {
  orders: DummyOrder[];
}

function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-neutral-200)] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--color-neutral-900)]">Recent Orders</h3>
        <span className="text-xs font-medium text-[var(--color-neutral-400)]">Sample data</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-neutral-100)] text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-neutral-500)]">
              <th className="pb-3 pr-4">Order</th>
              <th className="pb-3 pr-4">Customer</th>
              <th className="pb-3 pr-4">Date</th>
              <th className="pb-3 pr-4">Amount</th>
              <th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-[var(--color-neutral-100)] last:border-0"
              >
                <td className="py-3 pr-4 font-medium text-[var(--color-neutral-900)]">
                  {order.id}
                </td>
                <td className="py-3 pr-4 text-[var(--color-neutral-700)]">{order.customer}</td>
                <td className="py-3 pr-4 text-[var(--color-neutral-500)]">{order.date}</td>
                <td className="py-3 pr-4 font-medium text-[var(--color-neutral-900)]">
                  {formatPrice(order.amount)}
                </td>
                <td className="py-3">
                  <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { RecentOrders };
export type { DummyOrder };
