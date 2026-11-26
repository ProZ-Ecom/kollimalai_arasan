"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export default function AdminReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const isAllowed = userRole === "ADMIN";

  useEffect(() => {
    if (status === "authenticated" && !isAllowed) {
      router.replace("/admin/dashboard");
    }
  }, [status, isAllowed, router]);

  if (status === "loading") {
    return (
      <div className="space-y-4">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-neutral-200/70" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-44 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100/70"
            />
          ))}
        </div>
      </div>
    );
  }

  if (status === "authenticated" && !isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-6 py-16 text-center">
        <ShieldAlert className="h-8 w-8 text-rose-600" />
        <h2 className="mt-3 text-base font-bold text-rose-900">
          Admin Access Required
        </h2>
        <p className="mt-1 max-w-md text-xs text-rose-700">
          Store reports are restricted to administrators only.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
