"use client";

interface SalesChartProps {
  data: { label: string; value: number }[];
}

function SalesChart({ data }: SalesChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="h-full min-h-72 rounded-2xl border border-[var(--color-neutral-200)] bg-white p-5">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--color-neutral-900)]">
            Sales Overview
          </h3>
          <p className="text-sm text-[var(--color-neutral-500)]">Last 7 days revenue</p>
        </div>
      </div>

      <div className="flex h-48 items-end justify-between gap-3">
        {data.map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-40 w-full items-end">
              <div
                className="w-full rounded-t-lg bg-[var(--color-primary-500)] transition-all"
                style={{ height: `${Math.max((item.value / max) * 100, 4)}%` }}
              />
            </div>
            <span className="text-xs font-medium text-[var(--color-neutral-500)]">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { SalesChart };
