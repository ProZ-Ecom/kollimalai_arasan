"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { adminContactKeys } from "@/lib/api/query-keys";
import {
  getAdminContactMessages,
  getAdminContactMessageDetail,
} from "../api/admin-contact.api";
import type { AdminContactListInput } from "../validations/contact.schema";
import type {
  AdminContactMessageListResponse,
  ContactMessageResponse,
} from "../types";

export function useAdminContactMessages(
  params?: Partial<AdminContactListInput>
) {
  return useQuery<AdminContactMessageListResponse>({
    queryKey: adminContactKeys.list(params as Record<string, unknown>),
    queryFn: () => getAdminContactMessages(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useAdminContactMessageDetail(uuid?: string | null) {
  return useQuery<ContactMessageResponse>({
    queryKey: adminContactKeys.detail(uuid || ""),
    queryFn: () => getAdminContactMessageDetail(uuid!),
    enabled: Boolean(uuid && uuid.trim().length > 0),
    staleTime: 10 * 1000,
  });
}
