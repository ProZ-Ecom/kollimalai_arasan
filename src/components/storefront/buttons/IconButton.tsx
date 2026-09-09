"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export interface IconButtonProps {
  icon?: string;
  customIcon?: React.ReactNode;
  alt: string;
  href?: string;
  onClick?: () => void;
  badge?: number | null;
  className?: string;
  imageClassName?: string;
  width?: number;
  height?: number;
  children?: React.ReactNode;
}

export function IconButton({
  icon,
  customIcon,
  alt,
  href,
  onClick,
  badge,
  className = "",
  imageClassName = "",
  width = 18,
  height = 18,
  children,
}: IconButtonProps) {
  const content = (
    <>
      {customIcon || children ? (
        customIcon || children
      ) : icon ? (
        <Image
          src={icon}
          alt={alt}
          width={width}
          height={height}
          className={imageClassName}
        />
      ) : null}
      {badge !== undefined && badge !== null && badge > 0 ? (
        <span className="absolute -top-2 -right-2 bg-theme-status-can-fg text-theme-primary-fg text-xs font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shadow-xs pointer-events-none">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </>
  );

  const sharedClasses = cn(
    "relative inline-flex items-center justify-center cursor-pointer hover:scale-110 active:scale-90 transition-transform duration-150",
    className
  );

  if (href) {
    return (
      <Link href={href} className={sharedClasses} aria-label={alt} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={sharedClasses}
      aria-label={alt}
    >
      {content}
    </button>
  );
}

export default IconButton;
