"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { offerKeys } from "@/lib/api/query-keys";
import {
  createOffer,
  updateOffer,
  updateOfferStatus,
  deleteOffer,
} from "../api/get-offers";
import type { SaveOfferInput, UpdateOfferInput } from "../types";

/**
 * An offer changes what the storefront charges, so every mutation also drops
 * the cached prices the catalog and cart are showing.
 */
function useOfferInvalidation() {
  const queryClient = useQueryClient();
  return (id?: string) => {
    queryClient.invalidateQueries({ queryKey: offerKeys.all });
    if (id) queryClient.invalidateQueries({ queryKey: offerKeys.detail(id) });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["cart"] });
  };
}

export function useCreateOffer() {
  const invalidate = useOfferInvalidation();
  return useMutation({
    mutationFn: (data: SaveOfferInput | Record<string, unknown>) => createOffer(data),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateOffer() {
  const invalidate = useOfferInvalidation();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateOfferInput | Record<string, unknown>;
    }) => updateOffer(id, data),
    onSuccess: (_result, variables) => invalidate(variables.id),
  });
}

export function useToggleOfferStatus() {
  const invalidate = useOfferInvalidation();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateOfferStatus(id, isActive),
    onSuccess: (_result, variables) => invalidate(variables.id),
  });
}

export function useDeleteOffer() {
  const invalidate = useOfferInvalidation();
  return useMutation({
    mutationFn: (id: string) => deleteOffer(id),
    onSuccess: () => invalidate(),
  });
}
