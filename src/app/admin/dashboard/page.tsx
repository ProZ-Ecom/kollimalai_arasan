"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  CreditCard,
  Clock,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Plus,
  Boxes,
  FileBarChart,
  Tag,
  ExternalLink,
} from "lucide-react";
import { StatsCard } from "@/components/admin/StatsCard";
import { ErrorState } from "@/components/ui/error-state";
import { useDashboardStats } from "@/features/dashboard/hooks";
import type { DashboardPeriod } from "@/features/dashboard/api/get-stats";
import { formatPrice } from "@/lib/utils";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminPageHeader, AdminContent } from "@/components/admin/AdminPageHeader";
import { SalesChart } from "@/components/admin/dashboard/SalesChart";
import { RecentOrders } from "@/components/admin/dashboard/RecentOrders";
import { TopProducts } from "@/components/admin/dashboard/TopProducts";
import { LowStockAlerts } from "@/components/admin/dashboard/LowStockAlerts";
import { ProfitLossCard } from "@/components/admin/dashboard/ProfitLossCard";
import { OrderStatusPipeline } from "@/components/admin/dashboard/OrderStatusPipeline";
import { DashboardSkeleton } from "@/components/admin/dashboard/DashboardSkeleton";

const PERIOD_OPTIONS: { id: DashboardPeriod; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 Days" },
  { id: "month", label: "This Month" },
  { id: "30d", label: "30 Days" },
  { id: "year", label: "This Year" },
];

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [period, setPeriod] = useState<DashboardPeriod>("month");
  const { data: stats, isLoading, isFetching, error, refetch } = useDashboardStats(period);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !stats) {
    return (
      <ErrorState
        message="Failed to load dashboard analytics. Please try again."
        onRetry={refetch}
      />
    );
  }

  const { summary, financials, statusBreakdown, salesTrend, topProducts, recentOrders, lowStockItems } = stats;

  return (
    <div className="space-y-6">
      {/* Header with Title and Period Controls */}
      <AdminPageHeader
        title={`Welcome back, ${session?.user?.name || "Admin"}`}
        description={`Store overview and live performance metrics for ${stats.periodLabel}.`}
        breadcrumbs={<AdminBreadcrumb items={[{ label: "Dashboard" }]} />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Period Filter Pills */}
            <div className="flex rounded-xl bg-neutral-100 p-1 border border-neutral-200/60 shadow-2xs">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPeriod(opt.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    period === opt.id
                      ? "bg-white text-secondary-800 shadow-xs font-semibold"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh live metrics"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 shadow-2xs transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin text-secondary-600" : ""}`} />
            </button>
          </div>
        }
      />

      <AdminContent className="mt-4 space-y-6">
        {/* Executive Key Metric Cards (8 KPIs) */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title={`${stats.periodLabel} Revenue`}
            value={formatPrice(summary.periodRevenue)}
            icon={DollarSign}
            description={`${stats.periodLabel} gross sales`}
            trend={summary.revenueTrend}
          />
          <StatsCard
            title={`${stats.periodLabel} Orders`}
            value={summary.periodOrders}
            icon={ShoppingCart}
            description={`${summary.totalOrdersAllTime} all-time orders`}
            trend={summary.ordersTrend}
          />
          <StatsCard
            title="Net Realized Inflow"
            value={formatPrice(summary.netRealizedRevenue)}
            icon={TrendingUp}
            description={`${summary.realizationRate}% conversion rate`}
          />
          <StatsCard
            title="Average Order Value"
            value={formatPrice(summary.averageOrderValue)}
            icon={CreditCard}
            description="Per completed order"
          />
          <StatsCard
            title="Pending Fulfillment"
            value={summary.pendingOrders}
            icon={Clock}
            description="Orders awaiting action"
          />
          <StatsCard
            title="Today's Activity"
            value={summary.todayOrders}
            icon={Calendar}
            description={`${formatPrice(summary.todayRevenue)} captured today`}
          />
          <StatsCard
            title="Critical Inventory"
            value={summary.lowStockCount}
            icon={AlertTriangle}
            description={`${summary.outOfStockCount} items out of stock`}
          />
          <StatsCard
            title="Total Customers"
            value={summary.totalCustomers}
            icon={Users}
            description={`${summary.totalProducts} active products`}
          />
        </div>

        {/* Sales Chart & Profit Loss Breakdown */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SalesChart
              data={salesTrend}
              periodLabel={stats.periodLabel}
              averageOrderValue={summary.averageOrderValue}
              aovDifference={summary.aovDifference}
              realizationRate={summary.realizationRate}
              returnRate={summary.returnRate ?? 0}
              cancelledOrdersCount={summary.cancelledOrdersCount ?? 0}
              topProductName={topProducts[0]?.name}
              totalOrdersCount={summary.periodOrders}
            />
          </div>
          <div>
            <ProfitLossCard financials={financials} periodLabel={stats.periodLabel} />
          </div>
        </div>

        {/* Order Fulfillment Pipeline */}
        <div>
          <OrderStatusPipeline
            statusBreakdown={statusBreakdown}
            totalOrders={summary.periodOrders}
          />
        </div>

        {/* Live Recent Orders & Top Selling Products */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentOrders orders={recentOrders} />
          </div>
          <div>
            <TopProducts products={topProducts} />
          </div>
        </div>

        {/* Low Stock Alerts & Quick Admin Actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <LowStockAlerts items={lowStockItems} />
          </div>

          {/* Quick Actions Shortcuts Card */}
          <div className="flex h-full flex-col justify-between rounded-2xl border border-[var(--color-neutral-200)] bg-white p-5 shadow-xs">
            <div>
              <div className="mb-4 border-b border-neutral-100 pb-3">
                <h3 className="text-base font-semibold text-neutral-900">Quick Store Actions</h3>
                <p className="text-xs text-neutral-500">Shortcuts to daily management tasks</p>
              </div>

              <div className="space-y-2.5">
                <Link
                  href="/admin/dashboard/products"
                  className="flex items-center justify-between rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-50 text-secondary-700">
                      <Plus className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-neutral-800 group-hover:text-secondary-700">
                      Add New Product
                    </span>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-neutral-400 group-hover:text-secondary-600" />
                </Link>

                <Link
                  href="/admin/dashboard/inventory"
                  className="flex items-center justify-between rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Boxes className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-neutral-800 group-hover:text-blue-600">
                      Manage Stock & Inventory
                    </span>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-neutral-400 group-hover:text-blue-600" />
                </Link>

                <Link
                  href="/admin/dashboard/reports"
                  className="flex items-center justify-between rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                      <FileBarChart className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-neutral-800 group-hover:text-purple-600">
                      View Sales & Tax Reports
                    </span>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-neutral-400 group-hover:text-purple-600" />
                </Link>

                <Link
                  href="/admin/dashboard/coupons"
                  className="flex items-center justify-between rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                      <Tag className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-neutral-800 group-hover:text-amber-600">
                      Create Discount Coupon
                    </span>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-neutral-400 group-hover:text-amber-600" />
                </Link>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-100 text-xs text-neutral-400 flex items-center justify-between">
              <span>Admin Control Center</span>
              <Link href="/" target="_blank" className="text-secondary-700 font-medium hover:underline inline-flex items-center gap-1">
                Storefront
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </AdminContent>
    </div>
  );
}

