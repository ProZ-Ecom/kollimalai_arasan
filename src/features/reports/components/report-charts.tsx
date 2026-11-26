"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ shared helpers */

export const CHART_COLORS = {
  primary: "#007f06",
  teal: "#0d9488",
  amber: "#d97706",
  rose: "#e11d48",
  violet: "#7c3aed",
  blue: "#2563eb",
  slate: "#64748b",
  gold: "#c69811",
};

export const CHART_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.blue,
  CHART_COLORS.amber,
  CHART_COLORS.violet,
  CHART_COLORS.teal,
  CHART_COLORS.rose,
  CHART_COLORS.gold,
  CHART_COLORS.slate,
];

export function chartBucketLabel(key: string, bucket: "day" | "week" | "month") {
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

function niceMax(v: number): number {
  if (v <= 0) return 100;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

function formatShortUnit(val: number, divisor: number, suffix: string): string {
  const scaled = val / divisor;
  return `${Number.isInteger(scaled) ? scaled : Number(scaled.toFixed(1))}${suffix}`;
}

function formatAxisTick(val: number, sampleFormatted: string): string {
  const isCurrency = sampleFormatted.includes("₹");
  const prefix = isCurrency ? "₹" : "";
  if (val >= 10_000_000) return `${prefix}${formatShortUnit(val, 10_000_000, "Cr")}`;
  if (val >= 100_000) return `${prefix}${formatShortUnit(val, 100_000, "L")}`;
  if (val >= 1_000) return `${prefix}${formatShortUnit(val, 1_000, "k")}`;
  return `${prefix}${Math.round(val)}`;
}

/**
 * Fritsch–Carlson monotone cubic Hermite spline path.
 * Smooth between non-zero points and mathematically guaranteed never to
 * overshoot below the ₹0 baseline or above peaks on sharp transitions.
 */
function getSplinePath(points: { x: number; y: number }[]): string {
  const n = points.length;
  if (n === 0) return "";
  if (n === 1) return `M ${points[0].x} ${points[0].y}`;
  if (n === 2) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
  }

  const dx: number[] = [];
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const d = points[i + 1].x - points[i].x;
    dx.push(d);
    slopes.push(d !== 0 ? (points[i + 1].y - points[i].y) / d : 0);
  }

  const tangents = new Array<number>(n).fill(0);
  tangents[0] = slopes[0];
  tangents[n - 1] = slopes[n - 2];

  for (let i = 1; i < n - 1; i++) {
    const mPrev = slopes[i - 1];
    const mNext = slopes[i];
    if (mPrev === 0 || mNext === 0 || (mPrev > 0) !== (mNext > 0)) {
      tangents[i] = 0;
    } else {
      tangents[i] = (mPrev + mNext) / 2;
    }
  }

  for (let i = 0; i < n - 1; i++) {
    const m = slopes[i];
    if (m === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
    } else {
      const alpha = tangents[i] / m;
      const beta = tangents[i + 1] / m;
      const hypot2 = alpha * alpha + beta * beta;
      if (hypot2 > 9) {
        const tau = 3 / Math.sqrt(hypot2);
        tangents[i] = tau * alpha * m;
        tangents[i + 1] = tau * beta * m;
      }
    }
  }

  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const h = dx[i] / 3;
    const cp1x = p1.x + h;
    const cp1y = p1.y + h * tangents[i];
    const cp2x = p2.x - h;
    const cp2y = p2.y - h * tangents[i + 1];
    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return path;
}

/**
 * Selects X-axis tick indices guaranteed never to collide or overlap in SVG pixel
 * space, always preserving the first and last dates when spacing permits.
 */
function selectNonOverlappingTicks(
  count: number,
  getX: (index: number) => number,
  minGapPx = 78
): number[] {
  if (count <= 0) return [];
  if (count === 1) return [0];

  const firstX = getX(0);
  const lastX = getX(count - 1);
  if (lastX - firstX < minGapPx) return [0];

  const maxTicks = Math.max(2, Math.floor((lastX - firstX) / minGapPx) + 1);
  const step = Math.max(1, Math.ceil((count - 1) / (maxTicks - 1)));

  const selected: number[] = [0];
  for (let i = step; i < count - 1; i += step) {
    const px = getX(i);
    const prevPx = getX(selected[selected.length - 1]);
    if (px - prevPx >= minGapPx && lastX - px >= minGapPx) {
      selected.push(i);
    }
  }
  selected.push(count - 1);
  return selected;
}

/* ------------------------------------------------------------------ TrendChart */

export interface SeriesDef<T> {
  key: string;
  label: string;
  value: (row: T) => number;
  color: string;
  kind?: "line" | "bar";
}

/**
 * Responsive smooth spline-area + bar SVG chart with collision-free X-axis
 * labels, symmetric bar alignment, series toggles, and floating hover callout.
 */
export function TrendChart<T extends { bucket: string }>({
  data,
  series,
  bucket,
  format = (n) => String(n),
  height = 260,
}: {
  data: T[];
  series: SeriesDef<T>[];
  bucket: "day" | "week" | "month";
  format?: (n: number) => string;
  height?: number;
}) {
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);
  const [hiddenKeys, setHiddenKeys] = React.useState<Record<string, boolean>>({});
  const uid = React.useId().replace(/:/g, "");

  const visibleSeries = React.useMemo(() => {
    const filtered = series.filter((s) => !hiddenKeys[s.key]);
    return filtered.length > 0 ? filtered : series;
  }, [series, hiddenKeys]);

  const toggleSeries = (key: string) => {
    setHiddenKeys((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      const remaining = series.filter((s) => !next[s.key]);
      return remaining.length === 0 ? prev : next;
    });
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
        <p className="text-sm font-medium text-neutral-600">
          No activity recorded in this period.
        </p>
      </div>
    );
  }

  const width = 880;
  const pad = { top: 24, right: 34, bottom: 40, left: 68 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const rawMax = Math.max(
    0,
    ...data.flatMap((row) => visibleSeries.map((s) => s.value(row)))
  );
  const hasAnyValue = rawMax > 0;
  const max = niceMax(rawMax);
  const sampleFormatted = format(max);

  const barSeries = visibleSeries.filter((s) => s.kind === "bar");
  const lineSeries = visibleSeries.filter((s) => s.kind !== "bar");
  const hasBars = barSeries.length > 0;
  const bandW = plotW / Math.max(1, data.length);

  // Center points inside equal bands when bars are drawn so bars never spill past y-axis
  const x = (i: number) => {
    if (data.length === 1) return plotW / 2;
    if (hasBars) return (i + 0.5) * bandW;
    return (i / (data.length - 1)) * plotW;
  };
  const y = (v: number) => plotH - (Math.max(0, v) / max) * plotH;

  const leadSeries = visibleSeries[0];
  let peakIdx = -1;
  if (hasAnyValue && leadSeries) {
    let best = 0;
    data.forEach((row, idx) => {
      const val = leadSeries.value(row);
      if (val > best) {
        best = val;
        peakIdx = idx;
      }
    });
  }

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const xTickIndices = selectNonOverlappingTicks(data.length, x, 78);
  const activeRow = hoverIdx != null ? data[hoverIdx] : null;
  const activeX = hoverIdx != null ? pad.left + x(hoverIdx) : 0;

  return (
    <div className="w-full px-3 pt-3 pb-4 sm:px-5">
      {/* Series Legend Pills + Peak Badge */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {series.map((s) => {
            const isHidden = Boolean(hiddenKeys[s.key]);
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => toggleSeries(s.key)}
                aria-pressed={!isHidden}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                  isHidden
                    ? "border-neutral-200 bg-neutral-50 text-neutral-400 opacity-70"
                    : "border-neutral-200 bg-white text-neutral-700 shadow-2xs hover:border-neutral-300"
                )}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: isHidden ? "#cbd5e1" : s.color }}
                  aria-hidden
                />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {peakIdx !== -1 && leadSeries && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-50 px-2.5 py-1 text-[11px] font-semibold text-secondary-700 border border-secondary-200/70">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary-600" />
            Peak: {chartBucketLabel(data[peakIdx].bucket, bucket)} (
            {format(leadSeries.value(data[peakIdx]))})
          </span>
        )}
      </div>

      <div className="relative w-full overflow-x-auto scrollbar-thin">
        <div className="relative min-w-[540px]">
          {activeRow && (
            <div
              className="pointer-events-none absolute top-1 z-20 -translate-x-1/2 rounded-xl border border-slate-700/80 bg-[#1e293b]/95 px-3.5 py-2.5 text-xs text-white shadow-xl"
              style={{
                left: `${Math.min(86, Math.max(14, (activeX / width) * 100))}%`,
              }}
            >
              <p className="mb-1.5 border-b border-slate-700/70 pb-1 font-semibold text-slate-300">
                {chartBucketLabel(activeRow.bucket, bucket)}
              </p>
              <div className="space-y-1">
                {visibleSeries.map((s) => (
                  <div
                    key={s.key}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="inline-flex items-center gap-1.5 text-slate-300">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.label}
                    </span>
                    <span className="font-bold tabular-nums text-white">
                      {format(s.value(activeRow))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-auto w-full select-none"
            role="img"
            aria-label="Trend chart"
            onMouseLeave={() => setHoverIdx(null)}
          >
            <defs>
              {lineSeries.map((s, idx) => (
                <linearGradient
                  key={s.key}
                  id={`area-${uid}-${idx}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.01} />
                </linearGradient>
              ))}
              {barSeries.map((s, idx) => (
                <linearGradient
                  key={s.key}
                  id={`bar-${uid}-${idx}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.92} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.58} />
                </linearGradient>
              ))}
            </defs>

            <g transform={`translate(${pad.left},${pad.top})`}>
              {/* Horizontal grid lines & Y-axis labels */}
              {ticks.map((t, i) => (
                <g key={i}>
                  <line
                    x1={0}
                    x2={plotW}
                    y1={y(t)}
                    y2={y(t)}
                    stroke={i === 0 ? "#cbd5e1" : "#f1f5f9"}
                    strokeWidth={1}
                    strokeDasharray={i === 0 ? undefined : "3 4"}
                  />
                  <text
                    x={-12}
                    y={y(t) + 4}
                    textAnchor="end"
                    className="fill-neutral-400 font-medium"
                    style={{ fontSize: 10.5 }}
                  >
                    {formatAxisTick(t, sampleFormatted)}
                  </text>
                </g>
              ))}

              {/* Bars */}
              {barSeries.map((s, si) => (
                <g key={s.key}>
                  {data.map((row, i) => {
                    const v = s.value(row);
                    const w = Math.max(
                      4,
                      Math.min(28, (bandW * 0.56) / barSeries.length)
                    );
                    const cx = x(i) - (barSeries.length * w) / 2 + si * w;
                    const barH = Math.max(0, plotH - y(v));
                    return (
                      <rect
                        key={row.bucket}
                        x={cx}
                        y={y(v)}
                        width={w}
                        height={barH}
                        rx={3.5}
                        fill={`url(#bar-${uid}-${si})`}
                        opacity={hoverIdx === null || hoverIdx === i ? 1 : 0.45}
                        className="transition-opacity duration-150"
                      />
                    );
                  })}
                </g>
              ))}

              {/* Smooth spline lines & primary area fill */}
              {lineSeries.map((s, idx) => {
                const pts = data.map((row, i) => ({
                  x: x(i),
                  y: y(s.value(row)),
                }));
                const spline = getSplinePath(pts);
                const area =
                  pts.length > 1
                    ? `${spline} L ${pts[pts.length - 1].x.toFixed(1)} ${plotH} L ${pts[0].x.toFixed(1)} ${plotH} Z`
                    : "";

                return (
                  <g key={s.key}>
                    {idx === 0 && area && hasAnyValue && (
                      <path d={area} fill={`url(#area-${uid}-${idx})`} />
                    )}
                    <path
                      d={spline}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={2.6}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {pts.map((pt, i) => {
                      const isActive = hoverIdx === i;
                      const isPeak = idx === 0 && peakIdx === i;
                      if (!isActive && !isPeak && data.length > 18) return null;
                      return (
                        <circle
                          key={data[i].bucket}
                          cx={pt.x}
                          cy={pt.y}
                          r={isActive ? 5.5 : isPeak ? 4 : 2.8}
                          fill={isActive || isPeak ? s.color : "#ffffff"}
                          stroke={isActive || isPeak ? "#ffffff" : s.color}
                          strokeWidth={2}
                        />
                      );
                    })}
                  </g>
                );
              })}

              {/* Vertical crosshair */}
              {hoverIdx != null && (
                <line
                  x1={x(hoverIdx)}
                  x2={x(hoverIdx)}
                  y1={0}
                  y2={plotH}
                  stroke="#64748b"
                  strokeWidth={1.2}
                  strokeDasharray="3 3"
                />
              )}

              {/* Collision-free X-axis ticks */}
              {xTickIndices.map((i) => {
                const isHover = hoverIdx === i;
                return (
                  <g key={data[i].bucket}>
                    <line
                      x1={x(i)}
                      x2={x(i)}
                      y1={plotH}
                      y2={plotH + 4}
                      stroke="#cbd5e1"
                      strokeWidth={1}
                    />
                    <text
                      x={x(i)}
                      y={plotH + 20}
                      textAnchor="middle"
                      className={
                        isHover
                          ? "fill-secondary-700 font-bold"
                          : "fill-neutral-500 font-medium"
                      }
                      style={{ fontSize: 10.5 }}
                    >
                      {chartBucketLabel(data[i].bucket, bucket)}
                    </text>
                  </g>
                );
              })}

              {/* Clamped hover zones inside [0, plotW] */}
              {data.map((row, i) => {
                let left = 0;
                let right = plotW;
                if (hasBars) {
                  left = i * bandW;
                  right = (i + 1) * bandW;
                } else if (data.length > 1) {
                  const step = plotW / (data.length - 1);
                  left = i === 0 ? 0 : x(i) - step / 2;
                  right = i === data.length - 1 ? plotW : x(i) + step / 2;
                }
                return (
                  <rect
                    key={`hover-${row.bucket}`}
                    x={left}
                    y={0}
                    width={Math.max(1, right - left)}
                    height={plotH}
                    fill="transparent"
                    className="cursor-crosshair"
                    onMouseEnter={() => setHoverIdx(i)}
                  />
                );
              })}
            </g>
          </svg>
        </div>
      </div>

      {!hasAnyValue && (
        <p className="mt-1 text-center text-xs text-neutral-400">
          All values in this date window are 0.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ DonutChart */

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  color?: string;
}

/**
 * Interactive SVG Donut Chart with hover segment highlighting and aligned legend.
 */
export function DonutChart({
  slices,
  format = (n) => String(n),
  centerLabel = "Total",
  empty = "No breakdown data in this period.",
}: {
  slices: DonutSlice[];
  format?: (n: number) => string;
  centerLabel?: string;
  empty?: string;
}) {
  const [hoverKey, setHoverKey] = React.useState<string | null>(null);

  const nonZero = React.useMemo(
    () => slices.filter((s) => s.value > 0),
    [slices]
  );
  const total = React.useMemo(
    () => nonZero.reduce((sum, s) => sum + s.value, 0),
    [nonZero]
  );

  const size = 190;
  const cx = size / 2;
  const cy = size / 2;
  const r = 68;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * r;

  const segments = React.useMemo(() => {
    if (nonZero.length === 0 || total <= 0) return [];

    const topSlices = nonZero.slice(0, 6);
    const rest = nonZero.slice(6);
    const displaySlices: DonutSlice[] =
      rest.length > 0
        ? [
          ...topSlices,
          {
            key: "__other__",
            label: `Other (${rest.length})`,
            value: rest.reduce((s, item) => s + item.value, 0),
            color: CHART_COLORS.slate,
          },
        ]
        : topSlices;

    const { items } = displaySlices.reduce<{
      offset: number;
      items: Array<
        DonutSlice & {
          color: string;
          pct: number;
          dashArray: string;
          dashOffset: number;
        }
      >;
    }>(
      (acc, slice, idx) => {
        const pct = slice.value / total;
        const dashLen = pct * circumference;
        const gap =
          displaySlices.length > 1 ? Math.min(3, dashLen * 0.15) : 0;
        const nextItem = {
          ...slice,
          color: slice.color ?? CHART_PALETTE[idx % CHART_PALETTE.length],
          pct: Math.round(pct * 1000) / 10,
          dashArray: `${Math.max(1, dashLen - gap)} ${circumference}`,
          dashOffset: -acc.offset,
        };
        return {
          offset: acc.offset + dashLen,
          items: [...acc.items, nextItem],
        };
      },
      { offset: 0, items: [] }
    );
    return items;
  }, [nonZero, total, circumference]);

  if (segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
        <p className="text-sm font-medium text-neutral-600">{empty}</p>
      </div>
    );
  }

  const active = segments.find((s) => s.key === hoverKey) ?? null;

  return (
    <div className="grid grid-cols-1 items-center gap-5 p-4 sm:grid-cols-[200px_1fr] sm:p-5">
      <div className="relative mx-auto flex h-[190px] w-[190px] items-center justify-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="h-full w-full -rotate-90"
          role="img"
          aria-label="Distribution chart"
        >
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {segments.map((seg) => {
            const isHovered = hoverKey === seg.key;
            return (
              <circle
                key={seg.key}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={seg.dashArray}
                strokeDashoffset={seg.dashOffset}
                className="cursor-pointer transition-all duration-150"
                opacity={hoverKey && !isHovered ? 0.45 : 1}
                onMouseEnter={() => setHoverKey(seg.key)}
                onMouseLeave={() => setHoverKey(null)}
              />
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <span className="max-w-full truncate text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">
            {active ? active.label : centerLabel}
          </span>
          <span className="mt-0.5 text-base font-bold tracking-tight text-neutral-900 tabular-nums">
            {active ? format(active.value) : format(total)}
          </span>
          {active && (
            <span className="text-[11px] font-semibold text-secondary-700">
              {active.pct}%
            </span>
          )}
        </div>
      </div>

      <div className="min-w-0 space-y-2">
        {segments.map((seg) => {
          const isHovered = hoverKey === seg.key;
          return (
            <div
              key={seg.key}
              onMouseEnter={() => setHoverKey(seg.key)}
              onMouseLeave={() => setHoverKey(null)}
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl px-2.5 py-1.5 text-xs transition-colors cursor-default",
                isHovered ? "bg-neutral-100" : "hover:bg-neutral-50"
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="truncate font-medium text-neutral-800">
                  {seg.label}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2.5 tabular-nums">
                <span className="font-semibold text-neutral-900">
                  {format(seg.value)}
                </span>
                <span className="w-11 text-right text-neutral-500">
                  {seg.pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ HorizontalBarChart */

export interface BarItem {
  key: string;
  label: string;
  sublabel?: string;
  value: number;
  color?: string;
}

export function HorizontalBarChart({
  items,
  format = (n) => String(n),
  maxItems = 8,
  color = CHART_COLORS.primary,
  empty = "No ranked items in this period.",
}: {
  items: BarItem[];
  format?: (n: number) => string;
  maxItems?: number;
  color?: string;
  empty?: string;
}) {
  const visible = React.useMemo(
    () => items.filter((i) => i.value > 0).slice(0, maxItems),
    [items, maxItems]
  );

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
        <p className="text-sm font-medium text-neutral-600">{empty}</p>
      </div>
    );
  }

  const maxVal = Math.max(...visible.map((i) => i.value), 1);

  return (
    <div className="space-y-3 p-4 sm:p-5">
      {visible.map((item, idx) => {
        const pct = Math.max(2, Math.round((item.value / maxVal) * 100));
        const fill = item.color ?? color;
        return (
          <div key={item.key} className="group space-y-1">
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <div className="min-w-0 truncate">
                <span className="mr-1.5 font-semibold text-neutral-400 tabular-nums">
                  {idx + 1}.
                </span>
                <span className="font-medium text-neutral-800 group-hover:text-neutral-950">
                  {item.label}
                </span>
                {item.sublabel && (
                  <span className="ml-1.5 text-[11px] text-neutral-400">
                    ({item.sublabel})
                  </span>
                )}
              </div>
              <span className="shrink-0 font-bold text-neutral-900 tabular-nums">
                {format(item.value)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full transition-all duration-300 group-hover:opacity-90"
                style={{
                  width: `${pct}%`,
                  backgroundColor: fill,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

