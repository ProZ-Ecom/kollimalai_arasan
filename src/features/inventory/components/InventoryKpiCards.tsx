"use client";

import {
  Boxes,
  PackageCheck,
  Clock,
  AlertTriangle,
  AlertOctagon,
} from "lucide-react";
import type { InventoryStats } from "../types";

interface InventoryKpiCardsProps {
  stats?: InventoryStats;
  isLoading?: boolean;
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
}

export function InventoryKpiCards({
  stats,
  isLoading,
  activeFilter,
  onFilterChange,
}: InventoryKpiCardsProps) {
  const cards = [
    {
      id: "all",
      label: "Total Products / SKUs",
      value: stats?.totalSkus ?? 0,
      subtext: "Tracked inventory items",
      icon: Boxes,
      color: "text-secondary-600 bg-secondary-50 border-secondary-200",
      activeRing: "ring-2 ring-secondary-500",
    },
    {
      id: "in_stock",
      label: "Available Stock",
      value: stats?.totalUnits ?? 0,
      subtext: "Units ready for dispatch",
      icon: PackageCheck,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      activeRing: "ring-2 ring-emerald-500",
    },
    {
      id: "reserved",
      label: "Reserved Stock",
      value: stats?.reservedUnits ?? 0,
      subtext: "Allocated in pending orders",
      icon: Clock,
      color: "text-blue-700 bg-blue-50 border-blue-200",
      activeRing: "ring-2 ring-blue-500",
    },
    {
      id: "low_stock",
      label: "Low Stock Alert",
      value: stats?.lowStockCount ?? 0,
      subtext: "At or below reorder level",
      icon: AlertTriangle,
      color: "text-amber-700 bg-amber-50 border-amber-200",
      activeRing: "ring-2 ring-amber-500",
      isWarning: (stats?.lowStockCount ?? 0) > 0,
    },
    {
      id: "out_of_stock",
      label: "Out of Stock",
      value: stats?.outOfStockCount ?? 0,
      subtext: "Immediate restock required",
      icon: AlertOctagon,
      color: "text-rose-700 bg-rose-50 border-rose-200",
      activeRing: "ring-2 ring-rose-500",
      isCritical: (stats?.outOfStockCount ?? 0) > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onFilterChange?.(card.id)}
            className={`text-left rounded-2xl bg-white border border-cream-border p-4 sm:p-5 transition-all duration-200 cursor-pointer shadow-xs hover:border-secondary-400 hover:shadow-sm ${
              isActive ? card.activeRing : ""
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] sm:text-xs font-semibold text-neutral-500 tracking-tight line-clamp-1">
                {card.label}
              </span>
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center shrink-0 ${card.color}`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xl sm:text-2xl font-bold font-mono text-neutral-900 tracking-tight">
                {isLoading ? (
                  <span className="inline-block w-12 h-6 bg-cream-200 animate-pulse rounded" />
                ) : (
                  card.value.toLocaleString("en-IN")
                )}
              </div>
              <p className="text-[11px] text-neutral-400 font-medium truncate">
                {card.subtext}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
