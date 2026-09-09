"use client";

import { CategoryCard } from "./CategoryCard";
import { EmptyState } from "@/components/ui/empty-state";
import type { CategoryListItem } from "../types";

interface CategoryGridProps {
  categories: CategoryListItem[];
  emptyMessage?: string;
}

function CategoryGrid({ categories, emptyMessage = "No categories found" }: CategoryGridProps) {
  if (categories.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}

export { CategoryGrid };
