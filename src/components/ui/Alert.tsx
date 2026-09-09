"use client";

import * as React from "react";
import { Info, CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  closable?: boolean;
  onClose?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const variantStyles: Record<AlertVariant, { container: string; icon: string; iconColor: string }> = {
  info: {
    container: "bg-blue-50 border-blue-200 text-blue-800",
    icon: "text-blue-500",
    iconColor: "text-blue-500",
  },
  success: {
    container: "bg-green-50 border-green-200 text-green-800",
    icon: "text-green-500",
    iconColor: "text-green-500",
  },
  warning: {
    container: "bg-yellow-50 border-yellow-200 text-yellow-800",
    icon: "text-yellow-500",
    iconColor: "text-yellow-500",
  },
  error: {
    container: "bg-red-50 border-red-200 text-red-800",
    icon: "text-red-500",
    iconColor: "text-red-500",
  },
};

const defaultIcons: Record<AlertVariant, React.ReactNode> = {
  info: <Info className="h-5 w-5" />,
  success: <CheckCircle2 className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  error: <XCircle className="h-5 w-5" />,
};

function Alert({
  variant = "info",
  title,
  description,
  icon,
  closable,
  onClose,
  className,
  children,
}: AlertProps) {
  const styles = variantStyles[variant];

  return (
    <div role="alert" className={cn("flex items-start gap-3 rounded-lg border p-4", styles.container, className)}>
      <div className={cn("mt-0.5 shrink-0", styles.iconColor)}>
        {icon ?? defaultIcons[variant]}
      </div>
      <div className="flex-1 min-w-0">
        {title && <h5 className="text-sm font-semibold">{title}</h5>}
        {description && <p className="mt-1 text-sm opacity-90">{description}</p>}
        {children && <div className="mt-1 text-sm opacity-90">{children}</div>}
      </div>
      {closable && onClose && (
        <button
          onClick={onClose}
          className={cn("shrink-0 rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity", styles.icon)}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export { Alert };
export type { AlertProps, AlertVariant };
