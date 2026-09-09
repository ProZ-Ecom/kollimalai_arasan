"use client";

import { formatPrice } from "@/lib/utils";

interface DummyProduct {
  id: string;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
}

interface TopProductsProps {
  products: DummyProduct[];
}

function TopProducts({ products }: TopProductsProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-neutral-200)] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--color-neutral-900)]">
          Top Selling Products
        </h3>
        <span className="text-xs font-medium text-[var(--color-neutral-400)]">Sample data</span>
      </div>

      <ul className="space-y-3">
        {products.map((product, index) => (
          <li key={product.id} className="flex items-center gap-3">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-50)] text-sm font-semibold text-[var(--color-primary-700)]">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--color-neutral-900)]">
                {product.name}
              </p>
              <p className="text-xs text-[var(--color-neutral-500)]">
                {product.category} &middot; {product.unitsSold} sold
              </p>
            </div>
            <span className="flex-shrink-0 text-sm font-semibold text-[var(--color-neutral-900)]">
              {formatPrice(product.revenue)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { TopProducts };
export type { DummyProduct };
