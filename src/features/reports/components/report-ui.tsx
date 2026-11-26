"use client";

import * as React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  FileSpreadsheet,
  Info,
  Minus,
  RotateCcw,
} from "lucide-react";
import { Select } from "@/components/ui/select";
import { exportToExcel } from "@/lib/excel-export";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ formatting */

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrExact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const counter = new Intl.NumberFormat("en-IN");

export const money = (n: number | null | undefined) =>
  n == null ? "—" : inr.format(n);
export const moneyExact = (n: number | null | undefined) =>
  n == null ? "—" : inrExact.format(n);
export const count = (n: number | null | undefined) =>
  n == null ? "—" : counter.format(n);
export const percent = (n: number | null | undefined) =>
  n == null ? "—" : `${n}%`;
export const days = (n: number | null | undefined) =>
  n == null ? "—" : `${n} day${n === 1 ? "" : "s"}`;

export function dateLabel(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export function formatExportDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

export function bucketLabel(key: string, bucket: "day" | "week" | "month") {
  if (bucket === "month") {
    const [y, m] = key.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", {
      month: "short",
      year: "2-digit",
    });
  }
  const d = new Date(`${key}T00:00:00.000+05:30`);
  if (Number.isNaN(d.getTime())) return key;
  const short = d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
  return bucket === "week" ? `w/c ${short}` : short;
}

/* ----------------------------------------------------------------- date presets */

export interface DatePreset {
  id: string;
  label: string;
  range: () => { dateFrom: string; dateTo: string };
}

function istIsoDate(date: Date): string {
  const istOffsetMs = 330 * 60 * 1000;
  return new Date(date.getTime() + istOffsetMs).toISOString().slice(0, 10);
}

function shiftDays(offset: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
}

export const DATE_PRESETS: DatePreset[] = [
  {
    id: "today",
    label: "Today",
    range: () => {
      const today = istIsoDate(new Date());
      return { dateFrom: today, dateTo: today };
    },
  },
  {
    id: "yesterday",
    label: "Yesterday",
    range: () => {
      const yest = istIsoDate(shiftDays(-1));
      return { dateFrom: yest, dateTo: yest };
    },
  },
  {
    id: "7d",
    label: "Last 7 days",
    range: () => ({
      dateFrom: istIsoDate(shiftDays(-6)),
      dateTo: istIsoDate(new Date()),
    }),
  },
  {
    id: "30d",
    label: "Last 30 days",
    range: () => ({
      dateFrom: istIsoDate(shiftDays(-29)),
      dateTo: istIsoDate(new Date()),
    }),
  },
  {
    id: "month",
    label: "This month",
    range: () => {
      const today = istIsoDate(new Date());
      return { dateFrom: `${today.slice(0, 7)}-01`, dateTo: today };
    },
  },
  {
    id: "lastMonth",
    label: "Last month",
    range: () => {
      const today = istIsoDate(new Date());
      const [y, m] = today.split("-").map(Number);
      const start = new Date(Date.UTC(y, m - 2, 1));
      const end = new Date(Date.UTC(y, m - 1, 0));
      return {
        dateFrom: start.toISOString().slice(0, 10),
        dateTo: end.toISOString().slice(0, 10),
      };
    },
  },
  {
    id: "year",
    label: "This year",
    range: () => {
      const today = istIsoDate(new Date());
      return { dateFrom: `${today.slice(0, 4)}-01-01`, dateTo: today };
    },
  },
];

export const DEFAULT_PRESET = "30d";

export function presetRange(id: string) {
  return (DATE_PRESETS.find((p) => p.id === id) ?? DATE_PRESETS[3]).range();
}

/* ------------------------------------------------------------------ filter bar */

export interface ExtraFilter {
  name: string;
  label: string;
  options: { value: string; label: string }[];
}

interface ReportFiltersProps {
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  extras?: ExtraFilter[];
  children?: React.ReactNode;
}

export function ReportFilters({
  value,
  onChange,
  extras = [],
  children,
}: ReportFiltersProps) {
  const activePreset = value.preset ?? DEFAULT_PRESET;
  const isCustom = activePreset === "custom";

  const hasActiveExtras = extras.some((f) => Boolean(value[f.name]));

  const setPreset = (id: string) => {
    if (id === "custom") {
      onChange({ ...value, preset: "custom" });
      return;
    }
    onChange({ ...value, preset: id, ...presetRange(id) });
  };

  const resetAll = () => {
    const next: Record<string, string> = {
      preset: DEFAULT_PRESET,
      ...presetRange(DEFAULT_PRESET),
    };
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3 px-4 py-3.5 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="mr-1 text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
            Period
          </span>
          {DATE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={activePreset === p.id}
              onClick={() => setPreset(p.id)}
              className={cn(
                "h-8 rounded-full border px-3 text-xs font-semibold transition-colors cursor-pointer",
                activePreset === p.id
                  ? "border-secondary-600 bg-secondary-600 text-white shadow-2xs"
                  : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
              )}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={isCustom}
            onClick={() => setPreset("custom")}
            className={cn(
              "h-8 rounded-full border px-3 text-xs font-semibold transition-colors cursor-pointer",
              isCustom
                ? "border-secondary-600 bg-secondary-600 text-white shadow-2xs"
                : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
            )}
          >
            Custom range
          </button>
        </div>

        {(hasActiveExtras || activePreset !== DEFAULT_PRESET) && (
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {(isCustom || extras.length > 0 || children) && (
        <div className="grid grid-cols-1 gap-3 border-t border-neutral-100 pt-3 sm:flex sm:flex-wrap sm:items-end">
          {isCustom && (
            <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-end sm:gap-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-neutral-600">
                <span>From</span>
                <input
                  type="date"
                  className="h-10 w-full sm:w-40 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900"
                  value={value.dateFrom ?? ""}
                  max={value.dateTo || undefined}
                  onChange={(e) =>
                    onChange({ ...value, preset: "custom", dateFrom: e.target.value })
                  }
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-neutral-600">
                <span>To</span>
                <input
                  type="date"
                  className="h-10 w-full sm:w-40 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900"
                  value={value.dateTo ?? ""}
                  min={value.dateFrom || undefined}
                  onChange={(e) =>
                    onChange({ ...value, preset: "custom", dateTo: e.target.value })
                  }
                />
              </label>
            </div>
          )}

          {extras.map((f) => (
            <div
              key={f.name}
              className="flex flex-col gap-1 text-xs font-medium text-neutral-600 sm:min-w-[190px] sm:max-w-[240px]"
            >
              <span>{f.label}</span>
              <Select
                size="sm"
                className="h-10 rounded-xl"
                value={value[f.name] ?? ""}
                onValueChange={(v) => onChange({ ...value, [f.name]: v })}
                options={[{ value: "", label: "All" }, ...f.options]}
                aria-label={f.label}
              />
            </div>
          ))}

          {children}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- layout */

export function Panel({
  title,
  hint,
  action,
  children,
  className,
}: {
  title?: React.ReactNode;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-8px_rgba(16,24,40,0.06)]",
        className
      )}
    >
      {(title || action) && (
        <div className="flex flex-col gap-2 border-b border-neutral-100 bg-white px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:px-5 rounded-t-2xl">
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-tight text-neutral-900">
              {title}
            </h2>
            {hint && (
              <p className="mt-0.5 max-w-2xl text-xs text-neutral-500">{hint}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Note({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "warn";
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed",
        tone === "warn"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-secondary-200 bg-secondary-50/70 text-secondary-800"
      )}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

/* ----------------------------------------------------------------- metric cards */

export function DeltaBadge({
  value,
  compareLabel,
}: {
  value: number | null | undefined;
  compareLabel?: string;
}) {
  if (value == null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-500">
        <Minus className="h-3 w-3" /> no earlier data
      </span>
    );
  }
  const flat = Math.abs(value) < 0.05;
  const up = value > 0;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      title={compareLabel ? `Compared with the ${compareLabel}` : undefined}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        flat
          ? "bg-neutral-100 text-neutral-600"
          : up
            ? "bg-emerald-50 text-emerald-700"
            : "bg-rose-50 text-rose-700"
      )}
    >
      <Icon className="h-3 w-3" />
      {flat ? "no change" : `${up ? "+" : ""}${value}%`}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  delta,
  compareLabel,
  tone = "default",
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  delta?: number | null;
  compareLabel?: string;
  tone?: "default" | "good" | "warn" | "bad";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const bar = {
    default: "bg-neutral-300",
    good: "bg-secondary-500",
    warn: "bg-amber-400",
    bad: "bg-rose-400",
  }[tone];

  const text = {
    default: "text-neutral-900",
    good: "text-secondary-700",
    warn: "text-amber-700",
    bad: "text-rose-700",
  }[tone];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs transition-shadow hover:shadow-md">
      <span className={cn("absolute inset-x-0 top-0 h-0.5", bar)} aria-hidden />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
          {label}
        </p>
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary-50 text-secondary-700">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p
        className={cn(
          "mt-2 text-xl font-bold tracking-tight tabular-nums sm:text-2xl",
          text
        )}
      >
        {value}
      </p>
      {(delta !== undefined || hint) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {delta !== undefined && (
            <DeltaBadge value={delta} compareLabel={compareLabel} />
          )}
          {hint && <p className="text-xs text-neutral-500">{hint}</p>}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- tables */

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Plain value for Excel export; falls back to string/number cell return. */
  exportValue?: (row: T) => string | number | null | undefined;
  align?: "left" | "right";
  className?: string;
}

export function ReportTable<T>({
  columns,
  rows,
  rowKey,
  empty = "No data found for this period.",
  emptyHint,
  maxHeight,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  empty?: string;
  emptyHint?: string;
  maxHeight?: string;
}) {
  return (
    <div
      tabIndex={0}
      role="region"
      aria-label="Report data table"
      className={cn(
        "relative w-full overflow-x-auto overflow-y-auto overscroll-x-contain scrollbar-thin rounded-b-2xl",
        maxHeight
      )}
    >
      <table className="w-full min-w-full table-auto caption-bottom text-sm border-separate border-spacing-0">
        <thead className="sticky top-0 z-10 bg-secondary-600 text-white">
          <tr>
            {columns.map((c, i) => (
              <th
                key={`${i}-${c.header}`}
                className={cn(
                  "h-11 px-4 text-left align-middle text-[11px] font-bold tracking-wider whitespace-nowrap uppercase sm:px-5 bg-secondary-600 text-white border-b border-secondary-700 sticky top-0 z-10",
                  c.align === "right" && "text-right",
                  c.className
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-1",
                    c.align === "right" ? "justify-end" : "justify-start"
                  )}
                >
                  {c.header}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="bg-white px-5 py-12 text-center text-sm text-neutral-500"
              >
                <p className="font-medium text-neutral-700">{empty}</p>
                {emptyHint && (
                  <p className="mx-auto mt-1 max-w-sm text-xs text-neutral-500">
                    {emptyHint}
                  </p>
                )}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr
                key={rowKey(row, idx)}
                className="group transition-colors hover:bg-neutral-50/90"
              >
                {columns.map((c, i) => (
                  <td
                    key={`${i}-${c.header}`}
                    className={cn(
                      "border-b border-neutral-100 bg-white px-4 py-3 align-middle whitespace-nowrap text-sm text-neutral-800 transition-colors group-hover:bg-neutral-50/90 group-last:border-b-0 sm:px-5",
                      c.align === "right" && "text-right tabular-nums",
                      c.className
                    )}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/** Exports the report table's exact rows and columns to .xlsx using Kollimalai's Excel utility. */
export function ExportButton<T>({
  rows,
  columns,
  fileName,
  sheetName = "Report",
  label = "Export Excel",
}: {
  rows: T[];
  columns: Column<T>[];
  fileName: string;
  sheetName?: string;
  label?: string;
}) {
  const disabled = rows.length === 0;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        const headers = columns.map((c) => c.header);
        const rawRows: (string | number)[][] = [
          headers,
          ...rows.map((row) =>
            columns.map((c) => {
              if (c.exportValue) {
                const v = c.exportValue(row);
                return v == null ? "" : v;
              }
              const raw = c.cell(row);
              return typeof raw === "string" || typeof raw === "number" ? raw : "";
            })
          ),
        ];

        exportToExcel({
          filename: fileName,
          sheetName,
          rawRows,
        });
      }}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors",
        disabled
          ? "cursor-not-allowed border-neutral-200 bg-neutral-50 text-neutral-400"
          : "border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50 hover:border-emerald-400 cursor-pointer"
      )}
    >
      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
      {label}
    </button>
  );
}

export function ShareBar({ share }: { share: number }) {
  const width = Math.max(0, Math.min(100, share));
  return (
    <span className="flex items-center justify-end gap-2">
      <span
        className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-neutral-100 sm:block"
        aria-hidden
      >
        <span
          className="block h-full rounded-full bg-secondary-600"
          style={{ width: `${width}%` }}
        />
      </span>
      <span className="tabular-nums text-neutral-600">{share}%</span>
    </span>
  );
}

export {
  CHART_COLORS,
  CHART_PALETTE,
  DonutChart,
  HorizontalBarChart,
  TrendChart,
  type BarItem,
  type DonutSlice,
  type SeriesDef,
} from "./report-charts";

/* ------------------------------------------------------------------- feedback */

export function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100/70"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100/70" />
      <div className="h-64 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100/70" />
    </div>
  );
}

export function ReportError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-12 text-center">
      <p className="text-sm font-semibold text-rose-800">
        This report could not be loaded.
      </p>
      <p className="max-w-md text-xs text-rose-700">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="h-9 rounded-xl border border-rose-300 bg-white px-4 text-xs font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function RangeCaption({
  from,
  to,
  days: span,
}: {
  from: string;
  to: string;
  days: number;
}) {
  return (
    <p className="text-xs font-medium text-neutral-500">
      {dateLabel(from)} – {dateLabel(to)} · {span} day{span === 1 ? "" : "s"}
    </p>
  );
}

export function compareLabelFor(span: number) {
  return `previous ${span} day${span === 1 ? "" : "s"}`;
}
