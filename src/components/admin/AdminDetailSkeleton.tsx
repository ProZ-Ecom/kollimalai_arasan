import { Skeleton } from "@/components/ui/skeleton";

function AdminDetailSkeleton() {
  return (
    <div className="flex flex-1 min-h-0 flex-col gap-6 p-1">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}

export { AdminDetailSkeleton };
