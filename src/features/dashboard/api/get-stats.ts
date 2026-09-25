import { apiClient } from "@/lib/api/api-client";

export type DashboardPeriod = "today" | "7d" | "30d" | "month" | "year" | "all";

export interface DashboardTrend {
  value: number;
  isPositive: boolean;
}

export interface DashboardSummary {
  totalProducts: number;
  totalCategories: number;
  totalCustomers: number;
  totalOrdersAllTime: number;
  totalRevenueAllTime: number;
  periodOrders: number;
  ordersTrend: DashboardTrend;
  periodRevenue: number;
  revenueTrend: DashboardTrend;
  netRealizedRevenue: number;
  realizationRate: number;
  averageOrderValue: number;
  previousAverageOrderValue?: number;
  aovDifference?: number;
  returnRate?: number;
  cancelledOrdersCount?: number;
  pendingOrders: number;
  todayOrders: number;
  todayRevenue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface DashboardFinancials {
  grossSales: number;
  subtotal: number;
  discounts: number;
  tax: number;
  shipping: number;
  cancelledLoss: number;
  refundsTotal: number;
  netRealizedRevenue: number;
  realizationRate: number;
}

export interface DashboardSalesTrendPoint {
  label: string;
  date: string;
  revenue: number;
  orders: number;
}

export interface DashboardTopProduct {
  id: string;
  name: string;
  unitsSold: number;
  revenue: number;
}

export interface DashboardRecentOrder {
  id: string;
  orderNumber: string;
  customer: string;
  date: string;
  amount: number;
  status: string;
  paymentStatus: string;
}

export interface DashboardLowStockItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  reorderLevel: number;
}

export interface DashboardStatsResponse {
  period: DashboardPeriod;
  periodLabel: string;
  summary: DashboardSummary;
  financials: DashboardFinancials;
  statusBreakdown: Record<string, number>;
  salesTrend: DashboardSalesTrendPoint[];
  topProducts: DashboardTopProduct[];
  recentOrders: DashboardRecentOrder[];
  lowStockItems: DashboardLowStockItem[];
  // Backward compatibility convenience getters
  totalProducts?: number;
  totalCategories?: number;
  totalCustomers?: number;
  totalOrders?: number;
  totalRevenue?: number;
  pendingOrders?: number;
  lowStock?: number;
  todayOrders?: number;
}

export async function getDashboardStats(
  period: DashboardPeriod = "month"
): Promise<DashboardStatsResponse> {
  const response = await apiClient.get<DashboardStatsResponse>(
    `/api/dashboard/stats?period=${period}`
  );
  return response.data!;
}

