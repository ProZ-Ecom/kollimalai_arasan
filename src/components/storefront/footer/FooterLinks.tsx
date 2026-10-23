"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();

  const handleLinkClick = (href: string) => {
    // If it's an external link or fragment-only link, skip
    if (
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    ) {
      return;
    }

    const cleanHref = href.split("?")[0].split("#")[0] || "/";
    const normalizedHref =
      cleanHref !== "/" && cleanHref.endsWith("/")
        ? cleanHref.slice(0, -1)
        : cleanHref;

    const normalizedCurrent =
      pathname !== "/" && pathname.endsWith("/")
        ? pathname.slice(0, -1)
        : pathname;

    if (normalizedHref === normalizedCurrent) {
      if (typeof window !== "undefined") {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "smooth",
        });
      }
    }
  };

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
                <Link
                  href={href}
                  scroll={true}
                  onClick={() => handleLinkClick(href)}
                  className={classes}
                >
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
