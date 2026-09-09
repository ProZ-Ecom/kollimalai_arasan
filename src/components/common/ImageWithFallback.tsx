"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SnackFallbackIllustration } from "./ProductImage";

interface ImageWithFallbackProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string | null | undefined;
  fallbackSrc?: string;
  fallbackClassName?: string;
}

const ImageWithFallback = React.forwardRef<HTMLDivElement, ImageWithFallbackProps>(
  ({ src, alt = "", className, fallbackClassName, ...props }, ref) => {
    const [imgSrc, setImgSrc] = React.useState(src);
    const [hasError, setHasError] = React.useState(false);

    React.useEffect(() => {
      setImgSrc(src);
      setHasError(false);
    }, [src]);

    if (hasError || !imgSrc) {
      return (
        <div
          ref={ref}
          className={cn(
            "flex items-center justify-center overflow-hidden",
            className,
            fallbackClassName
          )}
          {...props}
        >
          <SnackFallbackIllustration className="w-full h-full" title={alt} />
        </div>
      );
    }

    return (
      <div ref={ref} className={cn("relative overflow-hidden", className)}>
        <img
          src={imgSrc}
          alt={alt}
          onError={() => setHasError(true)}
          className="h-full w-full object-cover"
          loading="lazy"
          {...props}
        />
      </div>
    );
  }
);
ImageWithFallback.displayName = "ImageWithFallback";

export { ImageWithFallback };
export type { ImageWithFallbackProps };
