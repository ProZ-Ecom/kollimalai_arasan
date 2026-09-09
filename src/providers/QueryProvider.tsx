"use client";

import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "@/components/ui/Toast";
import { ApiClientError } from "@/lib/api/api-client";

interface MetaOptions {
  skipToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // If 401 Unauthorized, apiClient already performed silent refresh and retry.
          // Do not retry 401s further in React Query to prevent infinite/duplicate loops.
          if (error instanceof ApiClientError && error.status === 401) {
            return false;
          }
          return failureCount < 2;
        },
      },
    },
    mutationCache: new MutationCache({
      onSuccess: (data: any, _variables, _context, mutation) => {
        const meta = mutation.meta as MetaOptions | undefined;
        if (meta?.skipToast) return;

        const message = meta?.successMessage || data?.message;
        if (message && typeof message === "string") {
          toast.success("Success", message);
        }
      },
      onError: (error: any, _variables, _context, mutation) => {
        const meta = mutation.meta as MetaOptions | undefined;
        if (meta?.skipToast) return;

        const backendMessage = error?.message || meta?.errorMessage || "An unexpected error occurred";

        // Preserve exact backend message (e.g. "Invalid email or password")
        toast.error("Error", backendMessage);
      },
    }),
    queryCache: new QueryCache({
      onError: (error: any, query) => {
        const meta = query.meta as MetaOptions | undefined;
        if (meta?.skipToast) return;

        // Suppress toasts for standard query refetches unless meta.errorMessage or meta explicitly requires it
        if (meta?.errorMessage) {
          toast.error("Error", error?.message || meta.errorMessage);
        }
      },
    }),
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = React.useMemo(() => getQueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
