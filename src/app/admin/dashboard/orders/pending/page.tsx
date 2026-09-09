"use client";

import { AdminOrderListTable } from "@/features/orders/components/AdminOrderListTable";

export default function AdminPendingOrdersPage() {
  return (
    <AdminOrderListTable
      status="pending"
      emptyMessage="No pending orders found."
    />
  );
}
