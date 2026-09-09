"use client";

import { useState, useMemo } from "react";
import type {
  StaffDeliveryListItem,
  StaffDeliveriesCountResponse,
} from "../types/delivery.types";

interface DeliveryStatsCardsProps {
  items?: StaffDeliveryListItem[];
  totalCount?: number;
  countData?: StaffDeliveriesCountResponse;
  isLoading?: boolean;
  scope?: "allTime" | "today";
  onScopeChange?: (scope: "allTime" | "today") => void;
}

export function DeliveryStatsCards({
  items = [],
  totalCount,
  countData,
  isLoading = false,
  scope: controlledScope,
  onScopeChange,
}: DeliveryStatsCardsProps) {
  const [internalScope, setInternalScope] = useState<"allTime" | "today">("today");
  const currentScope = controlledScope !== undefined ? controlledScope : internalScope;

  const handleScopeChange = (newScope: "allTime" | "today") => {
    if (onScopeChange) {
      onScopeChange(newScope);
    } else {
      setInternalScope(newScope);
    }
  };

  const stats = useMemo(() => {
    if (countData) {
      const activeCounts = currentScope === "today" ? countData.today : countData.allTime;
      return {
        total: activeCounts.total,
        pendingAcceptance: activeCounts.pending + (activeCounts.picked_up || 0),
        outForDelivery: activeCounts.out_for_delivery,
        delivered: activeCounts.delivered,
      };
    }

    const total = totalCount ?? items.length;
    const pendingAcceptance = items.filter(
      (item) =>
        item.assignmentStatus === "pending" ||
        item.status === "pending"
    ).length;
    const outForDelivery = items.filter(
      (item) => item.status === "out_for_delivery"
    ).length;
    const delivered = items.filter(
      (item) => item.status === "delivered"
    ).length;

    return {
      total,
      pendingAcceptance,
      outForDelivery,
      delivered,
    };
  }, [items, totalCount, countData, currentScope]);

  const cards = [
    {
      label: "Total Assigned",
      value: isLoading ? "—" : String(stats.total),
      note: currentScope === "today" ? "Assigned today" : "All assigned orders",
      noteColor: "text-neutral-500",
      accentBorder: "border-l-secondary-500",
    },
    {
      label: "To Accept",
      value: isLoading ? "—" : String(stats.pendingAcceptance),
      note: "Awaiting action",
      noteColor: "text-amber-700 font-semibold",
      accentBorder: "border-l-amber-500",
    },
    {
      label: "Out For Delivery",
      value: isLoading ? "—" : String(stats.outForDelivery),
      note: "In progress",
      noteColor: "text-blue-700 font-semibold",
      accentBorder: "border-l-blue-500",
    },
    {
      label: "Delivered",
      value: isLoading ? "—" : String(stats.delivered),
      note: currentScope === "today" ? "Completed today" : "Successfully delivered",
      noteColor: "text-emerald-700 font-semibold",
      accentBorder: "border-l-emerald-600",
    },
  ];

  return (
    <div className="space-y-2">
      {countData && (
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-400">
            Delivery Performance
          </span>
          <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 text-xs">
            <button
              type="button"
              onClick={() => handleScopeChange("today")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                currentScope === "today"
                  ? "bg-white text-secondary-700 shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              Today ({countData.today.total})
            </button>
            <button
              type="button"
              onClick={() => handleScopeChange("allTime")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                currentScope === "allTime"
                  ? "bg-white text-secondary-700 shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              All Time ({countData.allTime.total})
            </button>
          </div>
        </div>
      )}

      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`flex flex-col gap-1 rounded-xl border border-cream-border bg-white p-3 shadow-xs transition-shadow hover:shadow-sm border-l-[3px] ${card.accentBorder}`}
          >
            <div className="text-[10.5px] font-bold tracking-wider text-neutral-400 uppercase">
              {card.label}
            </div>
            <div className="text-xl font-bold tracking-tight text-neutral-900">
              {card.value}
            </div>
            <div className={`text-[11px] font-medium ${card.noteColor}`}>
              {card.note}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
