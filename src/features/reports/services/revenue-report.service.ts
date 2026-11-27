import { Prisma } from "@/generated/prisma";
import { db } from "@/lib/db/prisma";
import {
  SOLD_ORDER,
  bucketSql,
  change,
  fillSeries,
  inRange,
  num,
  pickBucket,
  resolveRange,
  round2,
  type Bucket,
  type ReportRange,
} from "../lib/report-range";
import { resolvePaymentMethodFilter } from "../lib/report-filters";
import { PAYMENT_STATUS_LABELS } from "../lib/report-labels";

export interface RevenueFilters {
  dateFrom?: string;
  dateTo?: string;
  paymentMethod?: string;
}

export interface RevenueTotals {
  grossSales: number;
  discount: number;
  coupons: number;
  tax: number;
  shipping: number;
  netRevenue: number;
  collected: number;
  outstanding: number;
  refunded: number;
  netInflow: number;
}

export interface RevenueTrendPoint {
  bucket: string;
  netRevenue: number;
  tax: number;
  discount: number;
}

export interface TaxRow {
  hsnCode: string;
  description: string;
  gstName: string;
  cgst: number;
  sgst: number;
  igst: number;
  taxableValue: number;
  taxAmount: number;
  units: number;
}

export interface PaymentMethodRow {
  code: string;
  label: string;
  orders: number;
  amount: number;
}

export interface PaymentStatusRow {
  status: string;
  label: string;
  orders: number;
  value: number;
}

export interface OutstandingRow {
  id: string;
  orderNumber: string;
  placedAt: string | null;
  customer: string;
  status: string;
  paymentStatus: string;
  value: number;
  paid: number;
  due: number;
}

export interface RevenueReport {
  range: { from: string; to: string; days: number; bucket: Bucket };
  totals: RevenueTotals;
  previous: RevenueTotals;
  changes: Record<keyof RevenueTotals, number | null>;
  trend: RevenueTrendPoint[];
  tax: TaxRow[];
  paymentMethods: PaymentMethodRow[];
  paymentStatus: PaymentStatusRow[];
  outstanding: OutstandingRow[];
  outstandingTruncated: boolean;
}

const TOTAL_KEYS: (keyof RevenueTotals)[] = [
  "grossSales",
  "discount",
  "coupons",
  "tax",
  "shipping",
  "netRevenue",
  "collected",
  "outstanding",
  "refunded",
  "netInflow",
];

const OUTSTANDING_LIMIT = 300;

function soldWhere(
  window: { from: Date; to: Date },
  methodId: bigint | null
): Prisma.OrderWhereInput {
  return {
    ...SOLD_ORDER,
    createdAt: inRange(window),
    ...(methodId !== null
      ? { payments: { some: { is_active: true, payment_method_id: methodId } } }
      : {}),
  };
}

async function totalsFor(
  window: { from: Date; to: Date },
  methodId: bigint | null
): Promise<RevenueTotals> {
  const where = soldWhere(window, methodId);

  const [orderAgg, couponAgg, paidAgg, refundAgg] = await Promise.all([
    db.order.aggregate({
      where,
      _sum: {
        subtotal: true,
        discountAmount: true,
        taxAmount: true,
        shipping_charge: true,
        totalAmount: true,
      },
    }),
    db.coupon_usage.aggregate({
      where: {
        is_active: true,
        used_at: inRange(window),
        ...(methodId !== null ? { orders: where } : {}),
      },
      _sum: { discount_amount: true },
    }),
    db.payment.aggregate({
      where: {
        is_active: true,
        status: "success",
        ...(methodId !== null ? { payment_method_id: methodId } : {}),
        order: where,
      },
      _sum: { amount: true },
    }),
    db.refunds.aggregate({
      where: {
        is_active: true,
        status: "completed",
        created_at: inRange(window),
        ...(methodId !== null
          ? { payments: { payment_method_id: methodId } }
          : {}),
      },
      _sum: { amount: true },
    }),
  ]);

  const netRevenue = num(orderAgg._sum.totalAmount);
  const collected = num(paidAgg._sum.amount);
  const refunded = num(refundAgg._sum.amount);

  return {
    grossSales: num(orderAgg._sum.subtotal),
    discount: num(orderAgg._sum.discountAmount),
    coupons: num(couponAgg._sum.discount_amount),
    tax: num(orderAgg._sum.taxAmount),
    shipping: num(orderAgg._sum.shipping_charge),
    netRevenue,
    collected,
    outstanding: round2(Math.max(0, netRevenue - collected)),
    refunded,
    netInflow: round2(collected - refunded),
  };
}

export const revenueReportService = {
  async summary(filters: RevenueFilters): Promise<RevenueReport> {
    const range = resolveRange(filters);
    const bucket = pickBucket(range.days);
    const methodId = await resolvePaymentMethodFilter(filters.paymentMethod);

    const [totals, previous, trendRows, taxRows, methods, statuses, due] =
      await Promise.all([
        totalsFor(range, methodId),
        totalsFor({ from: range.prevFrom, to: range.prevTo }, methodId),
        trend(range, bucket, methodId),
        taxSummary(range, methodId),
        paymentMethods(range, methodId),
        paymentStatus(range, methodId),
        outstandingOrders(range, methodId),
      ]);

    const changes = Object.fromEntries(
      TOTAL_KEYS.map((k) => [k, change(totals[k], previous[k])])
    ) as Record<keyof RevenueTotals, number | null>;

    return {
      range: { from: range.fromISO, to: range.toISO, days: range.days, bucket },
      totals,
      previous,
      changes,
      trend: trendRows,
      tax: taxRows,
      paymentMethods: methods,
      paymentStatus: statuses,
      outstanding: due,
      outstandingTruncated: due.length === OUTSTANDING_LIMIT,
    };
  },
};

async function trend(
  range: ReportRange,
  bucket: Bucket,
  methodId: bigint | null
): Promise<RevenueTrendPoint[]> {
  const key = bucketSql(Prisma.sql`o.created_at`, bucket);
  const rows = await db.$queryRaw<
    {
      bucket: string;
      net: Prisma.Decimal | null;
      tax: Prisma.Decimal | null;
      discount: Prisma.Decimal | null;
    }[]
  >(Prisma.sql`
    SELECT ${key} AS bucket,
           COALESCE(SUM(o.total_amount), 0) AS net,
           COALESCE(SUM(o.tax_amount), 0) AS tax,
           COALESCE(SUM(o.discount_amount), 0) AS discount
    FROM orders o
    WHERE o.is_active = 1
      AND o.order_status NOT IN ('cancelled', 'returned')
      AND o.created_at BETWEEN ${range.from} AND ${range.to}
      ${methodId !== null ? Prisma.sql`AND EXISTS (SELECT 1 FROM payments p WHERE p.order_id = o.id AND p.is_active = 1 AND p.payment_method_id = ${methodId})` : Prisma.empty}
    GROUP BY bucket
    ORDER BY bucket
  `);

  return fillSeries(
    rows.map((r) => ({
      bucket: r.bucket,
      netRevenue: num(r.net),
      tax: num(r.tax),
      discount: num(r.discount),
    })),
    range,
    bucket,
    (b) => ({ bucket: b, netRevenue: 0, tax: 0, discount: 0 })
  );
}

/**
 * HSN-wise tax summary. Products without an HSN mapping are grouped under
 * "Not mapped" so total taxable value + tax reconciles with order totals.
 */
async function taxSummary(
  range: ReportRange,
  methodId: bigint | null
): Promise<TaxRow[]> {
  const items = await db.orderItem.findMany({
    where: { is_active: true, order: soldWhere(range, methodId) },
    select: {
      quantity: true,
      total_price: true,
      tax_amount: true,
      product: {
        select: {
          hsn_code_id: true,
          product_hsn_codes: {
            select: {
              code: true,
              description: true,
              product_gst_rates: {
                select: {
                  name: true,
                  cgst_percent: true,
                  sgst_percent: true,
                  igst_percent: true,
                },
              },
            },
          },
        },
      },
    },
  });

  type Acc = Omit<TaxRow, "taxableValue" | "taxAmount" | "units"> & {
    taxableValue: number;
    taxAmount: number;
    units: number;
  };
  const byHsn = new Map<string, Acc>();

  for (const item of items) {
    const hsn = item.product?.product_hsn_codes;
    const gst = hsn?.product_gst_rates;
    const key = hsn?.code ?? "unmapped";
    const taxAmount = num(item.tax_amount);
    const total = num(item.total_price);

    const row =
      byHsn.get(key) ??
      ({
        hsnCode: hsn?.code ?? "Not mapped",
        description: hsn
          ? (hsn.description ?? "—")
          : "No HSN code assigned to product",
        gstName: gst?.name ?? "—",
        cgst: num(gst?.cgst_percent),
        sgst: num(gst?.sgst_percent),
        igst: num(gst?.igst_percent),
        taxableValue: 0,
        taxAmount: 0,
        units: 0,
      } satisfies Acc);

    row.taxableValue = round2(row.taxableValue + Math.max(0, total - taxAmount));
    row.taxAmount = round2(row.taxAmount + taxAmount);
    row.units += item.quantity;
    byHsn.set(key, row);
  }

  return [...byHsn.values()].sort((a, b) => b.taxAmount - a.taxAmount);
}

async function paymentMethods(
  range: ReportRange,
  methodId: bigint | null
): Promise<PaymentMethodRow[]> {
  const rows = await db.payment.groupBy({
    by: ["payment_method_id"],
    where: {
      is_active: true,
      status: "success",
      ...(methodId !== null ? { payment_method_id: methodId } : {}),
      order: soldWhere(range, methodId),
    },
    _count: { _all: true },
    _sum: { amount: true },
  });
  if (rows.length === 0) return [];

  const methods = await db.payment_methods.findMany({
    where: { id: { in: rows.map((r) => r.payment_method_id) } },
    select: { id: true, name: true, code: true },
  });
  const byId = new Map(methods.map((m) => [String(m.id), m]));

  return rows
    .map((r) => {
      const m = byId.get(String(r.payment_method_id));
      return {
        code: m?.code ?? String(r.payment_method_id),
        label: m?.name ?? `Method #${r.payment_method_id}`,
        orders: r._count._all,
        amount: num(r._sum.amount),
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

async function paymentStatus(
  range: ReportRange,
  methodId: bigint | null
): Promise<PaymentStatusRow[]> {
  const rows = await db.order.groupBy({
    by: ["payment_status"],
    where: {
      is_active: true,
      createdAt: inRange(range),
      ...(methodId !== null
        ? { payments: { some: { is_active: true, payment_method_id: methodId } } }
        : {}),
    },
    _count: { _all: true },
    _sum: { totalAmount: true },
  });
  const order = Object.keys(PAYMENT_STATUS_LABELS);

  return rows
    .map((r) => ({
      status: String(r.payment_status),
      label:
        PAYMENT_STATUS_LABELS[String(r.payment_status)] ??
        String(r.payment_status),
      orders: r._count._all,
      value: num(r._sum.totalAmount),
    }))
    .sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
}

async function outstandingOrders(
  range: ReportRange,
  methodId: bigint | null
): Promise<OutstandingRow[]> {
  const rows = await db.order.findMany({
    where: {
      ...soldWhere(range, methodId),
      payment_status: { in: ["pending", "failed", "partial_refund"] },
    },
    orderBy: { createdAt: "desc" },
    take: OUTSTANDING_LIMIT,
    select: {
      id: true,
      orderNumber: true,
      placed_at: true,
      createdAt: true,
      order_status: true,
      payment_status: true,
      totalAmount: true,
      user: { select: { name: true, cust_id: true } },
      payments: {
        where: { is_active: true, status: "success" },
        select: { amount: true },
      },
    },
  });

  return rows
    .map((o) => {
      const value = num(o.totalAmount);
      const paid = round2(
        o.payments.reduce((sum, p) => sum + num(p.amount), 0)
      );
      return {
        id: String(o.id),
        orderNumber: o.orderNumber,
        placedAt: (o.placed_at ?? o.createdAt)?.toISOString() ?? null,
        customer: o.user
          ? `${o.user.name}${o.user.cust_id ? ` (${o.user.cust_id})` : ""}`
          : "Guest",
        status: String(o.order_status),
        paymentStatus: String(o.payment_status),
        value,
        paid,
        due: round2(Math.max(0, value - paid)),
      };
    })
    .filter((r) => r.due > 0)
    .sort((a, b) => b.due - a.due);
}
