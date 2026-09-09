"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Heart, ShoppingBag, ArrowRight, RefreshCw, AlertCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WishlistGrid } from "@/features/wishlist/components/WishlistGrid";
import {
  useCustomerWishlist,
  useRemoveCustomerWishlist,
  useMoveCustomerWishlistToCart,
} from "@/features/customers/hooks/use-customer-wishlist";
import { toast } from "@/components/ui/Toast";

function WishlistSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-pulse">
      <div className="mb-8 space-y-2">
        <div className="h-8 w-56 rounded-xl skeleton-shimmer" />
        <div className="h-4 w-72 rounded-lg skeleton-shimmer" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <div
            key={n}
            className="rounded-2xl border border-theme-border bg-theme-surface p-4 space-y-4 overflow-hidden"
          >
            <div className="aspect-square w-full rounded-xl skeleton-shimmer" />
            <div className="space-y-2">
              <div className="h-4 w-3/4 rounded-md skeleton-shimmer" />
              <div className="h-3 w-1/2 rounded-md skeleton-shimmer" />
              <div className="h-5 w-24 rounded-md skeleton-shimmer" />
            </div>
            <div className="h-9 w-full rounded-xl skeleton-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  const {
    data: wishlist,
    isLoading,
    error,
    refetch,
  } = useCustomerWishlist({ enabled: isAuthenticated });

  const removeMutation = useRemoveCustomerWishlist();
  const moveToCartMutation = useMoveCustomerWishlistToCart();

  if (status === "loading" || (isAuthenticated && isLoading && !wishlist)) {
    return <WishlistSkeleton />;
  }

  // Guest prompt without redirect loops
  if (status === "unauthenticated" || !session) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <div className="rounded-3xl border border-theme-border bg-theme-surface p-8 sm:p-10 shadow-xs">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-theme-primary-light text-theme-status-can-fg">
            <Heart className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-theme-text-primary mb-2 font-serif">
            Your Wishlist is Waiting
          </h1>
          <p className="text-sm text-theme-text-subtle mb-8 leading-relaxed">
            Please sign in to view and save your favorite authentic snacks and access them across all your devices.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login?callbackUrl=/wishlist" className="w-full sm:w-auto">
              <Button className="w-full h-11 px-8 rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-fg font-medium text-sm cursor-pointer shadow-xs">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In to View
              </Button>
            </Link>
            <Link href="/products" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full h-11 px-6 rounded-xl border-theme-border-input hover:bg-theme-surface-alt text-theme-text-primary text-sm cursor-pointer"
              >
                Explore Snacks
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-lg text-center">
        <div className="rounded-2xl border border-theme-border bg-theme-surface-alt p-8 shadow-xs">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-theme-primary-light text-theme-status-can-fg">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-theme-text-primary mb-2">
            Unable to Load Wishlist
          </h2>
          <p className="text-sm text-theme-text-subtle mb-6">
            We encountered an issue fetching your saved items.
          </p>
          <Button
            onClick={() => refetch()}
            className="h-10 px-6 rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-fg font-semibold text-sm cursor-pointer"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const items = wishlist?.items ?? [];

  const handleRemove = (variantUuid: string) => {
    setRemovingId(variantUuid);
    removeMutation.mutate(variantUuid, {
      onSuccess: () => {
        toast.success("Removed", "Item removed from your wishlist");
      },
      onError: (err: any) => {
        toast.error("Error", err?.message || "Failed to remove item");
      },
      onSettled: () => setRemovingId(null),
    });
  };

  const handleMoveToCart = (variantUuid: string) => {
    setMovingId(variantUuid);
    moveToCartMutation.mutate(variantUuid, {
      onSuccess: () => {
        toast.success("Moved to Cart", "Item added to your cart successfully");
      },
      onError: (err: any) => {
        toast.error("Error", err?.message || "Failed to move item to cart");
      },
      onSettled: () => setMovingId(null),
    });
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <div className="rounded-3xl border border-theme-border bg-theme-surface p-8 sm:p-10 shadow-xs">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-theme-surface-alt text-theme-text-muted">
            <Heart className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-theme-text-primary mb-2 font-serif">
            Your Wishlist is Empty
          </h1>
          <p className="text-sm text-theme-text-subtle mb-8 leading-relaxed">
            Explore our traditional handmade snacks and save your favorite treats here for later!
          </p>
          <Link href="/products">
            <Button className="h-11 px-8 rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-fg font-medium text-sm cursor-pointer shadow-xs">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Explore All Snacks
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-theme-text-primary font-serif">
            My Wishlist
          </h1>
          <p className="text-sm text-theme-text-subtle mt-1">
            {items.length} {items.length === 1 ? "saved treat" : "saved treats"} ready to order
          </p>
        </div>

        <Link href="/products">
          <Button
            variant="outline"
            className="h-10 px-5 rounded-xl border-theme-border-input hover:bg-theme-surface-alt text-theme-text-primary text-sm cursor-pointer"
          >
            Continue Shopping
          </Button>
        </Link>
      </div>

      <WishlistGrid
        items={items}
        onRemove={handleRemove}
        onMoveToCart={handleMoveToCart}
        removingId={removingId}
        movingId={movingId}
      />
    </div>
  );
}
