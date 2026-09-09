"use client";

import { useQuery } from "@tanstack/react-query";
import { companyKeys } from "@/lib/api/query-keys";
import { customerCompanyApi } from "../api/customer-company.api";
import type { CompanyResponse } from "@/features/company/types";

export const CUSTOMER_COMPANY_QUERY_KEY = companyKeys.all;

/**
 * Hook to fetch company details for storefront / footer
 */
export function useCustomerCompany() {
  return useQuery<CompanyResponse | null>({
    queryKey: CUSTOMER_COMPANY_QUERY_KEY,
    queryFn: () => customerCompanyApi.getCompany(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
