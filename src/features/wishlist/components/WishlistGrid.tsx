"use client";

import { WishlistCard } from "./WishlistCard";
import type { CustomerWishlistItemDto } from "../types/wishlist.types";

interface WishlistGridProps {
  items: CustomerWishlistItemDto[];
  onRemove: (variantUuid: string) => void;
  onMoveToCart?: (variantUuid: string) => void;
  removingId?: string | null;
  movingId?: string | null;
}

export function WishlistGrid({
  items,
  onRemove,
  onMoveToCart,
  removingId,
  movingId,
}: WishlistGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {items.map((item) => (
        <WishlistCard
          key={item.id}
          item={item}
          onRemove={onRemove}
          onMoveToCart={onMoveToCart}
          isRemoving={
            removingId === item.variantUnitPriceId ||
            removingId === item.variantId ||
            removingId === item.id
          }
          isMovingToCart={
            movingId === item.variantUnitPriceId ||
            movingId === item.variantId ||
            movingId === item.id
          }
        />
      ))}
    </div>
  );
}
