"use client";

import { AdminOrderListTable } from "@/features/orders/components/AdminOrderListTable";

export default function AdminDeliveredOrdersPage() {
  return (
    <AdminOrderListTable
      status="delivered"
      emptyMessage="No delivered orders found."
    />
  );
}
