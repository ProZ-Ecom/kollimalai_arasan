"use client";

import { ShoppingBag, Clock, Package, IndianRupee } from "lucide-react";
import { useDashboardStats } from "@/features/dashboard/hooks";
import { useAdminOrdersCount } from "@/features/orders/hooks";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function OrderStatsCards() {
  const { data: stats, isLoading: isStatsLoading } = useDashboardStats();
  const { data: orderCounts, isLoading: isCountsLoading } = useAdminOrdersCount();

  const todayOrders = stats?.todayOrders ?? 0;
  const pendingOrders = orderCounts?.pending ?? stats?.pendingOrders ?? 0;
  const totalOrders = orderCounts?.total ?? stats?.totalOrders ?? 0;
  const totalRevenue = stats?.totalRevenue ?? 0;

  const cards = [
    {
      label: "TODAY'S ORDERS",
      value: String(todayOrders),
      loading: isStatsLoading,
      note: "Orders placed today",
      noteColor: "text-amber-700/80",
      surface:
        "bg-gradient-to-br from-amber-50 via-amber-50/40 to-white border-amber-200/70",
      accentBar: "from-amber-400 to-amber-600",
      valueClass: "text-amber-900",
      icon: ShoppingBag,
      iconClass: "bg-amber-500/12 text-amber-700 ring-amber-500/20",
      glow: "bg-amber-400/20",
    },
    {
      label: "AWAITING CONFIRMATION",
      value: String(pendingOrders),
      loading: isCountsLoading && isStatsLoading,
      note: pendingOrders > 0 ? "Needs action" : "All clear",
      noteColor:
        pendingOrders > 0 ? "text-orange-700 font-semibold" : "text-orange-700/70",
      surface:
        "bg-gradient-to-br from-orange-50 via-orange-50/40 to-white border-orange-200/70",
      accentBar: "from-orange-400 to-orange-600",
      valueClass: "text-orange-900",
      icon: Clock,
      iconClass: "bg-orange-500/12 text-orange-700 ring-orange-500/20",
      glow: "bg-orange-400/20",
      pulse: pendingOrders > 0,
    },
    {
      label: "TOTAL ORDERS",
      value: String(totalOrders),
      loading: isCountsLoading && isStatsLoading,
      note: "All-time total orders",
      noteColor: "text-secondary-700/80",
      surface:
        "bg-gradient-to-br from-secondary-50 via-secondary-50/40 to-white border-secondary-200/70",
      accentBar: "from-secondary-400 to-secondary-700",
      valueClass: "text-secondary-900",
      icon: Package,
      iconClass: "bg-secondary-600/12 text-secondary-700 ring-secondary-600/20",
      glow: "bg-secondary-500/20",
    },
    {
      label: "ORDER VALUE",
      value: formatPrice(totalRevenue),
      loading: isStatsLoading,
      note: "Total order revenue",
      noteColor: "text-brown-600/80",
      surface:
        "bg-gradient-to-br from-brown-50 via-brown-50/40 to-white border-brown-200/70",
      accentBar: "from-brown-400 to-brown-600",
      valueClass: "text-brown-700",
      icon: IndianRupee,
      iconClass: "bg-brown-600/12 text-brown-600 ring-brown-600/20",
      glow: "bg-brown-400/20",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={cn(
              "group relative flex items-start justify-between gap-2 overflow-hidden rounded-xl border p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 admin-surface-hover",
              card.surface
            )}
          >
            {/* Top accent bar - carries the card's colour without a hard left rule */}
            <span
              className={cn(
                "absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r",
                card.accentBar
              )}
            />
            {/* Soft corner glow, brightens on hover */}
            <span
              className={cn(
                "pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl transition-opacity duration-200 opacity-60 group-hover:opacity-100",
                card.glow
              )}
            />

            <div className="relative flex min-w-0 flex-col gap-1">
              <div className="truncate text-[10.5px] font-bold tracking-wider text-neutral-500 uppercase">
                {card.label}
              </div>
              {card.loading ? (
                <div className="h-8 w-16 animate-pulse rounded-md bg-white/70" />
              ) : (
                <div
                  className={cn(
                    "text-2xl font-extrabold tracking-tight tabular-nums",
                    card.valueClass
                  )}
                >
                  {card.value}
                </div>
              )}
              <div
                className={cn(
                  "flex items-center gap-1 text-[11px] font-medium",
                  card.noteColor
                )}
              >
                {card.pulse && !card.loading && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-600" />
                  </span>
                )}
                {card.note}
              </div>
            </div>

            <div
              className={cn(
                "relative grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1 transition-transform duration-200 group-hover:scale-110",
                card.iconClass
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
            </div>
          </div>
        );
      })}
    </section>
  );
}
