"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import {
  AdminPageHeader,
  AdminContent,
} from "@/components/admin/AdminPageHeader";
import { OrderStatsCards } from "@/features/orders/components/OrderStatsCards";
import { OrderStatusTabs } from "@/features/orders/components/OrderStatusTabs";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isStaff = (session?.user as { role?: string })?.role === "STAFF";

  useEffect(() => {
    if (status === "authenticated" && isStaff) {
      router.replace("/admin/dashboard/delivery");
    }
  }, [status, isStaff, router]);

  if (status === "loading" || (status === "authenticated" && isStaff)) {
    return <AdminTableSkeleton showStats />;
  }

  return (
    <div className="w-full flex-1 flex flex-col space-y-3">
      <AdminPageHeader
        title="Orders"
        description="View, manage and fulfill customer orders"
      />

      <div className="flex flex-col gap-3">
        {/* Order Statistics - Shared across all status pages */}
        <OrderStatsCards />

        {/* Status Tabs Navigation - Shared across all status pages */}
        <div className="mt-1">
          <OrderStatusTabs />
        </div>
      </div>

      <div className="w-full flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
