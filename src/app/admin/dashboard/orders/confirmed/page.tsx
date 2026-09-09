"use client";

import { AdminOrderListTable } from "@/features/orders/components/AdminOrderListTable";

export default function AdminConfirmedOrdersPage() {
  return (
    <AdminOrderListTable
      status="confirmed"
      emptyMessage="No confirmed orders found."
    />
  );
}
