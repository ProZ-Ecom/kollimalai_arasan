"use client";

import { AdminOrderListTable } from "@/features/orders/components/AdminOrderListTable";

export default function AdminReturnedOrdersPage() {
  return (
    <AdminOrderListTable
      status="returned"
      emptyMessage="No returned orders found."
    />
  );
}
