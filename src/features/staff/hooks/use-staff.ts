"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { staffKeys } from "@/lib/api/query-keys";
import {
  getStaffList,
  getStaffByUuid,
  getStaffCount,
  createStaff,
  updateStaff,
} from "../api/staff.api";
import type {
  GetStaffParams,
  StaffResponse,
  AdminStaffCountResponse,
} from "../types";
import type {
  CreateStaffInput,
  UpdateStaffInput,
} from "../validations/staff.schema";

export function useStaffList(params?: GetStaffParams) {
  const page = Number(params?.page) || 1;
  const limit = Number(params?.limit ?? params?.pageSize) || 10;

  const queryParams: Record<string, string | number | boolean | undefined> = {
    page,
    limit,
    pageSize: limit,
    search: params?.search,
    isActive: params?.isActive,
    sortBy: params?.sortBy ?? "name",
    sortOrder: params?.sortOrder ?? "asc",
  };

  return useQuery({
    queryKey: staffKeys.list(queryParams),
    queryFn: () => getStaffList(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useStaffCount(params?: Partial<GetStaffParams>) {
  const queryParams: Record<string, string | boolean | undefined> = {
    search: params?.search,
    isActive: params?.isActive,
  };

  return useQuery<AdminStaffCountResponse>({
    queryKey: [...staffKeys.all, "count", queryParams] as const,
    queryFn: () => getStaffCount(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useStaffDetail(uuid: string | null) {
  return useQuery({
    queryKey: staffKeys.detail(uuid ?? ""),
    queryFn: () => getStaffByUuid(uuid!),
    enabled: Boolean(uuid),
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation<StaffResponse, Error, CreateStaffInput>({
    mutationFn: (data: CreateStaffInput) => createStaff(data),
    meta: {
      successMessage: "Staff created successfully.",
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation<
    StaffResponse,
    Error,
    { uuid: string; data: UpdateStaffInput }
  >({
    mutationFn: ({ uuid, data }) => updateStaff(uuid, data),
    meta: {
      successMessage: "Staff updated successfully.",
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
      queryClient.invalidateQueries({
        queryKey: staffKeys.detail(variables.uuid),
      });
    },
  });
}
