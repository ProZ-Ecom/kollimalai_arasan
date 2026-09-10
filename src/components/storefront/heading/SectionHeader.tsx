"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  /** Leading words, rendered in the primary text colour. */
  title: string;
  /** Trailing words, rendered in the accent colour. Optional. */
  accent?: string;
  /** Right-hand slot - a "View All" button, carousel arrows, a filter, etc. */
  action?: React.ReactNode;
  className?: string;
  titleClassName?: string;
}

/**
 * Left-aligned section heading with an optional accent word and a right-hand
 * action slot.
 *
 * Distinct from `SectionHeading`, which is the centred, uppercase treatment
 * with the flower divider. This one is for rows that carry a control on the
 * right (product carousels, "View All" grids).
 */
export function SectionHeader({
  title,
  accent,
  action,
  className,
  titleClassName,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 mb-6 sm:mb-8",
        className
      )}
    >
      <h2
        className={cn(
          "text-xl sm:text-2xl lg:text-[28px] font-bold uppercase tracking-tight text-theme-text-primary",
          titleClassName
        )}
      >
        {title}
        {accent ? (
          <span className="text-accent-orange"> {accent}</span>
        ) : null}
      </h2>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export default SectionHeader;
