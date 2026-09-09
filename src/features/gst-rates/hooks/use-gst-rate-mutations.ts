"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gstRateKeys } from "@/lib/api/query-keys";
import {
  createGstRate,
  updateGstRate,
  deleteGstRate,
} from "@/features/gst-rates/api/get-gst-rates";

export function useCreateGstRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createGstRate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gstRateKeys.all });
    },
  });
}

export function useUpdateGstRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      uuid,
      data,
    }: {
      uuid: string;
      data: Record<string, unknown>;
    }) => updateGstRate(uuid, data),

    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: gstRateKeys.all });
      queryClient.invalidateQueries({
        queryKey: gstRateKeys.detail(variables.uuid),
      });
    },
  });
}

export function useDeleteGstRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => deleteGstRate(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gstRateKeys.all });
    },
  });
}