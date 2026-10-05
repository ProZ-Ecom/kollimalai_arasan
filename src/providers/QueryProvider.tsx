"use client";

import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "@/components/ui/Toast";
import { ApiClientError } from "@/lib/api/api-client";

interface MetaOptions {
  skipToast?: boolean;
  successTitle?: string;
  successMessage?: string;
  errorTitle?: string;
  errorMessage?: string;
}

function getOperationTitle(message?: string): string {
  if (!message || typeof message !== "string") return "Success";
  const trimmed = message.trim();

  const match = trimmed.match(
    /^([A-Za-z0-9\s_-]+?)\s+(created|updated|deleted|added|removed|saved|restored|activated|deactivated|submitted|uploaded|sent|applied|changed|verified)(\s+successfully)?\.?$/i
  );
  if (match) {
    const entity = match[1].trim();
    const action =
      match[2].charAt(0).toUpperCase() + match[2].slice(1).toLowerCase();
    const titleCaseEntity = entity.replace(
      /\b[a-z]/g,
      (char) => char.toUpperCase()
    );
    return `${titleCaseEntity} ${action}`;
  }

  return "Success";
}

function getErrorTitle(errorMsg?: string): string {
  if (!errorMsg || typeof errorMsg !== "string") return "Error";
  const trimmed = errorMsg.trim();
  const match = trimmed.match(/^Failed to ([a-z]+)\s+([A-Za-z0-9\s_-]+)/i);
  if (match) {
    const action =
      match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    const entity = match[2].trim().replace(/\b[a-z]/g, (c) => c.toUpperCase());
    return `${entity} ${action} Failed`;
  }
  return "Error";
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

        // ONLY treat as API message if explicitly provided in meta, or if data is an ApiResponse object with `success === true` and not an entity object
        let message: string | undefined;
        if (meta?.successMessage) {
          message = meta.successMessage;
        } else if (
          data &&
          typeof data === "object" &&
          data.success === true &&
          typeof data.message === "string" &&
          !("email" in data && "name" in data) && // not a ContactMessage / Customer entity
          !("totalAmount" in data && "orderNumber" in data) // not an Order entity
        ) {
          message = data.message;
        }

        if (message && typeof message === "string") {
          const title = meta?.successTitle || getOperationTitle(message);
          toast.success(title, message);
        }
      },
      onError: (error: any, _variables, _context, mutation) => {
        const meta = mutation.meta as MetaOptions | undefined;
        if (meta?.skipToast) return;

        const backendMessage =
          error?.message || meta?.errorMessage || "An unexpected error occurred";

        const title = meta?.errorTitle || getErrorTitle(backendMessage);
        toast.error(title, backendMessage);
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
