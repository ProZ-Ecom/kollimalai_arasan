import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { customerAddressApi } from "../api/customer-address.api";
import type { CustomerAddressResponse } from "../types/customer-address.types";
import type {
  CreateCustomerAddressInput,
  UpdateCustomerAddressInput,
} from "../validations/customer-address.schema";

export const CUSTOMER_ADDRESSES_QUERY_KEY = ["customer", "addresses"] as const;

export function useCustomerAddresses() {
  const { status } = useSession();

  return useQuery<CustomerAddressResponse[]>({
    queryKey: CUSTOMER_ADDRESSES_QUERY_KEY,
    queryFn: () => customerAddressApi.getAddresses(),
    enabled: status === "authenticated",
  });
}

export function useCreateCustomerAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerAddressInput) =>
      customerAddressApi.createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_ADDRESSES_QUERY_KEY });
    },
  });
}

export function useUpdateCustomerAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      uuid,
      data,
    }: {
      uuid: string;
      data: UpdateCustomerAddressInput;
    }) => customerAddressApi.updateAddress(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_ADDRESSES_QUERY_KEY });
    },
  });
}

export function useDeleteCustomerAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => customerAddressApi.deleteAddress(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_ADDRESSES_QUERY_KEY });
    },
  });
}
