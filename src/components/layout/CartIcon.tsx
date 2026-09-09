"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface CartIconProps {
  count?: number;
  className?: string;
}

function CartIcon({ count, className }: CartIconProps) {
  return (
    <Link
      href="/cart"
      className={cn(
        "relative flex items-center justify-center h-10 w-10 rounded-lg",
        "text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors",
        className
      )}
      aria-label={`Shopping cart${count !== undefined ? ` with ${count} items` : ""}`}
    >
      <ShoppingCart className="h-5 w-5" />
      {count !== undefined && count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

interface WishlistIconProps {
  count?: number;
  className?: string;
}

function WishlistIcon({ count, className }: WishlistIconProps) {
  return (
    <Link
      href="/wishlist"
      className={cn(
        "relative flex items-center justify-center h-10 w-10 rounded-lg",
        "text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors",
        className
      )}
      aria-label={`Wishlist${count !== undefined ? ` with ${count} items` : ""}`}
    >
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
      {count !== undefined && count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

export { CartIcon, WishlistIcon };
export type { CartIconProps, WishlistIconProps };
