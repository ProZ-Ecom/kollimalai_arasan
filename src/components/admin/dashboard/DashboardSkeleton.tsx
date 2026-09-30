"use client";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-lg bg-neutral-200" />
          <div className="h-4 w-96 rounded-md bg-neutral-100" />
        </div>
        <div className="h-10 w-80 rounded-xl bg-neutral-200" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-36 rounded-2xl border border-neutral-200 bg-white p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 rounded bg-neutral-200" />
              <div className="h-9 w-9 rounded-xl bg-neutral-100" />
            </div>
            <div className="h-7 w-32 rounded bg-neutral-200" />
            <div className="h-3 w-40 rounded bg-neutral-100" />
          </div>
        ))}
      </div>

      {/* Sales Chart & Profit Loss Skeleton */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 h-96 rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
          <div className="h-6 w-48 rounded bg-neutral-200" />
          <div className="h-64 rounded-xl bg-neutral-100" />
        </div>
        <div className="h-96 rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
          <div className="h-6 w-40 rounded bg-neutral-200" />
          <div className="h-28 rounded-xl bg-neutral-100" />
          <div className="space-y-2">
            <div className="h-4 rounded bg-neutral-100" />
            <div className="h-4 rounded bg-neutral-100" />
            <div className="h-4 rounded bg-neutral-100" />
          </div>
        </div>
      </div>

      {/* Pipeline Skeleton */}
      <div className="h-40 rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
        <div className="h-5 w-44 rounded bg-neutral-200" />
        <div className="h-3 w-full rounded-full bg-neutral-100" />
        <div className="grid grid-cols-5 gap-3 pt-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-neutral-100" />
          ))}
        </div>
      </div>

      {/* Recent Orders & Top Products Skeleton */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 h-80 rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
          <div className="h-5 w-36 rounded bg-neutral-200" />
          <div className="space-y-2 pt-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-neutral-100" />
            ))}
          </div>
        </div>
        <div className="h-80 rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
          <div className="h-5 w-40 rounded bg-neutral-200" />
          <div className="space-y-2 pt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-neutral-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
