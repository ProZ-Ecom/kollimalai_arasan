"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/ui/Toast";
import { submitBulkOrderEnquiry } from "../api/bulk-order.api";
import type { BulkOrderEnquiryResponse } from "../types";
import type { CreateBulkOrderInput } from "../validations/bulk-order.schema";

export function useSubmitBulkOrderEnquiry() {
  return useMutation<BulkOrderEnquiryResponse, Error, CreateBulkOrderInput>({
    mutationFn: submitBulkOrderEnquiry,
    onSuccess: () => {
      toast.success(
        "Enquiry Submitted",
        "Thanks for reaching out! Our team will contact you shortly with bulk pricing details."
      );
    },
    onError: (error) => {
      toast.error(
        "Submission Failed",
        error.message || "Failed to submit your bulk order enquiry."
      );
    },
  });
}
