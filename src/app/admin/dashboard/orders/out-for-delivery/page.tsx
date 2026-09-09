"use client";

import { AdminOrderListTable } from "@/features/orders/components/AdminOrderListTable";

export default function AdminOutForDeliveryOrdersPage() {
  return (
    <AdminOrderListTable
      status="out_for_delivery"
      emptyMessage="No out for delivery orders found."
    />
  );
}
