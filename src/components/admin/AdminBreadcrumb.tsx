"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

function AdminBreadcrumb({ items, className }: AdminBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center text-sm", className)}>
      <ol className="flex items-center gap-1">
        {/* <li>
          <Link
            href="/admin/dashboard"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li> */}
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1">
            
            {item.href ? (
              <Link
                href={item.href}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {item.label}
                
              </Link>
              
            ) : (
              <span className="font-medium text-gray-900">{item.label}</span>
            )}
              <ChevronRight className="h-4 w-4 text-gray-300" />
          </li>
        ))}
      </ol>
    </nav>
  );
}

export { AdminBreadcrumb };
export type { AdminBreadcrumbProps, BreadcrumbItem };
