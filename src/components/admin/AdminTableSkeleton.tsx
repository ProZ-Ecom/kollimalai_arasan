import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface AdminTableSkeletonProps {
  rows?: number;
  columns?: number;
  showStats?: boolean;
  bare?: boolean;
  className?: string;
}

const TITLE_WIDTHS = ["w-36", "w-44", "w-32", "w-48", "w-40", "w-36"];
const SUBTITLE_WIDTHS = ["w-20", "w-28", "w-24", "w-16", "w-24", "w-20"];
const BADGE_WIDTHS = ["w-16", "w-20", "w-18", "w-22", "w-16", "w-20"];

function TableGridSkeleton({
  rows = 7,
  columns = 6,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full flex-1 flex flex-col justify-between rounded-2xl overflow-hidden min-h-[380px] border border-neutral-200 bg-white shadow-xs",
        className
      )}
    >
      {/* Table Main Area */}
      <div className="flex-1 min-h-0 flex flex-col overflow-x-auto">
        {/* Kollimalai Brand Table Header */}
        <div className="h-13 px-4 sm:px-5 bg-secondary-600 border-b border-secondary-700 flex items-center gap-4 text-white shrink-0 min-w-[720px]">
          {/* Checkbox column */}
          <div className="w-8 flex items-center justify-center shrink-0">
            <div className="h-4 w-4 rounded border border-white/40 bg-white/20 modern-shimmer" />
          </div>

          {/* Table column titles */}
          <div className="flex-1 flex items-center gap-6">
            <div className="h-3.5 w-32 rounded-md bg-white/25 modern-shimmer" />
            <div className="h-3.5 w-24 rounded-md bg-white/25 modern-shimmer hidden md:block" />
            <div className="h-3.5 w-20 rounded-md bg-white/25 modern-shimmer hidden sm:block" />
            <div className="h-3.5 w-20 rounded-md bg-white/25 modern-shimmer hidden lg:block" />
            <div className="h-3.5 w-16 rounded-md bg-white/25 modern-shimmer hidden xl:block" />
            <div className="h-3.5 w-16 rounded-md bg-white/25 modern-shimmer" />
          </div>

          {/* Action column */}
          <div className="w-20 flex justify-center shrink-0">
            <div className="h-3.5 w-14 rounded-md bg-white/25 modern-shimmer" />
          </div>
        </div>

        {/* Realistic Table Rows */}
        <div className="divide-y divide-neutral-100 flex-1 min-w-[720px]">
          {Array.from({ length: rows }).map((_, rowIndex) => {
            const titleWidth = TITLE_WIDTHS[rowIndex % TITLE_WIDTHS.length];
            const subtitleWidth = SUBTITLE_WIDTHS[rowIndex % SUBTITLE_WIDTHS.length];
            const badgeWidth = BADGE_WIDTHS[rowIndex % BADGE_WIDTHS.length];

            return (
              <div
                key={rowIndex}
                className="flex items-center gap-4 px-4 py-3.5 sm:px-5 hover:bg-neutral-50/50 transition-colors"
              >
                {/* Row Checkbox */}
                <div className="w-8 flex items-center justify-center shrink-0">
                  <Skeleton className="h-4 w-4 rounded" />
                </div>

                {/* Primary Entity: Thumbnail + Title + Subtitle */}
                <div className="flex-1 min-w-[180px] flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className={cn("h-4 rounded", titleWidth)} />
                    <Skeleton className={cn("h-3 rounded opacity-70", subtitleWidth)} />
                  </div>
                </div>

                {/* Badge / Category Pill */}
                <div className="hidden md:flex items-center w-28 shrink-0">
                  <Skeleton className={cn("h-6 rounded-full", badgeWidth)} />
                </div>

                {/* Stock / Quantity */}
                <div className="hidden sm:flex items-center w-24 shrink-0">
                  <Skeleton className="h-4 w-14 rounded" />
                </div>

                {/* Price / Numbers */}
                <div className="hidden lg:flex items-center w-24 shrink-0">
                  <Skeleton className="h-4 w-18 rounded" />
                </div>

                {/* Status Pill */}
                <div className="flex items-center w-20 shrink-0">
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>

                {/* Action Buttons */}
                <div className="w-20 flex items-center justify-center gap-1.5 shrink-0">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex-shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3.5 bg-neutral-50/80 border-t border-neutral-200">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-44 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24 rounded-lg hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminTableSkeleton({
  rows = 7,
  columns = 6,
  showStats = false,
  bare = false,
  className,
}: AdminTableSkeletonProps) {
  if (bare) {
    return <TableGridSkeleton rows={rows} columns={columns} className={className} />;
  }

  return (
    <div className={cn("flex flex-1 min-h-0 flex-col", className)}>
      {/* Page Header Skeleton */}
      <div className="flex-shrink-0 flex items-center justify-between pb-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-4 w-80 rounded-md opacity-75" />
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* Stats Cards (if enabled) */}
      {showStats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-8 w-8 rounded-xl" />
              </div>
              <Skeleton className="h-7 w-28 rounded-lg" />
              <Skeleton className="h-3.5 w-36 rounded opacity-70" />
            </div>
          ))}
        </div>
      )}

      {/* Controls Bar (Search + Dropdown Filters + Actions) */}
      <div className="flex-shrink-0 mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <Skeleton className="h-11 w-full max-w-sm rounded-xl" />
          <Skeleton className="h-11 w-44 rounded-xl hidden md:block" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-11 w-24 rounded-xl hidden sm:block" />
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
      </div>

      {/* Main Table Grid Skeleton */}
      <div className="flex-1 min-h-0 flex flex-col">
        <TableGridSkeleton rows={rows} columns={columns} />
      </div>
    </div>
  );
}

export { AdminTableSkeleton };
