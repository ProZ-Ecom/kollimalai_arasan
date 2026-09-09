"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useAuth() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const user = session?.user;
  const isAuthenticated = status === "authenticated" && !!user;
  const isLoading = status === "loading";
  const isAdmin = user?.role === "ADMIN" || user?.role === "STAFF";
  const isCustomer = user?.role === "CUSTOMER";

  const requireAuth = useCallback(
    (redirectTo = "/login") => {
      if (!isLoading && !isAuthenticated) {
        router.push(redirectTo);
      }
    },
    [isLoading, isAuthenticated, router]
  );

  const requireAdmin = useCallback(() => {
    if (!isLoading && !isAdmin) {
      router.push("/unauthorized");
    }
  }, [isLoading, isAdmin, router]);

  return {
    user,
    session,
    status,
    isAuthenticated,
    isLoading,
    isAdmin,
    isCustomer,
    requireAuth,
    requireAdmin,
    update,
  };
}
