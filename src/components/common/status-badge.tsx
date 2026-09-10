import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Semantic tones for a status pill.
 *
 * Every domain used to hand-roll its own `getStatusBadge` switch returning raw
 * Tailwind colours (bulk orders, contacts, stock, customers, orders...). Those
 * now supply a config map instead, so the colour vocabulary lives here and the
 * rendering happens in exactly one place.
 */
export type StatusTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "accent";

export interface StatusConfig {
  /** Display text. Defaults to the humanised status key. */
  label?: string;
  tone?: StatusTone;
  /** Leading glyph, e.g. a lucide icon. Rendered before the label. */
  icon?: React.ReactNode;
  /** Leading dot. `pulse` animates it, for live/unread states. */
  dot?: boolean;
  pulse?: boolean;
}

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "bg-neutral-100 text-neutral-700 border-neutral-200",
  success: "bg-green-100 text-green-800 border-green-200",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  danger: "bg-error-100 text-error-700 border-error-200",
  info: "bg-blue-100 text-blue-800 border-blue-200",
  accent: "bg-brown-100 text-brown-700 border-brown-200",
};

const DOT_CLASSES: Record<StatusTone, string> = {
  neutral: "bg-neutral-500",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  danger: "bg-error-500",
  info: "bg-blue-500",
  accent: "bg-brown-500",
};

/**
 * Fallback vocabulary for the shared uppercase statuses used across admin
 * tables. A caller-supplied `config` entry always wins over this.
 */
const DEFAULT_STATUS_CONFIG: Record<string, StatusConfig> = {
  ACTIVE: { tone: "success" },
  INACTIVE: { tone: "neutral" },
  BLOCKED: { tone: "danger" },
  PENDING: { tone: "warning" },
  CONFIRMED: { tone: "info" },
  PROCESSING: { tone: "info" },
  SHIPPED: { tone: "info" },
  DELIVERED: { tone: "success" },
  CANCELLED: { tone: "danger" },
  REFUNDED: { tone: "warning" },
  RETURNED: { tone: "warning" },
  COMPLETED: { tone: "success" },
  FAILED: { tone: "danger" },
  PUBLISHED: { tone: "success" },
  DRAFT: { tone: "neutral" },
  ARCHIVED: { tone: "neutral" },
};

/** "IN_PROGRESS" -> "in progress" */
function humanise(status: string) {
  return status.replace(/_/g, " ").toLowerCase();
}

export interface StatusBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  status: string;
  /**
   * Domain vocabulary. Keys are matched as given, then case-insensitively, so
   * a map keyed on "new" still resolves a "NEW" status.
   */
  config?: Record<string, StatusConfig>;
  className?: string;
}

function StatusBadge({
  status,
  config,
  className,
  ...rest
}: StatusBadgeProps) {
  const entry =
    config?.[status] ??
    config?.[status.toUpperCase()] ??
    config?.[status.toLowerCase()] ??
    DEFAULT_STATUS_CONFIG[status.toUpperCase()] ??
    {};

  const tone = entry.tone ?? "neutral";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
        TONE_CLASSES[tone],
        className
      )}
      {...rest}
    >
      {entry.dot ? (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            DOT_CLASSES[tone],
            entry.pulse && "animate-pulse"
          )}
        />
      ) : null}
      {entry.icon}
      {entry.label ?? humanise(status)}
    </span>
  );
}

export { StatusBadge };
