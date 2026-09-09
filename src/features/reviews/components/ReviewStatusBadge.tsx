"use client";

import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewStatusBadgeProps {
  isApproved: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function ReviewStatusBadge({
  isApproved,
  className,
  size = "sm",
}: ReviewStatusBadgeProps) {
  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3 py-1 text-xs sm:text-sm",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
  };

  if (isApproved) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full font-bold border",
          "bg-success-50 text-success-700 border-success-200 shadow-2xs",
          sizeClasses[size],
          className
        )}
      >
        <CheckCircle2 className={iconSizes[size]} />
        <span>Approved</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold border",
        "bg-amber-50 text-amber-800 border-amber-200 shadow-2xs",
        sizeClasses[size],
        className
      )}
    >
      <Clock className={iconSizes[size]} />
      <span>Pending / Unapproved</span>
    </span>
  );
}
