"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Package,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OrderCard } from "@/features/orders/components/OrderCard";
import { useCustomerOrders } from "@/features/customers/hooks/use-customer-orders";
import { CustomDropdown, type DropdownOption } from "@/features/customers/components/account/CustomDropdown";
import { SearchInput } from "@/components/common/search-input";

const STATUS_FILTER_OPTIONS: DropdownOption[] = [
  { value: "all", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
];

function OrdersListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 pt-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-theme-border bg-theme-surface p-5 space-y-4 animate-pulse overflow-hidden"
        >
          <div className="flex justify-between items-center pb-3 border-b border-theme-border-subtle">
            <div className="h-4 w-32 rounded skeleton-shimmer" />
            <div className="h-6 w-20 rounded-full skeleton-shimmer" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl skeleton-shimmer shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-44 rounded skeleton-shimmer" />
              <div className="h-3 w-28 rounded skeleton-shimmer" />
            </div>
            <div className="h-4 w-16 rounded skeleton-shimmer shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

function OrdersPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-10 max-w-5xl space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-xl skeleton-shimmer" />
          <div className="h-4 w-72 rounded-lg skeleton-shimmer" />
        </div>
        <div className="h-10 w-36 rounded-xl skeleton-shimmer" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="h-11 flex-1 rounded-xl skeleton-shimmer" />
        <div className="h-11 w-full sm:w-48 rounded-xl skeleton-shimmer" />
      </div>

      <OrdersListSkeleton count={3} />
    </div>
  );
}

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isJustPlaced = searchParams.get("placed") === "true";
  const newOrderNumber = searchParams.get("orderNumber");

  const [dismissBanner, setDismissBanner] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: session, status } = useSession();

  const { data, isLoading, error, refetch, isFetching } = useCustomerOrders({
    page,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
  });

  if (status === "loading") {
    return <OrdersPageSkeleton />;
  }

  if (status === "unauthenticated" || !session) {
    router.push("/login?callbackUrl=/orders");
    return null;
  }

  if (isLoading && !data) {
    return <OrdersPageSkeleton />;
  }

  const orders = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="container mx-auto px-4 py-8 sm:py-10 max-w-5xl">
      {/* Newly Placed Success Toast Banner */}
      {isJustPlaced && !dismissBanner && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 sm:p-5 text-emerald-900 shadow-xs animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0 shadow-xs">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-emerald-900">
                    Order Placed Successfully!
                  </h3>
                  {newOrderNumber && (
                    <span className="font-mono text-xs font-bold bg-emerald-200/70 text-emerald-800 px-2 py-0.5 rounded-md">
                      #{newOrderNumber}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-emerald-700 max-w-xl leading-relaxed">
                  Thank you for ordering with Rithu Snacks. We have received your payment and our kitchen has started packing your authentic snacks.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDismissBanner(true)}
              className="text-emerald-700/70 hover:text-emerald-900 p-1 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-theme-text-subtle mb-1.5">
            <Link href="/" className="hover:text-theme-primary transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-theme-primary font-bold">My Orders</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-theme-text-primary flex items-center gap-2.5">
            <span>My Orders</span>
            <span className="text-xs sm:text-sm font-medium text-theme-text-muted bg-theme-surface-alt border border-theme-border px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
              {meta?.total ?? orders.length} {meta?.total === 1 ? "order" : "orders"}
              {isFetching && <RefreshCw className="h-3 w-3 animate-spin text-theme-primary" />}
            </span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-theme-text-subtle">
            Track and manage your authentic South Indian snack orders.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/products">
            <Button
              variant="outline"
              className="min-h-[42px] rounded-xl border-theme-border text-theme-text-primary hover:bg-theme-surface-warm font-semibold text-xs px-4"
            >
              <ShoppingBag className="mr-2 h-4 w-4 text-theme-secondary" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1">
          <SearchInput
            placeholder="Search by order number (e.g. ORD-2026...)"
            value={searchQuery}
            onSearch={(val) => {
              setSearchQuery(val);
              setPage(1);
            }}
            debounceMs={400}
          />
        </div>

        <div className="w-full sm:w-56 shrink-0">
          <CustomDropdown
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            placeholder="Filter by status"
          />
        </div>
      </div>

      {/* Query Error State */}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center space-y-4">
          <p className="text-sm font-semibold text-red-700">
            Failed to load orders. Please try again.
          </p>
          <Button
            onClick={() => refetch()}
            className="rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-white text-xs font-bold px-5"
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      ) : isFetching ? (
        /* Shimmer Loading while API hits on filter or search */
        <OrdersListSkeleton count={3} />
      ) : orders.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-theme-border bg-theme-surface p-8 sm:p-14 text-center shadow-2xs overflow-hidden max-w-full">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-theme-surface-alt border border-theme-border text-theme-primary">
            <Package className="h-8 w-8 text-theme-primary/70" />
          </div>

          <h3 className="text-lg font-bold text-theme-text-primary mb-1 max-w-full break-words [overflow-wrap:anywhere] px-2">
            {searchQuery ? (
              <span>
                No orders matching{" "}
                <span className="text-theme-primary font-black break-all inline">
                  &ldquo;{searchQuery}&rdquo;
                </span>
              </span>
            ) : statusFilter !== "all" ? (
              `No ${statusFilter.replace(/_/g, " ")} orders found`
            ) : (
              "No orders yet"
            )}
          </h3>

          <p className="text-xs sm:text-sm text-theme-text-subtle max-w-sm mx-auto mb-6 break-words [overflow-wrap:anywhere]">
            {searchQuery
              ? "Check your order reference number or clear the search to view all orders."
              : statusFilter !== "all"
              ? `You do not have any orders currently marked as ${statusFilter.replace(/_/g, " ")}.`
              : "When you place an order for our freshly made snacks, it will appear right here with live tracking."}
          </p>

          {searchQuery || statusFilter !== "all" ? (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="rounded-xl border-theme-border text-xs font-bold text-theme-primary hover:bg-theme-surface-warm"
            >
              Clear Filters
            </Button>
          ) : (
            <Link href="/products">
              <Button className="min-h-[44px] rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-white font-bold text-xs px-6">
                <Sparkles className="mr-2 h-4 w-4" />
                Explore Authentic Snacks
              </Button>
            </Link>
          )}
        </div>
      ) : (
        /* Orders List */
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}

          {/* Pagination Controls */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-theme-border-subtle">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
                className="rounded-xl border-theme-border text-xs font-bold text-theme-text-primary hover:bg-theme-surface-warm disabled:opacity-40"
              >
                <ChevronLeft className="mr-1.5 h-3.5 w-3.5" />
                Previous
              </Button>

              <span className="text-xs font-medium text-theme-text-subtle">
                Page <span className="font-bold text-theme-text-primary">{page}</span> of{" "}
                <span className="font-bold text-theme-text-primary">{meta.totalPages}</span>
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages || isFetching}
                className="rounded-xl border-theme-border text-xs font-bold text-theme-text-primary hover:bg-theme-surface-warm disabled:opacity-40"
              >
                Next
                <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersPageSkeleton />}>
      <OrdersContent />
    </Suspense>
  );
}
