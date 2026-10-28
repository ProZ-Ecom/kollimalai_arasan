"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
  contentClassName?: string;
  overflowVisible?: boolean;
}

const sizeStyles: Record<string, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[90vw]",
};

function FormModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
  contentClassName,
  overflowVisible = false,
}: FormModalProps) {
  const overlayRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 md:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-modal-title"
        aria-describedby={description ? "form-modal-desc" : undefined}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] my-auto",
          overflowVisible ? "overflow-visible" : "overflow-hidden",
          "animate-in zoom-in-95 duration-200",
          sizeStyles[size],
          className
        )}
      >
        <div className="flex items-start justify-between border-b border-gray-200 p-4 sm:p-5 shrink-0">
          <div className="min-w-0 pr-3">
            <h2 id="form-modal-title" className="text-base sm:text-lg font-semibold text-gray-900 leading-snug">
              {title}
            </h2>
            {description && (
              <p id="form-modal-desc" className="mt-1 text-xs sm:text-sm text-gray-500 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className={cn(
            "flex-1 p-4 sm:p-6 scrollbar-thin",
            overflowVisible ? "overflow-visible" : "overflow-y-auto",
            contentClassName
          )}
        >
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50/70 p-3.5 sm:p-4 sm:px-6 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

return createPortal(modal, document.body);
}

export { FormModal };
export type { FormModalProps };
