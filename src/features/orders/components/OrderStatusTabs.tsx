"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAdminOrdersCount } from "@/features/orders/hooks";
import type { AdminOrdersCountResponse } from "@/features/orders/types";

interface StatusTab {
  label: string;
  href: string;
  countKey?: keyof AdminOrdersCountResponse;
  dot?: string;
}

const TABS: StatusTab[] = [
  { label: "All", href: "/admin/dashboard/orders", countKey: "total", dot: "bg-neutral-400" },
  { label: "Pending", href: "/admin/dashboard/orders/pending", countKey: "pending", dot: "bg-amber-500" },
  { label: "Confirmed", href: "/admin/dashboard/orders/confirmed", countKey: "confirmed", dot: "bg-secondary-600" },
  { label: "Processing", href: "/admin/dashboard/orders/processing", countKey: "processing", dot: "bg-blue-500" },
  { label: "Packed", href: "/admin/dashboard/orders/packed", countKey: "packed", dot: "bg-purple-500" },
  { label: "Shipped", href: "/admin/dashboard/orders/shipped", countKey: "shipped", dot: "bg-indigo-500" },
  { label: "Out for Delivery", href: "/admin/dashboard/orders/out-for-delivery", countKey: "out_for_delivery", dot: "bg-cyan-500" },
  { label: "Delivered", href: "/admin/dashboard/orders/delivered", countKey: "delivered", dot: "bg-success-600" },
  { label: "Cancelled", href: "/admin/dashboard/orders/cancelled", countKey: "cancelled", dot: "bg-error-500" },
  { label: "Returned", href: "/admin/dashboard/orders/returned", countKey: "returned", dot: "bg-neutral-500" },
];

export function OrderStatusTabs() {
  const pathname = usePathname();
  const { data: counts, isLoading } = useAdminOrdersCount();

  return (
    <div className="relative">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 pr-8">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/admin/dashboard/orders"
              ? pathname === "/admin/dashboard/orders"
              : pathname === tab.href || pathname.startsWith(tab.href + "/");

          const count = tab.countKey && counts ? counts[tab.countKey] : undefined;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                isActive
                  ? "border-secondary-700 bg-gradient-to-b from-secondary-500 to-secondary-700 text-cream-white shadow-sm shadow-secondary-700/25"
                  : "border-cream-border-subtle bg-white text-neutral-600 shadow-xs hover:-translate-y-px hover:border-secondary-200 hover:bg-secondary-50 hover:text-secondary-800 hover:shadow-sm"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                  isActive ? "bg-white/70" : tab.dot
                )}
              />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none tabular-nums transition-colors",
                  isLoading
                    ? "animate-pulse bg-neutral-100 text-transparent"
                    : isActive
                    ? "bg-white/20 text-white"
                    : count && count > 0
                    ? tab.countKey === "pending"
                      ? "bg-orange-100 text-orange-800 ring-1 ring-orange-200"
                      : "bg-neutral-100 text-neutral-700 group-hover:bg-white"
                    : "bg-neutral-100 text-neutral-400"
                )}
              >
                {isLoading ? "0" : count ?? 0}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Fade hint so it reads as horizontally scrollable */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[var(--admin-canvas)] to-transparent" />
    </div>
  );
}
