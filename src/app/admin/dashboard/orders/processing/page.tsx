"use client";

import { AdminOrderListTable } from "@/features/orders/components/AdminOrderListTable";

export default function AdminProcessingOrdersPage() {
  return (
    <AdminOrderListTable
      status="processing"
      emptyMessage="No processing orders found."
    />
  );
}
