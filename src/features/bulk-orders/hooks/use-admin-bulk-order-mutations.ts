"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminBulkOrderKeys } from "@/lib/api/query-keys";
import { toast } from "@/components/ui/Toast";
import { updateBulkOrderStatus } from "../api/admin-bulk-order.api";
import type { BulkOrderEnquiryResponse, BulkOrderEnquiryStatus } from "../types";

export interface UpdateBulkOrderStatusVariables {
  uuid: string;
  status: BulkOrderEnquiryStatus;
  comment?: string;
}

export function useUpdateBulkOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    BulkOrderEnquiryResponse,
    Error,
    UpdateBulkOrderStatusVariables
  >({
    mutationFn: ({ uuid, status, comment }) =>
      updateBulkOrderStatus(uuid, status, comment),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminBulkOrderKeys.all });
      queryClient.invalidateQueries({
        queryKey: adminBulkOrderKeys.detail(variables.uuid),
      });

      const statusLabels: Record<BulkOrderEnquiryStatus, string> = {
        new: "Marked as New",
        contacted: "Marked as Contacted",
        closed: "Marked as Closed",
      };

      toast.success(
        "Status Updated",
        `Bulk order enquiry from "${data.name}" has been ${statusLabels[variables.status].toLowerCase()}.`
      );
    },
    onError: (error) => {
      toast.error(
        "Update Failed",
        error.message || "Failed to update bulk order enquiry status."
      );
    },
  });
}
