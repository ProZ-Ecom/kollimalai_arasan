"use client";

import { useState, useMemo, useRef } from "react";
import { formatPrice } from "@/lib/utils";
import { ArrowUp, ArrowDown, Sprout } from "lucide-react";
import type { DashboardSalesTrendPoint } from "@/features/dashboard/api/get-stats";

interface SalesChartProps {
  data: DashboardSalesTrendPoint[];
  periodLabel?: string;
  averageOrderValue: number;
  aovDifference?: number;
  realizationRate: number;
  returnRate: number;
  cancelledOrdersCount: number;
  topProductName?: string;
  totalOrdersCount: number;
}

function formatCompactPrice(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${Math.round(val / 1000)}k`;
  return `₹${Math.round(val)}`;
}

// Compute dynamic ceiling so real data scales to a natural visual height
function getNiceCeiling(maxVal: number): number {
  if (maxVal <= 0) return 100;
  if (maxVal <= 10) return 10;
  if (maxVal <= 50) return 50;
  if (maxVal <= 100) return 100;
  if (maxVal <= 200) return 200;
  if (maxVal <= 500) return 500;
  if (maxVal <= 1000) return 1000;
  if (maxVal <= 2500) return 2500;
  if (maxVal <= 5000) return 5000;
  if (maxVal <= 10000) return 10000;
  if (maxVal <= 25000) return 25000;
  if (maxVal <= 50000) return 50000;
  if (maxVal <= 100000) return 100000;

  const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const normalized = maxVal / magnitude;
  let niceMultiplier = 1;
  if (normalized <= 1) niceMultiplier = 1;
  else if (normalized <= 2) niceMultiplier = 2;
  else if (normalized <= 5) niceMultiplier = 5;
  else niceMultiplier = 10;
  return Math.ceil(niceMultiplier * magnitude);
}

// Smooth Catmull-Rom to Cubic Bezier SVG path generator
function getSplinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  const tension = 0.2;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return path;
}

export function SalesChart({
  data,
  periodLabel = "This Month",
  averageOrderValue,
  aovDifference,
  realizationRate,
  returnRate,
  cancelledOrdersCount,
  topProductName,
  totalOrdersCount,
}: SalesChartProps) {
  const [metric, setMetric] = useState<"revenue" | "orders">("revenue");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // SVG Dimension constants
  const svgWidth = 900;
  const svgHeight = 320;
  const paddingLeft = 56;
  const paddingRight = 36;
  const paddingTop = 36;
  const paddingBottom = 44;

  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;
  const plotBottom = svgHeight - paddingBottom;

  const chartPoints = useMemo(() => data || [], [data]);
  const values = chartPoints.map((d) => (metric === "revenue" ? d.revenue : d.orders));
  const rawMax = Math.max(...values, 0);

  // Dynamic ceiling strictly based on real data
  const maxValue = getNiceCeiling(rawMax);

  // Identify peak point from real database data (only if sales > 0)
  const peakIndex = useMemo(() => {
    if (values.length === 0 || rawMax <= 0) return -1;
    let maxIdx = -1;
    let currentHigh = 0;
    values.forEach((v, idx) => {
      if (v > currentHigh) {
        currentHigh = v;
        maxIdx = idx;
      }
    });
    return maxIdx;
  }, [values, rawMax]);

  // Generate exact pixel coordinates from real backend values
  const coordinates = useMemo(() => {
    if (chartPoints.length === 0) return [];
    const count = chartPoints.length;
    const xStep = plotWidth / Math.max(1, count - 1);

    return chartPoints.map((item, i) => {
      const val = metric === "revenue" ? item.revenue : item.orders;
      const x = paddingLeft + i * xStep;

      // Real proportion with 0 at baseline
      const normalized = maxValue > 0 ? Math.min(1, Math.max(0, val / maxValue)) : 0;
      const y = plotBottom - normalized * (plotHeight - 16);

      return { x, y, rawValue: val, item, index: i };
    });
  }, [chartPoints, metric, maxValue, plotWidth, plotHeight, plotBottom]);

  // Spline & Area paths
  const splinePath = useMemo(() => getSplinePath(coordinates), [coordinates]);
  const areaPath = useMemo(() => {
    if (coordinates.length === 0) return "";
    return `${splinePath} L ${coordinates[coordinates.length - 1].x.toFixed(1)} ${plotBottom} L ${coordinates[0].x.toFixed(1)} ${plotBottom} Z`;
  }, [splinePath, coordinates, plotBottom]);

  // Active point (Hovered, or real peak if active, or latest date)
  const defaultIndex = peakIndex !== -1 ? peakIndex : Math.max(0, coordinates.length - 1);
  const activeIndex = hoveredIndex !== null ? hoveredIndex : defaultIndex;
  const activePoint = coordinates[activeIndex] || coordinates[0];

  // Grid levels (4 levels strictly based on maxValue)
  const gridLevels = [
    { value: maxValue, y: paddingTop },
    { value: Math.round(maxValue * 0.75), y: paddingTop + plotHeight * 0.25 },
    { value: Math.round(maxValue * 0.5), y: paddingTop + plotHeight * 0.5 },
    { value: Math.round(maxValue * 0.25), y: paddingTop + plotHeight * 0.75 },
  ];

  // Track closest point on mouse movement
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || coordinates.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const scaleX = svgWidth / rect.width;
    const svgX = clientX * scaleX;

    let closestIdx = 0;
    let minDistance = Infinity;

    coordinates.forEach((pt, idx) => {
      const dist = Math.abs(pt.x - svgX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    setHoveredIndex(closestIdx);
  };

  // Formatted date string for active point
  const activeDateFormatted = useMemo(() => {
    if (!activePoint?.item) return "Today";
    const d = activePoint.item.date ? new Date(activePoint.item.date) : null;
    if (d && !isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }
    return activePoint.item.label || "Date";
  }, [activePoint]);

  return (
    <div
      ref={containerRef}
      className="relative flex h-full flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs"
    >
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900">
              Sales & Revenue Overview
            </h2>
            <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-medium text-slate-700">
              {periodLabel.includes("Cycle") ? periodLabel : `${periodLabel} Cycle`}
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Tracking customer demand and order dispatch trends from live store records
          </p>
        </div>

        {/* Segmented Toggle Pills */}
        <div className="flex rounded-full bg-slate-100 p-1 border border-slate-200/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetric("revenue")}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
              metric === "revenue"
                ? "bg-white text-emerald-950 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Revenue (₹)
          </button>
          <button
            type="button"
            onClick={() => setMetric("orders")}
            className={`rounded-full px-3.5 py-1 text-xs font-medium transition-all ${
              metric === "orders"
                ? "bg-white text-emerald-950 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Order Volume
          </button>
        </div>
      </div>

      {/* 2. Real Metrics Strip */}
      <div className="my-3 grid grid-cols-1 gap-4 rounded-xl border border-slate-100 bg-[#f8fafc] p-4 sm:grid-cols-3">
        {/* Metric 1: Average Order Value */}
        <div>
          <span className="text-xs text-slate-500 font-medium">Average Order Value</span>
          <div className="mt-0.5 text-2xl font-bold tracking-tight text-neutral-900">
            {formatPrice(averageOrderValue)}
          </div>
          {aovDifference !== undefined && aovDifference !== 0 ? (
            <div
              className={`mt-0.5 flex items-center text-xs font-semibold ${
                aovDifference > 0 ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {aovDifference > 0 ? (
                <ArrowUp className="mr-0.5 h-3.5 w-3.5" />
              ) : (
                <ArrowDown className="mr-0.5 h-3.5 w-3.5" />
              )}
              {aovDifference > 0 ? "+" : ""}
              {formatPrice(aovDifference)} vs prev period
            </div>
          ) : (
            <div className="mt-0.5 text-xs text-slate-500">
              Across {totalOrdersCount} placed orders
            </div>
          )}
        </div>

        {/* Metric 2: Realized Revenue Retention Margin */}
        <div>
          <span className="text-xs text-slate-500 font-medium">Realized Order Margin</span>
          <div className="mt-0.5 text-2xl font-bold tracking-tight text-neutral-900">
            {realizationRate}%
          </div>
          <div className="mt-0.5 flex items-center text-xs font-semibold text-emerald-700">
            <Sprout className="mr-1 h-3.5 w-3.5" />
            Net Realized Inflow
          </div>
        </div>

        {/* Metric 3: Return & Cancellation Rate */}
        <div>
          <span className="text-xs text-slate-500 font-medium">Return & Cancellation Rate</span>
          <div className="mt-0.5 text-2xl font-bold tracking-tight text-neutral-900">
            {returnRate}%
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            {cancelledOrdersCount} cancelled/returned orders
          </div>
        </div>
      </div>

      {/* 3. Spline SVG Chart Area */}
      <div className="relative mt-2 w-full select-none">
        {/* Floating Dark Callout Card for Active/Hovered Point */}
        {activePoint && (
          <div
            className="pointer-events-none absolute z-30 transition-all duration-150 ease-out"
            style={{
              left: `${(activePoint.x / svgWidth) * 100}%`,
              top: `${Math.max(2, (activePoint.y / svgHeight) * 100 - 8)}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="min-w-[210px] rounded-xl bg-[#1e293b] p-3 text-white shadow-2xl border border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-medium">{activeDateFormatted}</span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    activePoint.rawValue > 0 ? "bg-emerald-400 shadow-xs" : "bg-slate-500"
                  }`}
                />
              </div>
              <div className="mt-1 text-2xl font-bold tracking-tight text-white">
                {metric === "revenue"
                  ? formatPrice(activePoint.rawValue)
                  : `${activePoint.rawValue} Orders`}
              </div>
              <div className="mt-1 text-[11px] text-slate-300 truncate">
                {activePoint.item?.orders > 0 ? (
                  <>
                    {activePoint.item.orders} {activePoint.item.orders === 1 ? "Order" : "Orders"}
                    {topProductName ? ` • Top: ${topProductName}` : ""}
                  </>
                ) : (
                  "0 Orders • No sales on this date"
                )}
              </div>
            </div>
          </div>
        )}

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="h-72 w-full overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            {/* Smooth Warm Green Area Gradient */}
            <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#15803d" stopOpacity="0.28" />
              <stop offset="45%" stopColor="#fef3c7" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>

            {/* Multitone Stroke Gradient */}
            <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#166534" />
              <stop offset="68%" stopColor="#15803d" />
              <stop offset="84%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>
          </defs>

          {/* Dotted Horizontal Grid Lines & Y-Axis Labels */}
          {gridLevels.map((lvl, idx) => (
            <g key={idx}>
              <text
                x="8"
                y={lvl.y + 4}
                className="fill-slate-400 text-[11px] font-medium"
              >
                {metric === "revenue"
                  ? formatCompactPrice(lvl.value)
                  : Math.round(lvl.value)}
              </text>
              <line
                x1={paddingLeft}
                y1={lvl.y}
                x2={svgWidth - paddingRight}
                y2={lvl.y}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            </g>
          ))}

          {/* Bottom baseline line */}
          <line
            x1={paddingLeft}
            y1={plotBottom}
            x2={svgWidth - paddingRight}
            y2={plotBottom}
            stroke="#f1f5f9"
            strokeWidth="1"
          />

          {/* Area Fill */}
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#curveGradient)"
              className="transition-all duration-300"
            />
          )}

          {/* Spline Curve Stroke */}
          {splinePath && (
            <path
              d={splinePath}
              fill="none"
              stroke="url(#strokeGradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {/* Vertical Dashed Line for Active Point */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={activePoint.y}
              x2={activePoint.x}
              y2={plotBottom}
              stroke="#15803d"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              className="transition-all duration-150"
            />
          )}

          {/* Active Point Circle Indicator */}
          {activePoint && (
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="5.5"
              fill="#15803d"
              stroke="#ffffff"
              strokeWidth="2.5"
              className="transition-all duration-150 shadow-sm"
            />
          )}

          {/* X-Axis Labels with collision prevention */}
          {coordinates.map((pt, idx) => {
            const isPeak = peakIndex !== -1 && idx === peakIndex;
            const isActive = idx === activeIndex;

            // Spaced interval calculation (every 5-6 points)
            const total = coordinates.length;
            const interval = Math.max(4, Math.floor(total / 6));
            const isMilestone = idx % interval === 0 || idx === total - 1;

            // Don't render milestone if it collides within 1 step of peak
            if (isMilestone && peakIndex !== -1 && Math.abs(idx - peakIndex) <= 1 && idx !== peakIndex) {
              return null;
            }

            if (!isMilestone && !isPeak && !isActive) return null;

            return (
              <text
                key={idx}
                x={pt.x}
                y={svgHeight - 12}
                textAnchor="middle"
                className={`text-[11px] transition-colors cursor-pointer ${
                  isPeak || isActive
                    ? "fill-emerald-800 font-bold"
                    : "fill-slate-500 font-medium"
                }`}
                onClick={() => setHoveredIndex(idx)}
              >
                {isPeak ? `${pt.item.label} (Peak)` : pt.item.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
