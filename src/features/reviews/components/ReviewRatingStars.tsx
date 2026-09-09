"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewRatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: "xs" | "sm" | "md" | "lg";
  showScore?: boolean;
  className?: string;
  count?: number;
}

export function ReviewRatingStars({
  rating,
  maxRating = 5,
  size = "sm",
  showScore = false,
  className,
  count,
}: ReviewRatingStarsProps) {
  const roundedRating = Math.max(0, Math.min(maxRating, Number(rating) || 0));

  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const textClasses = {
    xs: "text-[11px]",
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base font-semibold",
  };

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-0.5" aria-label={`${roundedRating} out of ${maxRating} stars`}>
        {Array.from({ length: maxRating }).map((_, index) => {
          const isFilled = index + 1 <= Math.floor(roundedRating);
          const isHalf = !isFilled && index < roundedRating;

          return (
            <Star
              key={index}
              className={cn(
                sizeClasses[size],
                "transition-colors",
                isFilled
                  ? "fill-amber-400 text-amber-400"
                  : isHalf
                  ? "fill-amber-400/50 text-amber-400"
                  : "fill-neutral-200 text-neutral-300"
              )}
            />
          );
        })}
      </div>

      {showScore && (
        <span className={cn("font-bold text-neutral-900", textClasses[size])}>
          {roundedRating.toFixed(1)}
        </span>
      )}

      {count !== undefined && (
        <span className={cn("text-neutral-400", textClasses[size])}>
          ({count})
        </span>
      )}
    </div>
  );
}
