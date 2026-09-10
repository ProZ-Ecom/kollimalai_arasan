import { CheckCircle2 } from "lucide-react";
import type { StatusConfig } from "@/components/common/status-badge";

/**
 * Contact-message lifecycle vocabulary, shared by the contacts list page and
 * the detail modal so the two can never drift apart.
 */
export const CONTACT_STATUS: Record<string, StatusConfig> = {
  new: { label: "New", tone: "warning", dot: true, pulse: true },
  read: {
    label: "Read",
    tone: "info",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  replied: {
    label: "Replied",
    tone: "success",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
};
