"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import type { CategoryListItem } from "../types";

interface CategoryCardProps {
  category: CategoryListItem;
}

function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/categories/${category.slug}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {category.image ? (
            <ImageWithFallback
              src={category.image}
              alt={category.name}
              className="h-full w-full transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              No Image
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold group-hover:text-primary transition-colors">
            {category.name}
          </h3>
          {category.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {category.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {category._count?.products || 0} products
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export { CategoryCard };
