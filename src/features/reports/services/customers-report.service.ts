import { Prisma } from "@/generated/prisma";
import { db } from "@/lib/db/prisma";
import {
  SOLD_ORDER,
  bucketKey,
  bucketSeries,
  bucketSql,
  change,
  fillSeries,
  inRange,
  num,
  pickBucket,
  ratio,
  resolveRange,
  round2,
  type Bucket,
  type ReportRange,
} from "../lib/report-range";

export interface CustomersFilters {
  dateFrom?: string;
  dateTo?: string;
}

export interface CustomersTotals {
  signups: number;
  buyers: number;
  newBuyers: number;
  returningBuyers: number;
  repeatRate: number;
  orders: number;
  revenue: number;
  avgOrderValue: number;
  avgOrdersPerBuyer: number;
  revenuePerBuyer: number;
}

export interface CustomersTrendPoint {
  bucket: string;
  signups: number;
  newBuyers: number;
  returningBuyers: number;
}

export interface TopCustomerRow {
  id: string;
  name: string;
  custId: string | null;
  phone: string | null;
  city: string | null;
  orders: number;
  revenue: number;
  avgOrderValue: number;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
  daysSinceLastOrder: number | null;
}

export interface GeoRow {
  key: string;
  label: string;
  customers: number;
  orders: number;
  revenue: number;
  share: number;
}

export interface CustomersReport {
  range: { from: string; to: string; days: number; bucket: Bucket };
  totals: CustomersTotals;
  previous: CustomersTotals;
  changes: Record<keyof CustomersTotals, number | null>;
  trend: CustomersTrendPoint[];
  topCustomers: TopCustomerRow[];
  byState: GeoRow[];
  byCity: GeoRow[];
  churnRisk: TopCustomerRow[];
}

const TOTAL_KEYS: (keyof CustomersTotals)[] = [
  "signups",
  "buyers",
  "newBuyers",
  "returningBuyers",
  "repeatRate",
  "orders",
  "revenue",
  "avgOrderValue",
  "avgOrdersPerBuyer",
  "revenuePerBuyer",
];

const DAY_MS = 86_400_000;
const TOP_LIMIT = 25;
const CHURN_DAYS = 90;

const CUSTOMER_ROLE_FILTER: Prisma.UserWhereInput = {
  deleted_at: null,
  role: { OR: [{ slug: "customer" }, { name: "CUSTOMER" }] },
};

function soldWhere(window: { from: Date; to: Date }): Prisma.OrderWhereInput {
  return { ...SOLD_ORDER, createdAt: inRange(window) };
}

/**
 * Classifies buyers as "new" if their lifetime first non-cancelled order falls
 * inside the selected window, or "returning" if they ordered before `window.from`.
 */
async function totalsFor(window: {
  from: Date;
  to: Date;
}): Promise<CustomersTotals> {
  const [signups, perCustomer] = await Promise.all([
    db.user.count({
      where: { ...CUSTOMER_ROLE_FILTER, createdAt: inRange(window) },
    }),
    db.order.groupBy({
      by: ["userId"],
      where: soldWhere(window),
      _count: { _all: true },
      _sum: { totalAmount: true },
    }),
  ]);

  const buyerIds = perCustomer.map((p) => p.userId);
  const prior = buyerIds.length
    ? await db.order.groupBy({
        by: ["userId"],
        where: {
          ...SOLD_ORDER,
          userId: { in: buyerIds },
          createdAt: { lt: window.from },
        },
        _count: { _all: true },
      })
    : [];

  const returningSet = new Set(prior.map((p) => String(p.userId)));
  const buyers = buyerIds.length;
  const returningBuyers = returningSet.size;
  const newBuyers = buyers - returningBuyers;
  const orders = perCustomer.reduce((s, r) => s + r._count._all, 0);
  const revenue = round2(
    perCustomer.reduce((s, r) => s + num(r._sum.totalAmount), 0)
  );

  return {
    signups,
    buyers,
    newBuyers,
    returningBuyers,
    repeatRate: ratio(returningBuyers, buyers),
    orders,
    revenue,
    avgOrderValue: orders ? round2(revenue / orders) : 0,
    avgOrdersPerBuyer: buyers ? round2(orders / buyers) : 0,
    revenuePerBuyer: buyers ? round2(revenue / buyers) : 0,
  };
}

export const customersReportService = {
  async summary(filters: CustomersFilters): Promise<CustomersReport> {
    const range = resolveRange(filters);
    const bucket = pickBucket(range.days);

    const [totals, previous, trendRows, topCustomers, geo, churnRisk] =
      await Promise.all([
        totalsFor(range),
        totalsFor({ from: range.prevFrom, to: range.prevTo }),
        trend(range, bucket),
        topBuyers(range),
        geoBreakdown(range),
        churnRiskCustomers(),
      ]);

    const changes = Object.fromEntries(
      TOTAL_KEYS.map((k) => [k, change(totals[k], previous[k])])
    ) as Record<keyof CustomersTotals, number | null>;

    return {
      range: { from: range.fromISO, to: range.toISO, days: range.days, bucket },
      totals,
      previous,
      changes,
      trend: trendRows,
      topCustomers,
      byState: geo.byState,
      byCity: geo.byCity,
      churnRisk,
    };
  },
};

async function trend(
  range: ReportRange,
  bucket: Bucket
): Promise<CustomersTrendPoint[]> {
  const key = bucketSql(Prisma.sql`u.created_at`, bucket);
  const [signupRows, periodOrders] = await Promise.all([
    db.$queryRaw<{ bucket: string; signups: bigint | number }[]>(Prisma.sql`
      SELECT ${key} AS bucket, COUNT(*) AS signups
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.deleted_at IS NULL
        AND (r.slug = 'customer' OR r.name = 'CUSTOMER')
        AND u.created_at BETWEEN ${range.from} AND ${range.to}
      GROUP BY bucket
      ORDER BY bucket
    `),
    db.order.findMany({
      where: soldWhere(range),
      select: { userId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const userIds = [...new Set(periodOrders.map((o) => o.userId))];
  const firstOrders = userIds.length
    ? await db.order.groupBy({
        by: ["userId"],
        where: { ...SOLD_ORDER, userId: { in: userIds } },
        _min: { createdAt: true },
      })
    : [];
  const firstOrderByUser = new Map(
    firstOrders.map((f) => [String(f.userId), f._min.createdAt])
  );

  const signupsByBucket = new Map(
    signupRows.map((r) => [r.bucket, Number(r.signups)])
  );
  const newSets = new Map<string, Set<string>>();
  const returningSets = new Map<string, Set<string>>();

  for (const o of periodOrders) {
    const b = bucketKey(o.createdAt, bucket);
    const uid = String(o.userId);
    const firstAt = firstOrderByUser.get(uid);
    const isNew = firstAt && firstAt >= range.from && bucketKey(firstAt, bucket) === b;
    const targetMap = isNew ? newSets : returningSets;
    const set = targetMap.get(b) ?? new Set<string>();
    set.add(uid);
    targetMap.set(b, set);
  }

  return fillSeries(
    bucketSeries(range, bucket).map((b) => ({
      bucket: b,
      signups: signupsByBucket.get(b) ?? 0,
      newBuyers: newSets.get(b)?.size ?? 0,
      returningBuyers: returningSets.get(b)?.size ?? 0,
    })),
    range,
    bucket,
    (b) => ({ bucket: b, signups: 0, newBuyers: 0, returningBuyers: 0 })
  );
}

async function topBuyers(range: ReportRange): Promise<TopCustomerRow[]> {
  const rows = await db.order.groupBy({
    by: ["userId"],
    where: soldWhere(range),
    _count: { _all: true },
    _sum: { totalAmount: true },
    _min: { createdAt: true },
    _max: { createdAt: true },
    orderBy: { _sum: { totalAmount: "desc" } },
    take: TOP_LIMIT,
  });
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.userId);
  const [users, addresses] = await Promise.all([
    db.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, cust_id: true, phone: true },
    }),
    db.customerAddress.findMany({
      where: { userId: { in: ids }, is_active: true },
      orderBy: [{ isDefault: "desc" }, { id: "desc" }],
      select: { userId: true, city: true },
    }),
  ]);

  const userById = new Map(users.map((u) => [String(u.id), u]));
  const cityByUser = new Map<string, string>();
  for (const a of addresses) {
    if (!cityByUser.has(String(a.userId)) && a.city) {
      cityByUser.set(String(a.userId), a.city);
    }
  }

  const now = Date.now();
  return rows.map((r) => {
    const uid = String(r.userId);
    const u = userById.get(uid);
    const rev = num(r._sum.totalAmount);
    const orders = r._count._all;
    const last = r._max.createdAt;
    return {
      id: uid,
      name: u?.name ?? `Customer #${uid}`,
      custId: u?.cust_id ?? null,
      phone: u?.phone ?? null,
      city: cityByUser.get(uid) ?? null,
      orders,
      revenue: rev,
      avgOrderValue: orders ? round2(rev / orders) : 0,
      firstOrderAt: r._min.createdAt?.toISOString() ?? null,
      lastOrderAt: last?.toISOString() ?? null,
      daysSinceLastOrder: last
        ? Math.floor((now - last.getTime()) / DAY_MS)
        : null,
    };
  });
}

async function geoBreakdown(range: ReportRange) {
  const rows = await db.orderAddress.findMany({
    where: {
      is_active: true,
      type: "shipping",
      order: soldWhere(range),
    },
    select: {
      city: true,
      state: true,
      orderId: true,
      order: { select: { userId: true, totalAmount: true } },
    },
  });

  type Acc = {
    label: string;
    customers: Set<string>;
    orders: Set<string>;
    revenue: number;
  };
  const states = new Map<string, Acc>();
  const cities = new Map<string, Acc>();
  let totalRev = 0;

  const bump = (
    map: Map<string, Acc>,
    label: string,
    uid: string,
    oid: string,
    val: number
  ) => {
    const key = label.toLowerCase();
    const acc = map.get(key) ?? {
      label,
      customers: new Set<string>(),
      orders: new Set<string>(),
      revenue: 0,
    };
    acc.customers.add(uid);
    if (!acc.orders.has(oid)) {
      acc.orders.add(oid);
      acc.revenue = round2(acc.revenue + val);
    }
    map.set(key, acc);
  };

  const seenOrders = new Set<string>();
  for (const r of rows) {
    const oid = String(r.orderId);
    const uid = String(r.order.userId);
    const val = num(r.order.totalAmount);
    if (!seenOrders.has(oid)) {
      seenOrders.add(oid);
      totalRev = round2(totalRev + val);
    }
    if (r.state?.trim()) bump(states, r.state.trim(), uid, oid, val);
    if (r.city?.trim()) bump(cities, r.city.trim(), uid, oid, val);
  }

  const flatten = (map: Map<string, Acc>): GeoRow[] =>
    [...map.entries()]
      .map(([key, v]) => ({
        key,
        label: v.label,
        customers: v.customers.size,
        orders: v.orders.size,
        revenue: v.revenue,
        share: ratio(v.revenue, totalRev),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);

  return { byState: flatten(states), byCity: flatten(cities) };
}

async function churnRiskCustomers(): Promise<TopCustomerRow[]> {
  const cutoff = new Date(Date.now() - CHURN_DAYS * DAY_MS);
  const grouped = await db.order.groupBy({
    by: ["userId"],
    where: SOLD_ORDER,
    _count: { _all: true },
    _sum: { totalAmount: true },
    _min: { createdAt: true },
    _max: { createdAt: true },
    having: { createdAt: { _max: { lt: cutoff } } },
    orderBy: { _sum: { totalAmount: "desc" } },
    take: TOP_LIMIT,
  });
  if (grouped.length === 0) return [];

  const ids = grouped.map((g) => g.userId);
  const [users, addresses] = await Promise.all([
    db.user.findMany({
      where: { id: { in: ids }, deleted_at: null },
      select: { id: true, name: true, cust_id: true, phone: true },
    }),
    db.customerAddress.findMany({
      where: { userId: { in: ids }, is_active: true },
      orderBy: [{ isDefault: "desc" }, { id: "desc" }],
      select: { userId: true, city: true },
    }),
  ]);

  const userById = new Map(users.map((u) => [String(u.id), u]));
  const cityByUser = new Map<string, string>();
  for (const a of addresses) {
    if (!cityByUser.has(String(a.userId)) && a.city) {
      cityByUser.set(String(a.userId), a.city);
    }
  }

  const now = Date.now();
  return grouped
    .filter((g) => userById.has(String(g.userId)))
    .map((g) => {
      const uid = String(g.userId);
      const u = userById.get(uid)!;
      const rev = num(g._sum.totalAmount);
      const orders = g._count._all;
      const last = g._max.createdAt;
      return {
        id: uid,
        name: u.name,
        custId: u.cust_id ?? null,
        phone: u.phone ?? null,
        city: cityByUser.get(uid) ?? null,
        orders,
        revenue: rev,
        avgOrderValue: orders ? round2(rev / orders) : 0,
        firstOrderAt: g._min.createdAt?.toISOString() ?? null,
        lastOrderAt: last?.toISOString() ?? null,
        daysSinceLastOrder: last
          ? Math.floor((now - last.getTime()) / DAY_MS)
          : null,
      };
    });
}
