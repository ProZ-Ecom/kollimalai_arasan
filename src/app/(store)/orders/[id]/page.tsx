"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useCustomerOrderDetail,
  useCancelCustomerOrder,
  useRequestCustomerReturn,
} from "@/features/customers/hooks/use-customer-orders";
import { OrderDetailView } from "@/features/orders/components/OrderDetailView";
import { FormModal } from "@/components/common/FormModal";
import { getReturnWindowInfo } from "@/features/customers/components/account/OrdersTab";
import type { OrderStatus } from "@/features/orders/types";

import { toast } from "@/components/ui/Toast";

const CUSTOMER_CANCELLABLE: OrderStatus[] = ["pending", "confirmed"];

const RETURN_REASONS = [
  "Damaged product on delivery",
  "Quality or freshness issue",
  "Wrong item received",
  "Package broken or seal tampered",
  "Other / Customer dissatisfaction",
];

function OrderDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-10 max-w-5xl space-y-6 animate-pulse">
      <div className="h-6 w-36 rounded-lg skeleton-shimmer" />
      <div className="flex justify-between items-center pb-4 border-b border-theme-border-subtle">
        <div className="space-y-2">
          <div className="h-8 w-60 rounded-xl skeleton-shimmer" />
          <div className="h-4 w-40 rounded-lg skeleton-shimmer" />
        </div>
        <div className="h-8 w-24 rounded-full skeleton-shimmer" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-60 rounded-2xl border border-theme-border bg-theme-surface overflow-hidden skeleton-shimmer" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-32 rounded-2xl border border-theme-border bg-theme-surface overflow-hidden skeleton-shimmer" />
            <div className="h-32 rounded-2xl border border-theme-border bg-theme-surface overflow-hidden skeleton-shimmer" />
            <div className="h-32 rounded-2xl border border-theme-border bg-theme-surface overflow-hidden skeleton-shimmer" />
          </div>
        </div>
        <div>
          <div className="h-64 rounded-2xl border border-theme-border bg-theme-surface overflow-hidden skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: session, status } = useSession();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState(RETURN_REASONS[0]);
  const [returnNote, setReturnNote] = useState("");

  const { data: order, isLoading, error, refetch } = useCustomerOrderDetail(id);
  const cancelOrderMutation = useCancelCustomerOrder();
  const returnOrderMutation = useRequestCustomerReturn();

  if (status === "loading" || (isLoading && !order)) {
    return <OrderDetailSkeleton />;
  }

  if (status === "unauthenticated" || !session) {
    router.push(`/login?callbackUrl=/orders/${id}`);
    return null;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-lg text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-200">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-theme-text-primary">Order Not Found</h2>
        <p className="text-xs text-theme-text-subtle">
          {error.message || "We could not find the requested order in your account."}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => router.push("/orders")}
            className="rounded-xl border-theme-border text-xs font-semibold"
          >
            Back to Orders
          </Button>
          <Button
            onClick={() => refetch()}
            className="rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-white text-xs font-bold"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-lg text-center space-y-4">
        <h2 className="text-xl font-bold text-theme-text-primary">Order Not Found</h2>
        <p className="text-xs text-theme-text-subtle">
          This order does not exist or has been removed.
        </p>
        <Button
          onClick={() => router.push("/orders")}
          className="rounded-xl bg-theme-primary text-white text-xs font-bold"
        >
          View All Orders
        </Button>
      </div>
    );
  }

  const canCancel = CUSTOMER_CANCELLABLE.includes(order.status);
  const returnInfo = getReturnWindowInfo(order);
  const canReturn = returnInfo.isEligible;

  const handleReturnSubmit = () => {
    const fullNote = returnNote.trim()
      ? `${returnReason}: ${returnNote.trim()}`
      : returnReason;

    returnOrderMutation.mutate(
      { uuid: order.id, payload: { note: fullNote } },
      {
        onSuccess: () => {
          setReturnOpen(false);
          setReturnNote("");
          toast.success(
            "Return Request Submitted",
            "Our team will review your request. A pickup courier will be assigned once approved."
          );
          refetch();
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to submit return request");
        },
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:py-10 max-w-5xl">
      {/* Back Navigation Bar */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/orders")}
          className="inline-flex items-center gap-2 text-xs font-bold text-theme-text-subtle hover:text-theme-primary transition-colors cursor-pointer py-1.5 px-3 rounded-xl hover:bg-theme-surface-alt"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Orders</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-theme-text-muted">
          <Link href="/" className="hover:text-theme-primary">Home</Link>
          <span>/</span>
          <Link href="/orders" className="hover:text-theme-primary">Orders</Link>
          <span>/</span>
          <span className="font-mono text-theme-primary font-bold">
            {order.orderNumber}
          </span>
        </div>
      </div>

      <OrderDetailView
        order={order}
        canCancel={canCancel}
        isCancelling={cancelOrderMutation.isPending}
        onCancel={() => setCancelOpen(true)}
        canReturn={canReturn}
        isReturning={returnOrderMutation.isPending}
        onRequestReturn={() => setReturnOpen(true)}
      />

      {/* Cancel Order Dialog */}
      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => {
          cancelOrderMutation.mutate(
            { uuid: order.id },
            {
              onSuccess: () => {
                setCancelOpen(false);
                if (order.paymentStatus?.toLowerCase() === "paid") {
                  toast.success(
                    "Order cancelled",
                    "Your refund will be reviewed and credited within 1 week (5–7 business days)."
                  );
                } else {
                  toast.success("Order cancelled successfully");
                }
                refetch();
              },
              onError: (err: any) => {
                toast.error(err?.message || "Failed to cancel order");
              },
            }
          );
        }}
        title="Cancel Order"
        description={
          order.paymentStatus?.toLowerCase() === "paid"
            ? `Are you sure you want to cancel order ${order.orderNumber}? As your payment was already received, your refund of ₹${Number(order.totalAmount).toFixed(2)} will be processed and credited within 1 week (5–7 business days).`
            : `Are you sure you want to cancel order ${order.orderNumber}? Your items will be returned to stock.`
        }
        confirmText="Cancel Order"
        variant="destructive"
        isLoading={cancelOrderMutation.isPending}
      />

      {/* Return Request Modal */}
      <FormModal
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        title={`Request Return for #${order.orderNumber}`}
        description="Select the reason for returning your delivered items. Our team will verify and arrange reverse courier pickup."
        size="md"
      >
        <div className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-text-primary mb-1.5">
              Reason for Return *
            </label>
            <Select
              value={returnReason}
              onValueChange={(val) => setReturnReason(val)}
              options={RETURN_REASONS.map((r) => ({ value: r, label: r }))}
              placeholder="Select a reason for return"
              size="md"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-text-primary mb-1.5">
              Additional Details (Optional)
            </label>
            <textarea
              rows={3}
              value={returnNote}
              onChange={(e) => setReturnNote(e.target.value)}
              placeholder="Describe the issue or condition of the parcel..."
              className="w-full p-3 rounded-xl border border-theme-border bg-theme-surface text-xs text-theme-text-primary focus:border-theme-primary outline-none resize-none"
            />
          </div>

          <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-[11px] text-purple-900 leading-relaxed">
            📦 Once submitted, our team will review your request. After approval, our courier partner (Shiprocket / Express) will schedule doorstep pickup at your delivery address.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-theme-border-subtle">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReturnOpen(false)}
              disabled={returnOrderMutation.isPending}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleReturnSubmit}
              disabled={returnOrderMutation.isPending}
              className="rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs"
            >
              {returnOrderMutation.isPending ? "Submitting..." : "Submit Return Request"}
            </Button>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
