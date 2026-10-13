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
  AlertCircle,
  Calendar,
  RefreshCw,
  Plus,
  Boxes,
  Package,
  Layers,
  ShoppingBag,
  IndianRupee,
  Zap,
  CheckCircle2,
  FileBarChart,
  Tag,
  ExternalLink,
  Landmark,
} from "lucide-react";
import { StatsCard } from "@/components/admin/StatsCard";
import { ErrorState } from "@/components/ui/error-state";
import { useDashboardStats } from "@/features/dashboard/hooks";
import type { DashboardPeriod } from "@/features/dashboard/api/get-stats";
import { useRazorpaySettlements } from "@/features/payment/hooks/use-razorpay-settlements";
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
  const { data: settlementData, isLoading: settlementLoading } = useRazorpaySettlements(30);

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
        {/* Executive Key Metric Cards (8 KPIs matching exact screenshot design) */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
          {/* 1. TOTAL PRODUCTS */}
          <StatsCard
            title="TOTAL PRODUCTS"
            value={summary.totalProducts}
            unit="Items"
            icon={Package}
            iconColor="mint"
            footer={
              <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{summary.totalProducts} catalog items active</span>
              </div>
            }
          />

          {/* 2. CATEGORIES */}
          <StatsCard
            title="CATEGORIES"
            value={summary.totalCategories}
            unit="Clusters"
            icon={Layers}
            iconColor="violet"
            footer={
              <div className="flex items-center gap-1.5 text-neutral-600 font-medium truncate">
                <span className="h-2 w-2 rounded-full bg-[#7048E8] shrink-0" />
                <span className="truncate">
                  {summary.topCategoryNames || "Spices, Honey & Millets"}
                </span>
              </div>
            }
          />

          {/* 3. ACTIVE CUSTOMERS */}
          <StatsCard
            title="ACTIVE CUSTOMERS"
            value={summary.totalCustomers}
            icon={Users}
            iconColor="cyan"
            footer={
              <div className="flex items-center gap-1 text-emerald-600 font-medium">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>+0% from last month</span>
              </div>
            }
          />

          {/* 4. TOTAL ORDERS */}
          <StatsCard
            title="TOTAL ORDERS"
            value={summary.totalOrdersAllTime}
            icon={ShoppingBag}
            iconColor="fuchsia"
            footer={
              <div className="flex items-center gap-1 text-neutral-600 font-medium">
                <span className="font-bold text-emerald-600">
                  {summary.fulfillmentSuccessRate ?? 100}%
                </span>
                <span>fulfillment success rate</span>
              </div>
            }
          />

          {/* 5. RAZORPAY SETTLEMENT */}
          <StatsCard
            title="RAZORPAY SETTLEMENT"
            value={
              settlementLoading
                ? "Loading..."
                : formatPrice(settlementData?.settlementSummary?.netReceived ?? 0)
            }
            icon={Landmark}
            iconColor="mint"
            footer={
              <div className="flex items-center gap-1.5 text-neutral-600 font-medium flex-wrap">
                {settlementLoading ? (
                  <span className="text-neutral-400 text-[11px]">Fetching from Razorpay...</span>
                ) : settlementData ? (
                  <>
                    <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[11px] font-bold text-rose-600 border border-rose-200">
                      Fees: {formatPrice(settlementData.settlementSummary.totalFees)}
                    </span>
                    <span className="text-neutral-500">
                      {settlementData.settlementSummary.lastSettledOn
                        ? `Last settled ${new Date(settlementData.settlementSummary.lastSettledOn).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                        : `${settlementData.settlementSummary.settlementCount} settlement(s)`}
                    </span>
                  </>
                ) : (
                  <span className="text-neutral-400 text-[11px]">No settlement data</span>
                )}
              </div>
            }
          />

          {/* 6. PENDING ORDERS */}
          <StatsCard
            title="PENDING ORDERS"
            value={summary.pendingOrders}
            unit="Orders"
            icon={Clock}
            iconColor="amber"
            footer={
              <div className="flex items-center gap-1.5 text-amber-600 font-medium">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {summary.pendingOrders === 0
                    ? "All orders dispatched"
                    : `${summary.pendingOrders} awaiting dispatch`}
                </span>
              </div>
            }
          />

          {/* 7. STOCK WARNINGS */}
          <StatsCard
            title="STOCK WARNINGS"
            value={summary.lowStockCount}
            unit="Products"
            icon={AlertTriangle}
            iconColor="rose"
            footer={
              <div className="flex items-center gap-1.5 font-medium">
                <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                <span
                  className={
                    summary.lowStockCount === 0
                      ? "text-rose-600"
                      : "text-rose-700 font-semibold"
                  }
                >
                  {summary.lowStockCount === 0
                    ? "Inventory levels optimal"
                    : `${summary.lowStockCount} items need restock`}
                </span>
              </div>
            }
          />

          {/* 8. TODAY'S ORDERS */}
          <StatsCard
            title="TODAY'S ORDERS"
            value={summary.todayOrders}
            unit="Orders"
            icon={Zap}
            iconColor="emerald"
            footer={
              <div className="flex items-center gap-1 text-neutral-600 font-medium truncate">
                <span className="font-bold text-emerald-600">
                  {formatPrice(summary.todayRevenue)}
                </span>
                <span>collected (+0% vs avg)</span>
              </div>
            }
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

