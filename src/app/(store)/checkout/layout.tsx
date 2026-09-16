"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ShoppingBag, MapPin, CreditCard, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CheckoutProvider, useCheckout } from "@/features/checkout/checkout-context";

const STEPS = [
  { key: "cart", label: "Cart", href: "/cart", icon: ShoppingBag },
  { key: "address", label: "Address", href: "/checkout", icon: MapPin },
  { key: "payment", label: "Payment", href: "/checkout", icon: CreditCard },
  { key: "done", label: "Done", href: "#", icon: CheckCircle2 },
];

function getActiveStepIndex(pathname: string): number {
  if (pathname.startsWith("/checkout/success")) {
    return 3; // Done
  }
  if (pathname.startsWith("/checkout")) {
    return 2; // Payment is active, Cart and Address are completed
  }
  return 0; // Cart
}

function CheckoutStepper() {
  const pathname = usePathname();
  const { isOrderPlaced } = useCheckout();
  const isSuccessPage = pathname.startsWith("/checkout/success") || isOrderPlaced;
  const activeIndex = isSuccessPage ? 3 : getActiveStepIndex(pathname);

  return (
    <div className="mx-auto max-w-2xl px-3 py-2">
      <div className="flex items-center justify-between">
        {STEPS.map((step, stepIndex) => {
          // On /checkout: steps 0 (Cart) and 1 (Address) are completed; step 2 (Payment) is active; step 3 is pending
          // On /checkout/success: all steps 0, 1, 2, 3 are completed
          const isDone = isSuccessPage ? true : stepIndex < activeIndex;
          const isActive = !isSuccessPage && stepIndex === activeIndex;
          const canNavigate = step.href !== "#" && stepIndex <= activeIndex;

          return (
            <div
              key={step.key}
              className="flex flex-1 items-center last:flex-none"
            >
              <div className="flex flex-col items-center">
                <Link
                  href={canNavigate ? step.href : "#"}
                  aria-disabled={!canNavigate}
                  className={cn(
                    "group flex flex-col items-center transition-transform",
                    canNavigate ? "cursor-pointer hover:scale-105" : "cursor-default pointer-events-none"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                      isDone
                        ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30"
                        : isActive
                        ? "bg-[#5C1512] text-white shadow-md ring-4 ring-[#5C1512]/20 scale-110"
                        : "bg-theme-surface-alt border-2 border-theme-border text-theme-text-muted"
                    )}
                  >
                    {isDone ? (
                      <Check className="h-4 w-4 stroke-[3]" />
                    ) : (
                      <span>{stepIndex + 1}</span>
                    )}
                  </div>

                  <span
                    className={cn(
                      "mt-1.5 text-xs font-semibold tracking-tight transition-colors",
                      isDone
                        ? "text-emerald-700 font-bold"
                        : isActive
                        ? "text-[#5C1512] font-black"
                        : "text-theme-text-muted"
                    )}
                  >
                    {step.label}
                  </span>
                </Link>
              </div>

              {/* Connecting Bar */}
              {stepIndex < STEPS.length - 1 && (
                <div className="mx-2 sm:mx-4 mb-5 h-1 flex-1 rounded-full bg-theme-border overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isSuccessPage || stepIndex < activeIndex
                        ? "w-full bg-emerald-500"
                        : "w-0"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CheckoutProvider>
      <div className="min-h-screen bg-[#FFFDF9]/60">
        <div className="container mx-auto px-4 pt-6 pb-12 max-w-6xl">
          <div className="mb-6 sm:mb-8">
            <CheckoutStepper />
          </div>
          {children}
        </div>
      </div>
    </CheckoutProvider>
  );
}
