import { Prisma } from "@/generated/prisma";
import { db } from "@/lib/db/prisma";
import {
  ACTIVE_ORDER,
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
import { resolveDeliveryPartnerFilter } from "../lib/report-filters";
import {
  IN_PROGRESS_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_ORDER,
  PAYMENT_STATUS_LABELS,
  RETURN_STATUS_LABELS,
} from "../lib/report-labels";

const DAY_MS = 86_400_000;
const ORDERS_LIMIT = 250;

export interface OrdersFilters {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  paymentStatus?: string;
  deliveryPartner?: string;
}

export interface OrdersTotals {
  orders: number;
  value: number;
  delivered: number;
  deliveredValue: number;
  inProgress: number;
  cancelled: number;
  cancelledValue: number;
  returned: number;
  cancelRate: number;
  returnRate: number;
  fulfilmentRate: number;
  avgDeliveryDays: number | null;
}

export interface StatusRow {
  status: string;
  label: string;
  orders: number;
  value: number;
  share: number;
}

export interface DeliveryPartnerRow {
  key: string;
  partner: string;
  shipments: number;
  delivered: number;
  inTransit: number;
  failed: number;
  avgDeliveryDays: number | null;
}

export interface ReturnReasonRow {
  reason: string;
  status: string;
  requests: number;
  refundValue: number;
}

export interface OrdersTrendPoint {
  bucket: string;
  placed: number;
  delivered: number;
  cancelled: number;
}

export interface OrderListRow {
  id: string;
  orderNumber: string;
  placedAt: string | null;
  customer: string;
  location: string;
  status: string;
  paymentStatus: string;
  items: number;
  value: number;
  deliveredAt: string | null;
  deliveryDays: number | null;
}

export interface OrdersReport {
  range: { from: string; to: string; days: number; bucket: Bucket };
  totals: OrdersTotals;
  previous: OrdersTotals;
  changes: Record<keyof OrdersTotals, number | null>;
  byStatus: StatusRow[];
  byPaymentStatus: StatusRow[];
  byDeliveryPartner: DeliveryPartnerRow[];
  returnReasons: ReturnReasonRow[];
  trend: OrdersTrendPoint[];
  orders: OrderListRow[];
  ordersTruncated: boolean;
}

const TOTAL_KEYS: (keyof OrdersTotals)[] = [
  "orders",
  "value",
  "delivered",
  "deliveredValue",
  "inProgress",
  "cancelled",
  "cancelledValue",
  "returned",
  "cancelRate",
  "returnRate",
  "fulfilmentRate",
  "avgDeliveryDays",
];

function orderWhere(
  filters: OrdersFilters,
  partnerId: bigint | null,
  window: { from: Date; to: Date }
): Prisma.OrderWhereInput {
  return {
    ...ACTIVE_ORDER,
    createdAt: inRange(window),
    ...(filters.status
      ? { order_status: filters.status as Prisma.OrderWhereInput["order_status"] }
      : {}),
    ...(filters.paymentStatus
      ? {
          payment_status:
            filters.paymentStatus as Prisma.OrderWhereInput["payment_status"],
        }
      : {}),
    ...(partnerId !== null
      ? {
          shipments: {
            some: { is_active: true, delivery_partner_id: partnerId },
          },
        }
      : {}),
  };
}

async function totalsFor(
  where: Prisma.OrderWhereInput
): Promise<OrdersTotals> {
  const [grouped, shipments] = await Promise.all([
    db.order.groupBy({
      by: ["order_status"],
      where,
      _count: { _all: true },
      _sum: { totalAmount: true },
    }),
    db.shipments.findMany({
      where: {
        is_active: true,
        delivered_at: { not: null },
        orders: where,
      },
      select: {
        delivered_at: true,
        orders: { select: { placed_at: true, createdAt: true } },
      },
    }),
  ]);

  let orders = 0;
  let value = 0;
  let delivered = 0;
  let deliveredValue = 0;
  let inProgress = 0;
  let cancelled = 0;
  let cancelledValue = 0;
  let returned = 0;

  for (const g of grouped) {
    const c = g._count._all;
    const v = num(g._sum.totalAmount);
    orders += c;
    value = round2(value + v);

    const st = String(g.order_status);
    if (st === "delivered") {
      delivered += c;
      deliveredValue = round2(deliveredValue + v);
    } else if (st === "cancelled") {
      cancelled += c;
      cancelledValue = round2(cancelledValue + v);
    } else if (st === "returned") {
      returned += c;
    } else if ((IN_PROGRESS_STATUSES as readonly string[]).includes(st)) {
      inProgress += c;
    }
  }

  let totalDays = 0;
  let deliveredCount = 0;
  for (const s of shipments) {
    const start = s.orders.placed_at ?? s.orders.createdAt;
    if (s.delivered_at && start) {
      const diff = (s.delivered_at.getTime() - start.getTime()) / DAY_MS;
      if (diff >= 0) {
        totalDays += diff;
        deliveredCount += 1;
      }
    }
  }

  return {
    orders,
    value,
    delivered,
    deliveredValue,
    inProgress,
    cancelled,
    cancelledValue,
    returned,
    cancelRate: ratio(cancelled, orders),
    returnRate: ratio(returned, orders),
    fulfilmentRate: ratio(delivered, orders),
    avgDeliveryDays: deliveredCount
      ? round2(totalDays / deliveredCount)
      : null,
  };
}

export const ordersReportService = {
  async summary(filters: OrdersFilters): Promise<OrdersReport> {
    const range = resolveRange(filters);
    const bucket = pickBucket(range.days);
    const partnerId = await resolveDeliveryPartnerFilter(filters.deliveryPartner);

    const where = orderWhere(filters, partnerId, range);
    const prevWhere = orderWhere(filters, partnerId, {
      from: range.prevFrom,
      to: range.prevTo,
    });

    const [
      totals,
      previous,
      byStatus,
      byPaymentStatus,
      byDeliveryPartner,
      returnReasons,
      trendRows,
      ordersList,
    ] = await Promise.all([
      totalsFor(where),
      totalsFor(prevWhere),
      statusBreakdown(where),
      paymentStatusBreakdown(where),
      partnerBreakdown(where),
      returnBreakdown(range),
      trend(range, bucket, filters, partnerId),
      recentOrders(where),
    ]);

    const changes = Object.fromEntries(
      TOTAL_KEYS.map((k) => [
        k,
        totals[k] == null || previous[k] == null
          ? null
          : change(totals[k] as number, previous[k] as number),
      ])
    ) as Record<keyof OrdersTotals, number | null>;

    return {
      range: { from: range.fromISO, to: range.toISO, days: range.days, bucket },
      totals,
      previous,
      changes,
      byStatus,
      byPaymentStatus,
      byDeliveryPartner,
      returnReasons,
      trend: trendRows,
      orders: ordersList,
      ordersTruncated: ordersList.length === ORDERS_LIMIT,
    };
  },
};

async function statusBreakdown(
  where: Prisma.OrderWhereInput
): Promise<StatusRow[]> {
  const rows = await db.order.groupBy({
    by: ["order_status"],
    where,
    _count: { _all: true },
    _sum: { totalAmount: true },
  });
  const total = rows.reduce((s, r) => s + r._count._all, 0);

  return rows
    .map((r) => {
      const status = String(r.order_status);
      return {
        status,
        label: ORDER_STATUS_LABELS[status] ?? status,
        orders: r._count._all,
        value: num(r._sum.totalAmount),
        share: ratio(r._count._all, total),
      };
    })
    .sort(
      (a, b) =>
        ORDER_STATUS_ORDER.indexOf(a.status) -
        ORDER_STATUS_ORDER.indexOf(b.status)
    );
}

async function paymentStatusBreakdown(
  where: Prisma.OrderWhereInput
): Promise<StatusRow[]> {
  const rows = await db.order.groupBy({
    by: ["payment_status"],
    where,
    _count: { _all: true },
    _sum: { totalAmount: true },
  });
  const total = rows.reduce((s, r) => s + r._count._all, 0);
  const order = Object.keys(PAYMENT_STATUS_LABELS);

  return rows
    .map((r) => {
      const status = String(r.payment_status);
      return {
        status,
        label: PAYMENT_STATUS_LABELS[status] ?? status,
        orders: r._count._all,
        value: num(r._sum.totalAmount),
        share: ratio(r._count._all, total),
      };
    })
    .sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
}

async function partnerBreakdown(
  where: Prisma.OrderWhereInput
): Promise<DeliveryPartnerRow[]> {
  const shipments = await db.shipments.findMany({
    where: { is_active: true, orders: where },
    select: {
      status: true,
      delivered_at: true,
      courier_partner_name: true,
      delivery_partner_id: true,
      delivery_partners: { select: { name: true } },
      orders: { select: { placed_at: true, createdAt: true } },
    },
  });

  type Acc = {
    partner: string;
    shipments: number;
    delivered: number;
    inTransit: number;
    failed: number;
    daysSum: number;
    daysCount: number;
  };
  const map = new Map<string, Acc>();

  for (const s of shipments) {
    const partnerName =
      s.delivery_partners?.name ||
      s.courier_partner_name ||
      "Unassigned / Manual";
    const key =
      s.delivery_partner_id != null
        ? `p-${s.delivery_partner_id}`
        : `name-${partnerName}`;
    const acc = map.get(key) ?? {
      partner: partnerName,
      shipments: 0,
      delivered: 0,
      inTransit: 0,
      failed: 0,
      daysSum: 0,
      daysCount: 0,
    };

    acc.shipments += 1;
    const st = String(s.status);
    if (st === "delivered") acc.delivered += 1;
    else if (st === "failed") acc.failed += 1;
    else if (["picked_up", "in_transit", "out_for_delivery"].includes(st)) {
      acc.inTransit += 1;
    }

    const start = s.orders.placed_at ?? s.orders.createdAt;
    if (s.delivered_at && start) {
      const diff = (s.delivered_at.getTime() - start.getTime()) / DAY_MS;
      if (diff >= 0) {
        acc.daysSum += diff;
        acc.daysCount += 1;
      }
    }

    map.set(key, acc);
  }

  return [...map.entries()]
    .map(([key, v]) => ({
      key,
      partner: v.partner,
      shipments: v.shipments,
      delivered: v.delivered,
      inTransit: v.inTransit,
      failed: v.failed,
      avgDeliveryDays: v.daysCount ? round2(v.daysSum / v.daysCount) : null,
    }))
    .sort((a, b) => b.shipments - a.shipments);
}

async function returnBreakdown(range: ReportRange): Promise<ReturnReasonRow[]> {
  const rows = await db.return_requests.findMany({
    where: { is_active: true, requested_at: inRange(range) },
    select: {
      reason: true,
      status: true,
      return_items: {
        where: { is_active: true },
        select: { refund_amount: true },
      },
    },
  });

  type Acc = { reason: string; status: string; requests: number; refundValue: number };
  const map = new Map<string, Acc>();

  for (const r of rows) {
    const reason = r.reason.trim() || "Not specified";
    const status = String(r.status);
    const key = `${reason}::${status}`;
    const refundSum = r.return_items.reduce(
      (sum, item) => sum + num(item.refund_amount),
      0
    );
    const acc = map.get(key) ?? {
      reason,
      status: RETURN_STATUS_LABELS[status] ?? status,
      requests: 0,
      refundValue: 0,
    };
    acc.requests += 1;
    acc.refundValue = round2(acc.refundValue + refundSum);
    map.set(key, acc);
  }

  return [...map.values()].sort((a, b) => b.requests - a.requests);
}

async function trend(
  range: ReportRange,
  bucket: Bucket,
  filters: OrdersFilters,
  partnerId: bigint | null
): Promise<OrdersTrendPoint[]> {
  const key = bucketSql(Prisma.sql`o.created_at`, bucket);
  const rows = await db.$queryRaw<
    {
      bucket: string;
      placed: bigint | number;
      delivered: bigint | number;
      cancelled: bigint | number;
    }[]
  >(Prisma.sql`
    SELECT ${key} AS bucket,
           COUNT(*) AS placed,
           SUM(CASE WHEN o.order_status = 'delivered' THEN 1 ELSE 0 END) AS delivered,
           SUM(CASE WHEN o.order_status IN ('cancelled', 'returned') THEN 1 ELSE 0 END) AS cancelled
    FROM orders o
    WHERE o.is_active = 1
      AND o.created_at BETWEEN ${range.from} AND ${range.to}
      ${filters.status ? Prisma.sql`AND o.order_status = ${filters.status}` : Prisma.empty}
      ${filters.paymentStatus ? Prisma.sql`AND o.payment_status = ${filters.paymentStatus}` : Prisma.empty}
      ${partnerId !== null ? Prisma.sql`AND EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.id AND s.is_active = 1 AND s.delivery_partner_id = ${partnerId})` : Prisma.empty}
    GROUP BY bucket
    ORDER BY bucket
  `);

  return fillSeries(
    rows.map((r) => ({
      bucket: r.bucket,
      placed: Number(r.placed),
      delivered: Number(r.delivered ?? 0),
      cancelled: Number(r.cancelled ?? 0),
    })),
    range,
    bucket,
    (b) => ({ bucket: b, placed: 0, delivered: 0, cancelled: 0 })
  );
}

async function recentOrders(
  where: Prisma.OrderWhereInput
): Promise<OrderListRow[]> {
  const rows = await db.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: ORDERS_LIMIT,
    select: {
      id: true,
      orderNumber: true,
      placed_at: true,
      createdAt: true,
      order_status: true,
      payment_status: true,
      totalAmount: true,
      user: { select: { name: true, cust_id: true } },
      address: {
        where: { type: "shipping", is_active: true },
        take: 1,
        select: { city: true, state: true },
      },
      _count: { select: { items: true } },
      shipments: {
        where: { is_active: true },
        orderBy: { created_at: "desc" },
        take: 1,
        select: { delivered_at: true },
      },
    },
  });

  return rows.map((o) => {
    const start = o.placed_at ?? o.createdAt;
    const deliveredAt = o.shipments[0]?.delivered_at ?? null;
    const deliveryDays =
      deliveredAt && start
        ? round2(Math.max(0, (deliveredAt.getTime() - start.getTime()) / DAY_MS))
        : null;
    const addr = o.address[0];
    const location = addr
      ? [addr.city, addr.state].filter(Boolean).join(", ")
      : "—";

    return {
      id: String(o.id),
      orderNumber: o.orderNumber,
      placedAt: start?.toISOString() ?? null,
      customer: o.user
        ? `${o.user.name}${o.user.cust_id ? ` (${o.user.cust_id})` : ""}`
        : "Guest",
      location,
      status: String(o.order_status),
      paymentStatus: String(o.payment_status),
      items: o._count.items,
      value: num(o.totalAmount),
      deliveredAt: deliveredAt?.toISOString() ?? null,
      deliveryDays,
    };
  });
}
