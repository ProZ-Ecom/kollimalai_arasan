"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  useEffect(() => {
    if (status === "authenticated" && isAdmin) {
      router.replace("/admin/dashboard/orders");
    }
  }, [status, isAdmin, router]);

  if (status === "loading" || (status === "authenticated" && isAdmin)) {
    return <AdminTableSkeleton showStats />;
  }

  return <div className="flex flex-1 min-h-0 flex-col">{children}</div>;
}
