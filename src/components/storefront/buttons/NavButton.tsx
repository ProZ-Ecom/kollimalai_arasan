"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

export interface NavButtonProps {
  text?: string;
  icon?: string;
  customIcon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "desktop" | "drawer" | "bottom";
  isActive?: boolean;
  badge?: number | null;
  children?: React.ReactNode;
}

export function NavButton({
  text,
  icon,
  customIcon,
  href,
  onClick,
  variant = "desktop",
  isActive = false,
  badge,
  children,
}: NavButtonProps) {
  const variants = {
    desktop:
      "flex items-center gap-1 text-sm font-medium text-hover-primary hover:-translate-y-0.5",
    drawer:
      "flex w-full items-center justify-between px-6 py-4 text-white hover:bg-white/10",
    bottom:
      "relative flex flex-col-reverse items-center gap-1 text-xs font-medium hover:scale-105",
  };

  const activeClass = isActive
    ? variant === "drawer"
      ? "drawer-active"
      : "text-theme-primary font-semibold"
    : "";

  const iconElement = customIcon || children;

  const content = (
    <>
      {text && <span>{text}</span>}

      {(iconElement || icon) && (
        <div className="relative inline-flex items-center justify-center">
          {iconElement ? (
            iconElement
          ) : icon ? (
            <Image
              src={icon}
              alt={text || "nav icon"}
              width={variant === "bottom" ? 18 : variant === "drawer" ? 16 : 12}
              height={variant === "bottom" ? 18 : variant === "drawer" ? 16 : 12}
              className={`transition-transform duration-300 ${
                variant === "bottom"
                  ? "group-hover:scale-110"
                  : "group-hover:rotate-180"
              }`}
            />
          ) : null}
          {badge !== undefined && badge !== null && badge > 0 ? (
            <span className="absolute -top-1.5 -right-2 bg-theme-status-can-fg text-theme-primary-fg text-xs font-bold rounded-full min-w-[15px] h-[15px] px-0.5 flex items-center justify-center pointer-events-none">
              {badge > 99 ? "99+" : badge}
            </span>
          ) : null}
        </div>
      )}
    </>
  );

  const sharedClasses = `
    group transition-all duration-150 cursor-pointer active:scale-95
    ${variants[variant]}
    ${activeClass}
  `;

  if (href) {
    return (
      <Link href={href} className={sharedClasses} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={sharedClasses}
    >
      {content}
    </button>
  );
}

export default NavButton;
