import { CheckCircle2 } from "lucide-react";
import type { StatusConfig } from "@/components/common/status-badge";

/**
 * Enquiry lifecycle vocabulary, shared by the bulk-orders list page and the
 * detail modal so the two can never drift apart.
 */
export const BULK_ORDER_STATUS: Record<string, StatusConfig> = {
  new: { label: "New", tone: "warning", dot: true, pulse: true },
  contacted: {
    label: "Contacted",
    tone: "info",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  closed: {
    label: "Closed",
    tone: "success",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
};
