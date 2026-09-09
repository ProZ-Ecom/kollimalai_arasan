"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { roleKeys, permissionKeys } from "@/lib/api/query-keys";
import {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  getPermission,
  createPermission,
  updatePermission,
  deletePermission,
} from "../api/get-roles";

export function useRoles() {
  return useQuery({
    queryKey: roleKeys.list(),
    queryFn: async () => {
      const response = await getRoles();
      return response.data!;
    },
  });
}

export function useRole(id: number | null) {
  return useQuery({
    queryKey: roleKeys.detail(id ?? 0),
    queryFn: async () => {
      const response = await getRole(id!);
      return response.data!;
    },
    enabled: !!id,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      updateRole(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(variables.id) });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: permissionKeys.list(),
    queryFn: async () => {
      const response = await getPermissions();
      return response.data!;
    },
  });
}

export function usePermission(id: number | null) {
  return useQuery({
    queryKey: permissionKeys.detail(id ?? 0),
    queryFn: async () => {
      const response = await getPermission(id!);
      return response!;
    },
    enabled: !!id,
  });
}

export function useCreatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createPermission(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.all });
    },
  });
}

export function useUpdatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      updatePermission(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.all });
      queryClient.invalidateQueries({ queryKey: permissionKeys.detail(variables.id) });
    },
  });
}

export function useDeletePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deletePermission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.all });
    },
  });
}
