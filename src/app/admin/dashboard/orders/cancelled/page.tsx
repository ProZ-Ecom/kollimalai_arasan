"use client";

import { AdminOrderListTable } from "@/features/orders/components/AdminOrderListTable";

export default function AdminCancelledOrdersPage() {
  return (
    <AdminOrderListTable
      status="cancelled"
      emptyMessage="No cancelled orders found."
    />
  );
}
