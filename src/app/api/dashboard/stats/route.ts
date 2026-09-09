import { db } from "@/lib/db/prisma";
import { apiSuccess, apiFromError } from "@/lib/api/api-response";
import { createApiHandler } from "@/lib/api/api-handler";

async function getStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalProducts,
    totalCategories,
    totalCustomers,
    totalOrders,
    revenueResult,
    pendingOrders,
    lowStock,
    todayOrders,
  ] = await Promise.all([
    db.product.count(),
    db.productCategory.count(),
    db.user.count({ where: { role: { name: "CUSTOMER" } } }),
    db.order.count(),
    db.order.aggregate({ _sum: { totalAmount: true } }),
    db.order.count({ where: { order_status: "pending" } }),
    db.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM inventories WHERE quantity_available <= reorder_level`.then(
      (rows) => Number(rows[0]?.count ?? 0)
    ),
    db.order.count({ where: { createdAt: { gte: todayStart } } }),
  ]);

  return apiSuccess({
    totalProducts,
    totalCategories,
    totalCustomers,
    totalOrders,
    totalRevenue: Number(revenueResult._sum.totalAmount ?? 0),
    pendingOrders,
    lowStock,
    todayOrders,
  });
}

export const GET = createApiHandler(
  { GET: async () => getStats() },
  { requireAuth: true, requiredRole: ["ADMIN", "STAFF"] }
);
