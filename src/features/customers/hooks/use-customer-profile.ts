import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { customerProfileApi } from "../api/customer-profile.api";
import type { CustomerProfileResponse } from "../types";
import type { UpdateCustomerProfileInput } from "../validations/customer-profile.schema";

export const CUSTOMER_PROFILE_QUERY_KEY = ["customer", "profile"] as const;

export function useCustomerProfile() {
  const { status } = useSession();

  return useQuery<CustomerProfileResponse>({
    queryKey: CUSTOMER_PROFILE_QUERY_KEY,
    queryFn: () => customerProfileApi.getProfile(),
    enabled: status === "authenticated",
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateCustomerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCustomerProfileInput) =>
      customerProfileApi.updateProfile(data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(CUSTOMER_PROFILE_QUERY_KEY, updatedProfile);
      queryClient.invalidateQueries({ queryKey: CUSTOMER_PROFILE_QUERY_KEY });
    },
  });
}
