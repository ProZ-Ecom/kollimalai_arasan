"use client";

import { AdminOrderListTable } from "@/features/orders/components/AdminOrderListTable";

export default function AdminShippedOrdersPage() {
  return (
    <AdminOrderListTable
      status="shipped"
      emptyMessage="No shipped orders found."
    />
  );
}
