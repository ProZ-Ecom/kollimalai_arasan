"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle, ArrowUpRight } from "lucide-react";
import type { DashboardLowStockItem } from "@/features/dashboard/api/get-stats";

interface LowStockAlertsProps {
  items: DashboardLowStockItem[];
}

export function LowStockAlerts({ items }: LowStockAlertsProps) {
  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-[var(--color-neutral-200)] bg-white p-5 shadow-xs">
      <div>
        <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900">
                Low Stock Alerts
              </h3>
              <p className="text-xs text-neutral-500">Items at or below reorder threshold</p>
            </div>
          </div>
          <Link
            href="/admin/dashboard/inventory"
            className="inline-flex items-center text-xs font-semibold text-secondary-700 hover:text-secondary-800 hover:underline gap-0.5"
          >
            Inventory
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-50 text-secondary-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-semibold text-neutral-900">
              All inventory levels are healthy!
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              No products are currently running below their reorder threshold.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const isOutOfStock = item.stock === 0;
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl p-2.5 border border-neutral-100 bg-neutral-50/40 hover:bg-neutral-50 transition-colors"
                >
                  <span
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                      isOutOfStock
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      SKU: <span className="font-mono text-neutral-700">{item.sku}</span> &middot; Reorder at {item.reorderLevel}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${
                        isOutOfStock
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {isOutOfStock ? "Out of Stock" : `${item.stock} left`}
                    </span>
                    <div className="mt-0.5">
                      <Link
                        href="/admin/dashboard/inventory"
                        className="text-[11px] font-semibold text-secondary-700 hover:underline"
                      >
                        Restock
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-100 text-xs text-neutral-400 flex items-center justify-between">
        <span>Threshold: Stock &le; Reorder Level</span>
        <Link
          href="/admin/dashboard/inventory"
          className="text-secondary-700 font-medium hover:underline"
        >
          Manage Stock &rarr;
        </Link>
      </div>
    </div>
  );
}

// Backward compatibility export
export type DummyLowStockItem = DashboardLowStockItem;

