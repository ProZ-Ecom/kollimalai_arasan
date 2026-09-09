"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, type DashboardStats } from "../api/get-stats";

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: getDashboardStats,
  });
}
