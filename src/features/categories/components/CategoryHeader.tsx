"use client";

import { cn } from "@/lib/utils";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import type { CategoryDetail } from "../types";

interface CategoryHeaderProps {
  category: CategoryDetail;
  className?: string;
}

function CategoryHeader({ category, className }: CategoryHeaderProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-gray-50", className)}>
      {category.image && (
        <div className="absolute inset-0">
          <ImageWithFallback
            src={category.image}
            alt={category.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
        </div>
      )}
      <div className="relative px-6 py-10 sm:px-10 sm:py-14">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-3 max-w-2xl text-gray-600">
            {category.description}
          </p>
        )}
        <p className="mt-2 text-sm text-gray-500">
          {category._count?.products || 0} products
        </p>
      </div>
    </div>
  );
}

export { CategoryHeader };
