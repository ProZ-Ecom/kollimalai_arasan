import { Prisma } from "@/generated/prisma";

/**
 * Resolved reporting window in IST (+05:30) plus the equally long window
 * immediately before it for period-over-period comparison.
 */
export interface ReportRange {
  from: Date;
  to: Date;
  prevFrom: Date;
  prevTo: Date;
  days: number;
  fromISO: string;
  toISO: string;
}

const DAY_MS = 86_400_000;
const IST_OFFSET_MS = 330 * 60 * 1000;

/** Formats a UTC Date into an IST YYYY-MM-DD calendar string. */
export function toISTDateString(date: Date): string {
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Parses YYYY-MM-DD as 00:00:00.000 IST (or falls back to Date parsing). */
function startOfDayIST(value: string): Date | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(`${value}T00:00:00.000+05:30`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Parses YYYY-MM-DD as 23:59:59.999 IST (or falls back to Date parsing). */
function endOfDayIST(value: string): Date | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(`${value}T23:59:59.999+05:30`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Resolves `dateFrom` / `dateTo` into IST-aligned Date bounds. Unparseable or
 * inverted inputs fall back to the last 30 days.
 */
export function resolveRange(filters: { dateFrom?: string; dateTo?: string }): ReportRange {
  const todayIST = toISTDateString(new Date());
  const to = (filters.dateTo && endOfDayIST(filters.dateTo)) || endOfDayIST(todayIST)!;
  const toISO = toISTDateString(to);

  let from =
    (filters.dateFrom && startOfDayIST(filters.dateFrom)) ||
    startOfDayIST(toISTDateString(new Date(to.getTime() - 29 * DAY_MS)))!;

  if (from > to) {
    from = startOfDayIST(toISTDateString(new Date(to.getTime() - 29 * DAY_MS)))!;
  }

  const fromISO = toISTDateString(from);
  // Align `from` to exact IST start of its date
  from = startOfDayIST(fromISO)!;

  const span = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - span);

  return {
    from,
    to,
    prevFrom,
    prevTo,
    days: Math.max(1, Math.round((span + 1) / DAY_MS)),
    fromISO,
    toISO,
  };
}

export const inRange = (r: { from: Date; to: Date }) => ({ gte: r.from, lte: r.to });

/** Converts Prisma Decimal / number / string to a finite 2-decimal number. */
export function num(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Percentage change, returning null when the baseline is zero and current > 0. */
export function change(current: number, previous: number): number | null {
  if (!previous) return current ? null : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export const ratio = (part: number, whole: number) =>
  whole ? Math.round((part / whole) * 1000) / 10 : 0;

export type Bucket = "day" | "week" | "month";

export function pickBucket(days: number): Bucket {
  if (days <= 70) return "day";
  if (days <= 365) return "week";
  return "month";
}

/** Bucket key in IST so SQL and JS series keys always align. */
export function bucketKey(date: Date, bucket: Bucket): string {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  if (bucket === "month") return ist.toISOString().slice(0, 7);
  if (bucket === "week") {
    const day = (ist.getUTCDay() + 6) % 7;
    ist.setUTCDate(ist.getUTCDate() - day);
    return ist.toISOString().slice(0, 10);
  }
  return ist.toISOString().slice(0, 10);
}

/** Generates every bucket key across [from, to] in order so empty dates show 0. */
export function bucketSeries(range: ReportRange, bucket: Bucket): string[] {
  const keys: string[] = [];
  const cursor = new Date(range.from);
  const seen = new Set<string>();
  while (cursor <= range.to) {
    const key = bucketKey(cursor, bucket);
    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

/**
 * MariaDB/MySQL expression collapsing a UTC timestamp into its IST bucket key,
 * matching `bucketKey()` exactly.
 */
export function bucketSql(column: Prisma.Sql, bucket: Bucket): Prisma.Sql {
  const istExpr = Prisma.sql`DATE_ADD(${column}, INTERVAL 330 MINUTE)`;
  if (bucket === "month") return Prisma.sql`DATE_FORMAT(${istExpr}, '%Y-%m')`;
  if (bucket === "week") {
    return Prisma.sql`DATE_FORMAT(DATE(${istExpr}) - INTERVAL WEEKDAY(${istExpr}) DAY, '%Y-%m-%d')`;
  }
  return Prisma.sql`DATE_FORMAT(${istExpr}, '%Y-%m-%d')`;
}

/** Zero-fills missing buckets so charts render continuous timelines. */
export function fillSeries<T extends { bucket: string }>(
  rows: T[],
  range: ReportRange,
  bucket: Bucket,
  empty: (key: string) => T
): T[] {
  const byKey = new Map(rows.map((r) => [r.bucket, r]));
  return bucketSeries(range, bucket).map((key) => byKey.get(key) ?? empty(key));
}

export const ACTIVE_ORDER: Prisma.OrderWhereInput = { is_active: true };

export const SOLD_ORDER: Prisma.OrderWhereInput = {
  is_active: true,
  order_status: { notIn: ["cancelled", "returned"] },
};
