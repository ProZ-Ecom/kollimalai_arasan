"use client";

import Link from "next/link";
import { ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

function CartEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-theme-border bg-theme-surface shadow-xs max-w-2xl mx-auto my-6">
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-full bg-theme-surface-alt border border-theme-border-subtle flex items-center justify-center text-theme-primary shadow-2xs">
          <ShoppingBag className="h-10 w-10 text-theme-primary" />
        </div>
        <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-theme-secondary text-theme-primary-fg">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
      </div>

      <h2 className="text-2xl font-bold text-theme-text-primary mb-2">
        Your Snack Box is Empty
      </h2>
      <p className="text-sm text-theme-text-subtle mb-8 max-w-md leading-relaxed">
        You haven&apos;t added any traditional South Indian snacks to your cart yet.
        Explore our authentic crunchy banana chips, kai murukku, mixture, and more!
      </p>

      <Link href="/products">
        <Button className="h-11 px-6 rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-fg font-bold text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer">
          <span>Explore Authentic Snacks</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}

export { CartEmpty };

