import * as React from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

function Breadcrumb({ items, className }: BreadcrumbProps) {
  // Prevent duplicate 'Home' if already passed in items
  const cleanItems = items.filter(
    (item, index) => !(index === 0 && (item.label.toLowerCase() === "home" || item.href === "/"))
  );

  return (
    <nav className={cn("flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground", className)} aria-label="Breadcrumb">
      <Link href="/" className="hover:text-primary transition-colors font-medium">
        Home
      </Link>
      {cleanItems.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
          {item.href ? (
            <Link href={item.href} className="hover:text-primary transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-semibold truncate max-w-[240px] md:max-w-md">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export { Breadcrumb };
