"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatsCardColor =
  | "mint"
  | "violet"
  | "cyan"
  | "fuchsia"
  | "amber"
  | "rose"
  | "emerald"
  | "default";

interface StatsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  iconColor?: StatsCardColor;
  footer?: ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const COLOR_CLASSES: Record<StatsCardColor, { bg: string; text: string }> = {
  mint: { bg: "bg-[#EAFBF3]", text: "text-[#0DA665]" },
  violet: { bg: "bg-[#F1EDFE]", text: "text-[#7048E8]" },
  cyan: { bg: "bg-[#E6F8F8]", text: "text-[#0C9898]" },
  fuchsia: { bg: "bg-[#FDF0FD]", text: "text-[#A627BD]" },
  amber: { bg: "bg-[#FFF6E5]", text: "text-[#D97706]" },
  rose: { bg: "bg-[#FDECEC]", text: "text-[#E03131]" },
  emerald: { bg: "bg-[#EAFBF3]", text: "text-[#0DA665]" },
  default: { bg: "bg-neutral-100", text: "text-neutral-600" },
};

function StatsCard({
  title,
  value,
  unit,
  icon: Icon,
  iconColor = "default",
  footer,
  description,
  trend,
  className,
}: StatsCardProps) {
  const colorStyle = COLOR_CLASSES[iconColor] || COLOR_CLASSES.default;

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-2xs hover:shadow-xs transition-all",
        className
      )}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          {title}
        </p>

        {Icon && (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-2xl transition-transform",
              colorStyle.bg,
              colorStyle.text
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Value & Unit Row */}
      <div className="mt-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-black tracking-tight text-neutral-900">
            {value}
          </span>
          {unit && (
            <span className="text-sm font-semibold text-neutral-500">
              {unit}
            </span>
          )}
        </div>

        {/* Footer Area */}
        {footer ? (
          <div className="mt-3.5 flex items-center text-xs font-medium">
            {footer}
          </div>
        ) : (
          (description || trend) && (
            <div className="mt-3.5 flex items-center gap-2 text-xs font-medium">
              {description && (
                <span className="text-neutral-500">{description}</span>
              )}

              {trend && (
                <span
                  className={cn(
                    "inline-flex items-center text-xs font-semibold",
                    trend.isPositive ? "text-emerald-600" : "text-rose-600"
                  )}
                >
                  {trend.isPositive ? (
                    <TrendingUp className="mr-1 h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="mr-1 h-3.5 w-3.5" />
                  )}
                  {trend.value}%
                </span>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export { StatsCard };
export type { StatsCardProps };
