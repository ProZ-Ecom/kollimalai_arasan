"use client";

import { AdminOrderListTable } from "@/features/orders/components/AdminOrderListTable";

export default function AdminPackedOrdersPage() {
  return (
    <AdminOrderListTable
      status="packed"
      emptyMessage="No packed orders found."
    />
  );
}
