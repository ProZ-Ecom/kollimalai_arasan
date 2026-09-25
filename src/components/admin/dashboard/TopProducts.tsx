"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Package, ArrowUpRight, Flame } from "lucide-react";
import type { DashboardTopProduct } from "@/features/dashboard/api/get-stats";

interface TopProductsProps {
  products: DashboardTopProduct[];
}

export function TopProducts({ products }: TopProductsProps) {
  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return "bg-primary-100 text-primary-900 border border-primary-300 shadow-2xs";
      case 1:
        return "bg-neutral-200 text-neutral-800 border border-neutral-300";
      case 2:
        return "bg-amber-100 text-amber-900 border border-amber-300";
      default:
        return "bg-neutral-100 text-neutral-600 border border-neutral-200";
    }
  };

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-[var(--color-neutral-200)] bg-white p-5 shadow-xs">
      <div>
        <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900">
                Top Selling Products
              </h3>
              <p className="text-xs text-neutral-500">Bestsellers by order volume</p>
            </div>
          </div>
          <Link
            href="/admin/dashboard/products"
            className="inline-flex items-center text-xs font-semibold text-secondary-700 hover:text-secondary-800 hover:underline gap-0.5"
          >
            All products
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center">
            <Package className="h-8 w-8 text-neutral-300" />
            <p className="mt-2 text-sm font-medium text-neutral-600">No sales recorded yet</p>
            <p className="text-xs text-neutral-400">
              Top selling snacks will rank here automatically.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {products.map((product, index) => (
              <li
                key={product.id}
                className="flex items-center gap-3 rounded-xl p-2 hover:bg-neutral-50/70 transition-colors"
              >
                <span
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${getRankBadge(
                    index
                  )}`}
                >
                  #{index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-900">
                    {product.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    <span className="font-medium text-secondary-700">{product.unitsSold}</span> units sold
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-bold text-neutral-900">
                    {formatPrice(product.revenue)}
                  </span>
                  <p className="text-[10px] text-neutral-400">Revenue</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-100 text-xs text-neutral-400 flex items-center justify-between">
        <span>Ranked by real units sold</span>
        <Link
          href="/admin/dashboard/reports/products"
          className="text-secondary-700 font-medium hover:underline"
        >
          Product Analytics &rarr;
        </Link>
      </div>
    </div>
  );
}

// Backward compatibility export
export type DummyProduct = DashboardTopProduct;

