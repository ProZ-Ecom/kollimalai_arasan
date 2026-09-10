"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** A column entry: either plain text, or a real link when an href is known. */
export type FooterLinkItem = string | { label: string; href: string };

export interface FooterLinksProps {
  title: string;
  items: readonly FooterLinkItem[];
  className?: string;
  /** Overridable so the same column works on light and dark footers. */
  titleClassName?: string;
  linkClassName?: string;
}

export function FooterLinks({
  title,
  items,
  className = "",
  titleClassName,
  linkClassName,
}: FooterLinksProps) {
  return (
    <div className={className}>
      <h3
        className={cn(
          "text-lg sm:text-xl font-bold mb-5",
          titleClassName ?? "text-secondary-500"
        )}
      >
        {title}
      </h3>

      <ul className="space-y-3 header-font text-sm">
        {items.map((item) => {
          const label = typeof item === "string" ? item : item.label;
          const href = typeof item === "string" ? undefined : item.href;
          const classes = cn(
            "transition-colors duration-300",
            linkClassName ??
              "text-theme-text-primary hover:text-secondary-500"
          );

          return (
            <li key={label}>
              {href ? (
                <Link href={href} className={classes}>
                  {label}
                </Link>
              ) : (
                <span className={cn(classes, "cursor-default")}>{label}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default FooterLinks;
