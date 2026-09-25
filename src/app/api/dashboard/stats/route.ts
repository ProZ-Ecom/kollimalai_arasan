import { db } from "@/lib/db/prisma";
import { apiSuccess } from "@/lib/api/api-response";
import { createApiHandler } from "@/lib/api/api-handler";
import type { orders_order_status } from "@/generated/prisma";

export type DashboardPeriod = "today" | "7d" | "30d" | "month" | "year" | "all";

interface DateRange {
  currentStart: Date | null;
  currentEnd: Date;
  prevStart: Date | null;
  prevEnd: Date | null;
  periodLabel: string;
}

function calculateDateRanges(period: DashboardPeriod): DateRange {
  const now = new Date();
  const currentEnd = new Date(now);

  let currentStart: Date | null = null;
  let prevStart: Date | null = null;
  let prevEnd: Date | null = null;
  let periodLabel = "This Month";

  switch (period) {
    case "today": {
      periodLabel = "Today";
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      prevStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
      break;
    }
    case "7d": {
      periodLabel = "Last 7 Days";
      currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      prevStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      prevEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    }
    case "30d": {
      periodLabel = "Last 30 Days";
      currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      prevStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      prevEnd = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    }
    case "year": {
      periodLabel = "This Year";
      currentStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      prevStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0);
      prevEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
      break;
    }
    case "all": {
      periodLabel = "All Time";
      currentStart = null;
      prevStart = null;
      prevEnd = null;
      break;
    }
    case "month":
    default: {
      periodLabel = "This Month";
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      // Previous month
      const prevMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const prevMonthIndex = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      prevStart = new Date(prevMonthYear, prevMonthIndex, 1, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
    }
  }

  return { currentStart, currentEnd, prevStart, prevEnd, periodLabel };
}

function calculateTrend(current: number, previous: number): { value: number; isPositive: boolean } {
  if (previous <= 0) {
    return { value: current > 0 ? 100 : 0, isPositive: current >= 0 };
  }
  const diff = ((current - previous) / previous) * 100;
  return {
    value: Number(Math.abs(diff).toFixed(1)),
    isPositive: diff >= 0,
  };
}

async function getStats(period: DashboardPeriod = "month") {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const { currentStart, currentEnd, prevStart, prevEnd, periodLabel } = calculateDateRanges(period);

  const orderDateFilter = currentStart
    ? { createdAt: { gte: currentStart, lte: currentEnd } }
    : {};

  const prevOrderDateFilter = prevStart && prevEnd
    ? { createdAt: { gte: prevStart, lte: prevEnd } }
    : null;

  // Run primary concurrent aggregations
  const [
    totalProducts,
    totalCategories,
    totalCustomers,
    totalOrdersAllTime,
    allTimeRevenueResult,
    pendingOrdersCount,
    todayOrdersCount,
    todayRevenueResult,
    currentOrdersCount,
    currentOrderFinancials,
    previousOrdersCount,
    previousOrderFinancials,
    cancelledAndReturnedResult,
    refundsResult,
    lowStockCountResult,
    outOfStockCountResult,
    statusGroupResult,
    recentOrdersRaw,
    lowStockRowsRaw,
    periodOrdersList,
  ] = await Promise.all([
    // Catalog counts
    db.product.count({ where: { deleted_at: null } }),
    db.productCategory.count({ where: { deleted_at: null } }),
    db.user.count({ where: { role: { name: "CUSTOMER" } } }),
    db.order.count(),
    db.order.aggregate({
      where: { order_status: { notIn: ["cancelled", "returned"] } },
      _sum: { totalAmount: true },
    }),
    db.order.count({ where: { order_status: "pending" } }),
    db.order.count({ where: { createdAt: { gte: todayStart } } }),
    db.order.aggregate({
      where: {
        createdAt: { gte: todayStart },
        order_status: { notIn: ["cancelled", "returned"] },
      },
      _sum: { totalAmount: true },
    }),

    // Period specific counts and financials
    db.order.count({ where: orderDateFilter }),
    db.order.aggregate({
      where: orderDateFilter,
      _sum: {
        totalAmount: true,
        subtotal: true,
        discountAmount: true,
        taxAmount: true,
        shipping_charge: true,
      },
    }),

    // Previous period for trend calculation
    prevOrderDateFilter ? db.order.count({ where: prevOrderDateFilter }) : Promise.resolve(0),
    prevOrderDateFilter
      ? db.order.aggregate({
          where: prevOrderDateFilter,
          _sum: { totalAmount: true },
        })
      : Promise.resolve({ _sum: { totalAmount: null } }),

    // Cancelled and returned loss in period
    db.order.aggregate({
      where: {
        ...orderDateFilter,
        order_status: { in: ["cancelled", "returned"] },
      },
      _sum: { totalAmount: true },
    }),

    // Completed refunds in period
    db.refunds.aggregate({
      where: {
        ...(currentStart ? { created_at: { gte: currentStart, lte: currentEnd } } : {}),
        status: "completed",
      },
      _sum: { amount: true },
    }),

    // Inventory counts
    db.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM inventories WHERE is_active = 1 AND quantity_available <= reorder_level`.then(
      (rows) => Number(rows[0]?.count ?? 0)
    ),
    db.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM inventories WHERE is_active = 1 AND quantity_available = 0`.then(
      (rows) => Number(rows[0]?.count ?? 0)
    ),

    // Order status breakdown for period
    db.order.groupBy({
      by: ["order_status"],
      where: orderDateFilter,
      _count: { id: true },
    }),

    // Recent 6 orders
    db.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    }),

    // Real low stock alerts
    db.$queryRaw<
      Array<{
        id: bigint;
        variant_unit_price_id: bigint;
        quantity_available: number;
        reorder_level: number;
        sku: string;
        product_name: string;
        variant_name: string | null;
      }>
    >`
      SELECT 
        i.id,
        i.variant_unit_price_id,
        i.quantity_available,
        i.reorder_level,
        vup.sku,
        p.name as product_name,
        pv.variant_name
      FROM inventories i
      JOIN variant_unit_prices vup ON i.variant_unit_price_id = vup.id
      JOIN product_variants pv ON vup.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE i.is_active = 1 AND i.quantity_available <= i.reorder_level
      ORDER BY i.quantity_available ASC
      LIMIT 5
    `,

    // Orders for period sales trend
    db.order.findMany({
      where: orderDateFilter,
      select: {
        id: true,
        createdAt: true,
        totalAmount: true,
        order_status: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Aggregate Top Selling Products using SQL query for reliability and speed
  let topProductsRaw: Array<{
    productId: bigint;
    product_name: string;
    total_quantity: number | string | bigint;
    total_revenue: number | string | bigint;
  }> = [];

  if (currentStart) {
    topProductsRaw = await db.$queryRaw<
      Array<{
        productId: bigint;
        product_name: string;
        total_quantity: number | string | bigint;
        total_revenue: number | string | bigint;
      }>
    >`
      SELECT 
        oi.product_id as productId,
        oi.product_name_snapshot as product_name,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.total_price) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.is_active = 1
        AND o.order_status NOT IN ('cancelled', 'returned')
        AND o.created_at >= ${currentStart}
        AND o.created_at <= ${currentEnd}
      GROUP BY oi.product_id, oi.product_name_snapshot
      ORDER BY total_quantity DESC
      LIMIT 5
    `;
  }

  // If no items sold in the current period, fallback to all-time top selling
  if (topProductsRaw.length === 0) {
    topProductsRaw = await db.$queryRaw<
      Array<{
        productId: bigint;
        product_name: string;
        total_quantity: number | string | bigint;
        total_revenue: number | string | bigint;
      }>
    >`
      SELECT 
        oi.product_id as productId,
        oi.product_name_snapshot as product_name,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.total_price) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.is_active = 1
        AND o.order_status NOT IN ('cancelled', 'returned')
      GROUP BY oi.product_id, oi.product_name_snapshot
      ORDER BY total_quantity DESC
      LIMIT 5
    `;
  }

  // Format Top Selling Products
  const topProducts = topProductsRaw.map((item) => ({
    id: String(item.productId),
    name: item.product_name,
    unitsSold: Number(item.total_quantity ?? 0),
    revenue: Number(item.total_revenue ?? 0),
  }));

  // Calculations for Financials & Profit/Loss
  const grossSales = Number(currentOrderFinancials._sum.totalAmount ?? 0);
  const subtotal = Number(currentOrderFinancials._sum.subtotal ?? 0);
  const discounts = Number(currentOrderFinancials._sum.discountAmount ?? 0);
  const tax = Number(currentOrderFinancials._sum.taxAmount ?? 0);
  const shipping = Number(currentOrderFinancials._sum.shipping_charge ?? 0);
  const cancelledLoss = Number(cancelledAndReturnedResult._sum.totalAmount ?? 0);
  const refundsTotal = Number(refundsResult._sum.amount ?? 0);

  // Net Realized Revenue / Profit Inflow = Gross Sales - Discounts - Cancelled Loss - Refunds
  const totalDeductions = discounts + cancelledLoss + refundsTotal;
  const netRealizedRevenue = Math.max(0, grossSales - totalDeductions);
  const realizationRate =
    grossSales > 0
      ? Number(((netRealizedRevenue / grossSales) * 100).toFixed(1))
      : 100;

  const averageOrderValue =
    currentOrdersCount > 0 ? Math.round(grossSales / currentOrdersCount) : 0;

  const previousGrossSales = Number(previousOrderFinancials._sum.totalAmount ?? 0);

  const ordersTrend = calculateTrend(currentOrdersCount, previousOrdersCount);
  const revenueTrend = calculateTrend(grossSales, previousGrossSales);

  // Order status map
  const statusMap: Record<orders_order_status, number> = {
    pending: 0,
    confirmed: 0,
    processing: 0,
    packed: 0,
    shipped: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
    returned: 0,
  };
  statusGroupResult.forEach((group) => {
    statusMap[group.order_status] = group._count.id;
  });

  // Generate Sales Trend Points based on period
  const trendBuckets: { [key: string]: { label: string; date: string; revenue: number; orders: number } } = {};

  if (period === "today") {
    // Hourly buckets (00 to current hour)
    const currentHour = now.getHours();
    for (let h = 0; h <= Math.min(23, currentHour + 1); h += 3) {
      const label = `${h.toString().padStart(2, "0")}:00`;
      trendBuckets[label] = { label, date: label, revenue: 0, orders: 0 };
    }
    periodOrdersList.forEach((order) => {
      const h = new Date(order.createdAt).getHours();
      const bucketHour = Math.floor(h / 3) * 3;
      const label = `${bucketHour.toString().padStart(2, "0")}:00`;
      if (trendBuckets[label]) {
        trendBuckets[label].orders += 1;
        if (!["cancelled", "returned"].includes(order.order_status)) {
          trendBuckets[label].revenue += Number(order.totalAmount);
        }
      }
    });
  } else if (period === "7d") {
    // 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
      trendBuckets[key] = { label, date: key, revenue: 0, orders: 0 };
    }
    periodOrdersList.forEach((order) => {
      const key = new Date(order.createdAt).toISOString().split("T")[0];
      if (trendBuckets[key]) {
        trendBuckets[key].orders += 1;
        if (!["cancelled", "returned"].includes(order.order_status)) {
          trendBuckets[key].revenue += Number(order.totalAmount);
        }
      }
    });
  } else if (period === "month") {
    // Days of current month up to now
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(now.getFullYear(), now.getMonth(), day);
      const key = d.toISOString().split("T")[0];
      const label = `${day} ${d.toLocaleDateString("en-US", { month: "short" })}`;
      trendBuckets[key] = { label, date: key, revenue: 0, orders: 0 };
    }
    periodOrdersList.forEach((order) => {
      const key = new Date(order.createdAt).toISOString().split("T")[0];
      if (trendBuckets[key]) {
        trendBuckets[key].orders += 1;
        if (!["cancelled", "returned"].includes(order.order_status)) {
          trendBuckets[key].revenue += Number(order.totalAmount);
        }
      }
    });
  } else {
    // Last 30 days or default
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      trendBuckets[key] = { label, date: key, revenue: 0, orders: 0 };
    }
    periodOrdersList.forEach((order) => {
      const key = new Date(order.createdAt).toISOString().split("T")[0];
      if (trendBuckets[key]) {
        trendBuckets[key].orders += 1;
        if (!["cancelled", "returned"].includes(order.order_status)) {
          trendBuckets[key].revenue += Number(order.totalAmount);
        }
      }
    });
  }

  const salesTrend = Object.values(trendBuckets);

  // Format Recent Orders
  const recentOrders = recentOrdersRaw.map((order) => ({
    id: String(order.id),
    orderNumber: order.orderNumber,
    customer: order.user?.name || order.user?.email || "Guest Customer",
    date: new Date(order.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    amount: Number(order.totalAmount),
    status: order.order_status,
    paymentStatus: order.payment_status,
  }));

  // Format Low Stock Items
  const lowStockItems = lowStockRowsRaw.map((item) => ({
    id: String(item.id),
    name: item.variant_name
      ? `${item.product_name} (${item.variant_name})`
      : item.product_name,
    sku: item.sku,
    stock: Number(item.quantity_available),
    reorderLevel: Number(item.reorder_level),
  }));

  const previousAverageOrderValue =
    previousOrdersCount > 0 ? Math.round(previousGrossSales / previousOrdersCount) : 0;
  const aovDifference = averageOrderValue - previousAverageOrderValue;

  const cancelledCount = (statusMap.cancelled || 0) + (statusMap.returned || 0);
  const returnRate =
    currentOrdersCount > 0
      ? Number(((cancelledCount / currentOrdersCount) * 100).toFixed(2))
      : 0;

  return apiSuccess({
    period,
    periodLabel,
    summary: {
      totalProducts,
      totalCategories,
      totalCustomers,
      totalOrdersAllTime,
      totalRevenueAllTime: Number(allTimeRevenueResult._sum.totalAmount ?? 0),
      periodOrders: currentOrdersCount,
      ordersTrend,
      periodRevenue: grossSales,
      revenueTrend,
      netRealizedRevenue,
      realizationRate,
      averageOrderValue,
      previousAverageOrderValue,
      aovDifference,
      returnRate,
      cancelledOrdersCount: cancelledCount,
      pendingOrders: pendingOrdersCount,
      todayOrders: todayOrdersCount,
      todayRevenue: Number(todayRevenueResult._sum.totalAmount ?? 0),
      lowStockCount: lowStockCountResult,
      outOfStockCount: outOfStockCountResult,
    },
    financials: {
      grossSales,
      subtotal,
      discounts,
      tax,
      shipping,
      cancelledLoss,
      refundsTotal,
      netRealizedRevenue,
      realizationRate,
    },
    statusBreakdown: statusMap,
    salesTrend,
    topProducts,
    recentOrders,
    lowStockItems,
  });
}

export const GET = createApiHandler(
  {
    GET: async (request) => {
      const periodParam = request.nextUrl.searchParams.get("period") as DashboardPeriod | null;
      const validPeriods: DashboardPeriod[] = ["today", "7d", "30d", "month", "year", "all"];
      const period: DashboardPeriod =
        periodParam && validPeriods.includes(periodParam) ? periodParam : "month";
      return getStats(period);
    },
  },
  { requireAuth: true, requiredRole: ["ADMIN", "STAFF"] }
);
