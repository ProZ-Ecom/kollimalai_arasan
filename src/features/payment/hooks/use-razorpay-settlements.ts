"use client";

import { useState, useEffect, useCallback } from "react";
import type { RazorpayDashboardData } from "@/features/payment/services/razorpay-settlements.service";

interface UseRazorpaySettlementsReturn {
  data: RazorpayDashboardData | null;
  isLoading: boolean;
  error: string | null;
  days: number;
  setDays: (days: number) => void;
  refetch: () => void;
}

export function useRazorpaySettlements(
  initialDays = 30
): UseRazorpaySettlementsReturn {
  const [data, setData] = useState<RazorpayDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(initialDays);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/payments/settlements?days=${days}`,
          { credentials: "include" }
        );
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(
            json?.message || `Request failed with status ${res.status}`
          );
        }
        const json = await res.json();
        if (!cancelled) {
          setData(json.data ?? json);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load settlement data");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [days, refreshKey]);

  return { data, isLoading, error, days, setDays, refetch };
}
