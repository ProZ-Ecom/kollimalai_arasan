"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

function WishlistEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <Heart className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Save your favorite products here. Click the heart icon on any product
        to add it to your wishlist.
      </p>
      <Link href="/products">
        <Button>Browse Products</Button>
      </Link>
    </div>
  );
}

export { WishlistEmpty };
