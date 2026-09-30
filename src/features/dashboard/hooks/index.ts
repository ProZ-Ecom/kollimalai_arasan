"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getDashboardStats,
  type DashboardStatsResponse,
  type DashboardPeriod,
} from "../api/get-stats";

export function useDashboardStats(period: DashboardPeriod = "month") {
  return useQuery<DashboardStatsResponse>({
    queryKey: ["dashboard", "stats", period],
    queryFn: () => getDashboardStats(period),
    staleTime: 60 * 1000, // 1 minute fresh cache
  });
}

