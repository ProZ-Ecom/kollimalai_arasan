"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

function AuthGuard({
  children,
  requiredRole,
  fallback,
  redirectTo = "/login",
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated" || !session?.user) {
      router.push(redirectTo);
      return;
    }

    if (requiredRole && requiredRole.length > 0) {
      const userRole = (session.user as { role?: string }).role;
      if (!userRole || !requiredRole.includes(userRole)) {
        router.push("/unauthorized");
        return;
      }
    }
  }, [session, status, router, requiredRole, redirectTo]);

  if (status === "loading") {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      )
    );
  }

  if (status === "unauthenticated" || !session?.user) {
    return null;
  }

  if (requiredRole && requiredRole.length > 0) {
    const userRole = (session.user as { role?: string }).role;
    if (!userRole || !requiredRole.includes(userRole)) {
      return null;
    }
  }

  return <>{children}</>;
}

export { AuthGuard };
