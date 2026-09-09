"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  side?: "left" | "right";
  className?: string;
}

function Drawer({ open, onClose, children, title, side = "right", className }: DrawerProps) {
  const [hasOpened, setHasOpened] = React.useState(open);

  React.useEffect(() => {
    if (open) setHasOpened(true);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 transition-opacity duration-200",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close drawer"
        className="fixed inset-0 cursor-default bg-neutral-900/40"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
      />
      <div
        className={cn(
          "bg-background fixed inset-y-0 flex flex-col shadow-xl transition-transform duration-200",
          side === "right" ? "right-0 w-full max-w-sm" : "left-0 w-full max-w-sm",
          open ? "translate-x-0" : side === "right" ? "translate-x-full" : "-translate-x-full",
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 p-4">
          <div className="min-w-0">{title}</div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Close drawer"
            tabIndex={open ? 0 : -1}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{hasOpened ? children : null}</div>
      </div>
    </div>
  );
}

export { Drawer };
