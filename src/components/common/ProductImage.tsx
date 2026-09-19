"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface ProductImageProps {
  src?: string | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
  containerClassName?: string;
  aspectRatio?: "square" | "video" | "4/3" | "auto";
  badge?: React.ReactNode;
  fallbackText?: string;
}

/**
 * Beautiful authentic South Indian snack SVG fallback illustration
 */
export function SnackFallbackIllustration({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden select-none bg-gradient-to-br from-[#FFFFFF] via-[#F5F5F5] to-[#FEF2D0] text-[#007F06] p-4 text-center",
        className
      )}
      aria-label={title || "Authentic Snack"}
    >
      {/* Decorative background radial pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#007F06_0.75px,transparent_0.75px)] opacity-[0.07] [background-size:12px_12px]" />

      {/* Decorative corner accents */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#007F06]/20 rounded-tl-sm pointer-events-none" />
      <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#007F06]/20 rounded-tr-sm pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#007F06]/20 rounded-bl-sm pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#007F06]/20 rounded-br-sm pointer-events-none" />

      {/* Center Illustration */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-[85%]">
        <div className="w-16 h-16 md:w-20 md:h-20 mb-3 rounded-full bg-white/80 shadow-sm border border-[#007F06]/15 flex items-center justify-center p-2.5 backdrop-blur-xs">
          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full text-[#007F06]"
          >
            {/* Urli / Bowl */}
            <path
              d="M8 36C8 47.0457 18.7452 56 32 56C45.2548 56 56 47.0457 56 36H8Z"
              fill="#F9CB44"
              fillOpacity="0.3"
              stroke="#007F06"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <ellipse
              cx="32"
              cy="36"
              rx="24"
              ry="7"
              fill="#FBD873"
              stroke="#007F06"
              strokeWidth="2.5"
            />
            {/* Murukku / Ribbon pakoda spirals */}
            <path
              d="M24 33C24 28 28 24 32 24C36 24 40 28 38 33C37 36 34 37 32 37"
              stroke="#007F06"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M18 34C19 26 26 20 33 20C41 20 46 25 45 32"
              stroke="#C69811"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Steam / Aroma curls */}
            <path
              d="M28 16C27 13 29 11 29 9"
              stroke="#007F06"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            />
            <path
              d="M35 15C36 12 34 10 35 7"
              stroke="#007F06"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            />
          </svg>
        </div>

        {/* Brand signature & label */}
        <span className="font-serif font-bold text-sm md:text-base tracking-wide text-[#007F06]">
          Kollimalai Arasan
        </span>
        <span className="text-[11px] md:text-xs text-[#007F06]/70 font-medium mt-0.5 line-clamp-1">
          {title || "Fresh & Handcrafted"}
        </span>
      </div>
    </div>
  );
}

// Global cache of URLs that failed to load, preventing repeated slow network timeouts across cards
const FAILED_IMAGE_URLS = new Set<string>();

function isUnresolvableImageSrc(src?: string | null): boolean {
  if (!src) return true;
  const trimmed = src.trim();
  if (
    trimmed === "" ||
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed === "/images/placeholder.png" ||
    (trimmed.startsWith("/logos/") && trimmed.endsWith(".png"))
  ) {
    return true;
  }
  return FAILED_IMAGE_URLS.has(trimmed);
}

export function ProductImage({
  src,
  alt,
  fill = true,
  width,
  height,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority = false,
  className,
  containerClassName,
  aspectRatio = "square",
  badge,
  fallbackText,
}: ProductImageProps) {
  const isInvalidSrc = isUnresolvableImageSrc(src);
  const [hasError, setHasError] = useState(isInvalidSrc);
  const [isLoading, setIsLoading] = useState(!isInvalidSrc);

  const isMountedRef = useRef(false);
  const hasLoadedBeforeMountRef = useRef(false);
  const prevSrcRef = useRef(src);

  useEffect(() => {
    isMountedRef.current = true;
    if (hasLoadedBeforeMountRef.current) {
      setIsLoading(false);
    }
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (prevSrcRef.current !== src) {
      prevSrcRef.current = src;
      const invalid = isUnresolvableImageSrc(src);
      setHasError(invalid);
      setIsLoading(!invalid);
      hasLoadedBeforeMountRef.current = false;
    }
  }, [src]);

  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "video"
      ? "aspect-video"
      : aspectRatio === "4/3"
      ? "aspect-4/3"
      : "";

  const handleImageLoad = () => {
    if (isMountedRef.current) {
      setIsLoading(false);
    } else {
      hasLoadedBeforeMountRef.current = true;
    }
  };

  const handleImageError = () => {
    if (src) {
      FAILED_IMAGE_URLS.add(src.trim());
    }
    if (isMountedRef.current) {
      setHasError(true);
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-neutral-50",
        aspectClass,
        containerClassName
      )}
    >
      {badge && <div className="absolute top-3 left-3 z-20 pointer-events-none">{badge}</div>}

      {isInvalidSrc || hasError ? (
        <SnackFallbackIllustration
          className={cn("w-full h-full", className)}
          title={fallbackText || alt}
        />
      ) : (
        <>
          {isLoading && (
            <div className="absolute inset-0 z-10 animate-pulse bg-gradient-to-br from-neutral-100 via-primary-50/40 to-neutral-100" />
          )}

          {fill ? (
            <Image
              src={src!}
              alt={alt || "Kollimalai Arasan Product"}
              fill
              sizes={sizes}
              priority={priority}
              onLoad={handleImageLoad}
              onError={handleImageError}
              className={cn(
                "object-cover transition-opacity duration-300",
                isLoading ? "opacity-0" : "opacity-100",
                className
              )}
            />
          ) : (
            <Image
              src={src!}
              alt={alt || "Kollimalai Arasan Product"}
              width={width || 400}
              height={height || 400}
              sizes={sizes}
              priority={priority}
              onLoad={handleImageLoad}
              onError={handleImageError}
              className={cn(
                "object-cover transition-opacity duration-300",
                isLoading ? "opacity-0" : "opacity-100",
                className
              )}
            />
          )}
        </>
      )}
    </div>
  );
}
