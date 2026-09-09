"use client";

import { AlertTriangle } from "lucide-react";

interface DummyLowStockItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  reorderLevel: number;
}

interface LowStockAlertsProps {
  items: DummyLowStockItem[];
}

function LowStockAlerts({ items }: LowStockAlertsProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-neutral-200)] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--color-neutral-900)]">
          Low Stock Alerts
        </h3>
        <span className="text-xs font-medium text-[var(--color-neutral-400)]">Sample data</span>
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-error-50)]">
              <AlertTriangle className="h-4 w-4 text-[var(--color-error-600)]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--color-neutral-900)]">
                {item.name}
              </p>
              <p className="text-xs text-[var(--color-neutral-500)]">SKU: {item.sku}</p>
            </div>
            <span className="flex-shrink-0 text-sm font-semibold text-[var(--color-error-700)]">
              {item.stock} left
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { LowStockAlerts };
export type { DummyLowStockItem };
