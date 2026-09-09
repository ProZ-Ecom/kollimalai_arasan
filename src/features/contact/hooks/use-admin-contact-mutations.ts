"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminContactKeys } from "@/lib/api/query-keys";
import { toast } from "@/components/ui/Toast";
import {
  updateContactMessageStatus,
  replyContactMessage,
} from "../api/admin-contact.api";
import type { ContactMessageResponse, ContactMessageStatus } from "../types";

export interface UpdateContactStatusVariables {
  uuid: string;
  status: ContactMessageStatus;
}

export function useUpdateContactMessageStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    ContactMessageResponse,
    Error,
    UpdateContactStatusVariables
  >({
    mutationFn: ({ uuid, status }) => updateContactMessageStatus(uuid, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: adminContactKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: adminContactKeys.detail(variables.uuid),
      });

      const statusLabels: Record<ContactMessageStatus, string> = {
        new: "Marked as New",
        read: "Marked as Read",
        replied: "Marked as Replied",
      };

      toast.success(
        "Status Updated",
        `Contact message from "${data.name}" has been ${statusLabels[variables.status].toLowerCase()}.`
      );
    },
    onError: (error) => {
      toast.error(
        "Update Failed",
        error.message || "Failed to update contact message status."
      );
    },
  });
}

export interface ReplyContactMessageVariables {
  uuid: string;
  message: string;
}

export function useReplyContactMessage() {
  const queryClient = useQueryClient();

  return useMutation<
    ContactMessageResponse,
    Error,
    ReplyContactMessageVariables
  >({
    mutationFn: ({ uuid, message }) => replyContactMessage(uuid, message),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: adminContactKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: adminContactKeys.detail(variables.uuid),
      });

      toast.success(
        "Reply Sent Successfully",
        `Your reply was sent to ${data.email}. Message status updated to Replied.`
      );
    },
    onError: (error) => {
      toast.error(
        "Reply Failed",
        error.message || "Failed to send reply email to the customer."
      );
    },
  });
}
