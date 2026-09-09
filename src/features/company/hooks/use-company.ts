"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyKeys } from "@/lib/api/query-keys";
import { companyApi } from "../api/company.api";
import type { CompanyResponse, UpdateCompanyInput } from "../types";
import { toast } from "@/components/ui";

/**
 * Hook to fetch company profile & settings
 */
export function useCompany() {
  return useQuery<CompanyResponse | null>({
    queryKey: companyKeys.all,
    queryFn: () => companyApi.getCompany(),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

/**
 * Hook to update company settings
 */
export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCompanyInput) => companyApi.updateCompany(data),
    onSuccess: (updatedCompany) => {
      queryClient.setQueryData(companyKeys.all, updatedCompany);
      queryClient.invalidateQueries({ queryKey: companyKeys.all });
      toast.success("Success", "Company details updated successfully.");
    },
    onError: (error: Error) => {
      toast.error("Update Failed", error.message || "Failed to update company details.");
    },
  });
}

/**
 * Hook to upload company logo
 */
export function useUploadCompanyLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => companyApi.uploadLogo(file),
    onSuccess: (result) => {
      queryClient.setQueryData(companyKeys.all, result.company);
      queryClient.invalidateQueries({ queryKey: companyKeys.all });
      toast.success("Logo Uploaded", "Company logo updated successfully.");
    },
    onError: (error: Error) => {
      toast.error("Upload Failed", error.message || "Failed to upload company logo.");
    },
  });
}
