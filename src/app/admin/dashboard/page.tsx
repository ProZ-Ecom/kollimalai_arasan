"use client";

import { useSession } from "next-auth/react";
import {
  Package,
  FolderTree,
  Users,
  ShoppingCart,
  DollarSign,
  Clock,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { StatsCard } from "@/components/admin/StatsCard";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useDashboardStats } from "@/features/dashboard/hooks";
import { formatPrice } from "@/lib/utils";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminPageHeader, AdminContent } from "@/components/admin/AdminPageHeader";
import { SalesChart } from "@/components/admin/dashboard/SalesChart";
import { RecentOrders, type DummyOrder } from "@/components/admin/dashboard/RecentOrders";
import { TopProducts, type DummyProduct } from "@/components/admin/dashboard/TopProducts";
import {
  LowStockAlerts,
  type DummyLowStockItem,
} from "@/components/admin/dashboard/LowStockAlerts";

const DUMMY_SALES_DATA = [
  { label: "Mon", value: 12500 },
  { label: "Tue", value: 18200 },
  { label: "Wed", value: 9800 },
  { label: "Thu", value: 22100 },
  { label: "Fri", value: 27400 },
  { label: "Sat", value: 31200 },
  { label: "Sun", value: 19600 },
];

const DUMMY_ORDERS: DummyOrder[] = [
  { id: "#ORD-1042", customer: "Aarav Sharma", date: "Sep 3, 2026", amount: 1249, status: "Delivered" },
  { id: "#ORD-1041", customer: "Priya Nair", date: "Sep 3, 2026", amount: 899, status: "Processing" },
  { id: "#ORD-1040", customer: "Rohan Iyer", date: "Sep 2, 2026", amount: 2150, status: "Pending" },
  { id: "#ORD-1039", customer: "Sneha Reddy", date: "Sep 2, 2026", amount: 540, status: "Delivered" },
  { id: "#ORD-1038", customer: "Kabir Menon", date: "Sep 1, 2026", amount: 375, status: "Cancelled" },
];

const DUMMY_TOP_PRODUCTS: DummyProduct[] = [
  { id: "p1", name: "Classic Banana Chips", category: "Chips", unitsSold: 320, revenue: 15980 },
  { id: "p2", name: "Masala Peanuts", category: "Namkeen", unitsSold: 275, revenue: 11350 },
  { id: "p3", name: "Roasted Cashew Mix", category: "Nuts", unitsSold: 190, revenue: 24700 },
  { id: "p4", name: "Ragi Murukku", category: "Snacks", unitsSold: 160, revenue: 8640 },
];

const DUMMY_LOW_STOCK: DummyLowStockItem[] = [
  { id: "l1", name: "Spicy Mixture 200g", sku: "SNK-2201", stock: 4, reorderLevel: 20 },
  { id: "l2", name: "Coconut Chips 100g", sku: "SNK-1187", stock: 7, reorderLevel: 25 },
  { id: "l3", name: "Sweet Boondi 250g", sku: "SNK-3390", stock: 2, reorderLevel: 15 },
];

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const { data: stats, isLoading, error, refetch } = useDashboardStats();

  if (isLoading) {
    return <AdminTableSkeleton showStats />;
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load dashboard stats. Please try again."
        onRetry={refetch}
      />
    );
  }

  return (
    <div>
      <AdminPageHeader
        title={`Welcome back, ${session?.user?.name || "Admin"}`}
        description="Here's what's happening with your store today."
        breadcrumbs={<AdminBreadcrumb items={[{ label: "Dashboard" }]} />}
      />

      <AdminContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Products"
            value={stats?.totalProducts ?? 0}
            icon={Package}
            description="All products in store"
          />
          <StatsCard
            title="Total Categories"
            value={stats?.totalCategories ?? 0}
            icon={FolderTree}
            description="Product categories"
          />
          <StatsCard
            title="Total Customers"
            value={stats?.totalCustomers ?? 0}
            icon={Users}
            description="Registered customers"
          />
          <StatsCard
            title="Total Orders"
            value={stats?.totalOrders ?? 0}
            icon={ShoppingCart}
            description="All time orders"
          />
          <StatsCard
            title="Revenue"
            value={formatPrice(stats?.totalRevenue ?? 0)}
            icon={DollarSign}
            description="Total revenue"
          />
          <StatsCard
            title="Pending Orders"
            value={stats?.pendingOrders ?? 0}
            icon={Clock}
            description="Awaiting processing"
          />
          <StatsCard
            title="Low Stock"
            value={stats?.lowStock ?? 0}
            icon={AlertTriangle}
            description="Items below reorder level"
          />
          <StatsCard
            title="Today's Orders"
            value={stats?.todayOrders ?? 0}
            icon={Calendar}
            description="Orders placed today"
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SalesChart data={DUMMY_SALES_DATA} />
          </div>
          <TopProducts products={DUMMY_TOP_PRODUCTS} />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentOrders orders={DUMMY_ORDERS} />
          </div>
          <LowStockAlerts items={DUMMY_LOW_STOCK} />
        </div>
      </AdminContent>
    </div>
  );
}
