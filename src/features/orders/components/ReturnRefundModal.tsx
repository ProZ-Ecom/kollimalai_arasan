"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { FormModal } from "@/components/common/FormModal";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useReturnAdminOrder } from "@/features/orders/hooks";
import { formatPrice } from "@/lib/utils";
import { ProductImage } from "@/components/common/ProductImage";
import { toast } from "@/components/ui/Toast";
import {
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Percent,
  HelpCircle,
  Rocket,
  Loader2,
  ExternalLink,
  Video,
  Play,
  Pause,
  Lock,
  ClipboardCheck,
  ShieldAlert,
  ArrowRight,
  Package,
  Building2,
  Smartphone,
  Info,
} from "lucide-react";
import type {
  ReturnRequestDetailResponse,
  ReturnRequestStatus,
} from "@/features/returns/types/return.types";

interface ReturnRefundModalProps {
  open: boolean;
  onClose: () => void;
  order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    paymentStatus?: string;
    customerName?: string;
    orderStatus?: string;
    returnRequest?: {
      id: string;
      status: string;
      reason?: string | null;
      returnAwb?: string | null;
      labelUrl?: string | null;
      courierName?: string | null;
    } | null;
  } | null;
  onSuccess: () => void;
}

const PRESET_PERCENTAGES = [
  { label: "100% Full", value: 100 },
  { label: "50% Half", value: 50 },
  { label: "40% Partial", value: 40 },
  { label: "30% Partial", value: 30 },
  { label: "Custom ₹", value: "custom" as const },
];

const PRESET_REASONS = [
  "Customer cancellation - admin approved refund",
  "Partial refund (Quality issue / Customer goodwill)",
  "Customer returned package - items damaged",
  "Incorrect item received by customer",
  "Package returned undelivered by courier",
  "Customer cancellation after delivery",
  "Other admin decision",
];

const COD_PAYMENT_MODES = [
  "UPI (GPay / PhonePe / Paytm / BHIM)",
  "Bank Transfer (NEFT / IMPS / RTGS)",
  "Cash",
  "Other Transfer",
];

export function ReturnRefundModal({
  open,
  onClose,
  order,
  onSuccess,
}: ReturnRefundModalProps) {
  // Detailed Return Request state fetched from backend
  const [returnDetail, setReturnDetail] = useState<ReturnRequestDetailResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  // Shiprocket Doorstep Reverse Pickup state
  const [isBookingPickup, setIsBookingPickup] = useState(false);
  const [pickupSuccess, setPickupSuccess] = useState<{
    returnAwb: string;
    courierName: string;
    labelUrl?: string | null;
  } | null>(null);
  const [pickupError, setPickupError] = useState<string | null>(null);

  // Admin Inspection / Review state
  const [inspectionDecision, setInspectionDecision] = useState<"passed" | "failed">("passed");
  const [inspectionNotes, setInspectionNotes] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState<string | null>(null);

  // Refund Form state
  const [selectedPreset, setSelectedPreset] = useState<number | "custom">(100);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<string>(COD_PAYMENT_MODES[0]);
  const [referenceId, setReferenceId] = useState<string>("");
  const [reason, setReason] = useState<string>(PRESET_REASONS[0]);
  const [note, setNote] = useState<string>("");
  const [restockInventory, setRestockInventory] = useState<boolean>(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  const returnOrder = useReturnAdminOrder();

  const totalAmount = order?.totalAmount || 0;

  // Video playback error state
  const [videoPlaybackError, setVideoPlaybackError] = useState(false);

  // Fetch full return request details whenever modal opens
  const fetchReturnDetails = async (returnId: string) => {
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/returns/${returnId}`);
      if (!res.ok) throw new Error("Failed to load return request details");
      const data = await res.json();
      if (data.success && data.data) {
        const ret: ReturnRequestDetailResponse = data.data;
        setReturnDetail(ret);

        if (ret.returnAwb) {
          setPickupSuccess({
            returnAwb: ret.returnAwb,
            courierName: ret.courierName || "Shiprocket Reverse Courier",
            labelUrl: ret.returnLabelUrl,
          });
        }

        if (ret.adminNotes) {
          setInspectionNotes(ret.adminNotes);
        }

        // Set default refund amount to eligible refund amount
        if (ret.eligibleRefundAmount != null && ret.eligibleRefundAmount > 0) {
          setRefundAmount(ret.eligibleRefundAmount.toFixed(2));
        }

        // Autofill payout method if customer requested one
        if (ret.payoutDetails?.method === "upi") {
          setPaymentMode("UPI (GPay / PhonePe / Paytm / BHIM)");
        } else if (ret.payoutDetails?.method === "bank_transfer") {
          setPaymentMode("Bank Transfer (NEFT / IMPS / RTGS)");
        }
      }
    } catch (err) {
      console.warn("Could not fetch return request details:", err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (order && open) {
      setSelectedPreset(100);
      setRefundAmount(Number(order.totalAmount || 0).toFixed(2));
      setPaymentMode(COD_PAYMENT_MODES[0]);
      setReferenceId("");
      setReason(
        order.orderStatus === "cancelled"
          ? PRESET_REASONS[0]
          : PRESET_REASONS[1]
      );
      setNote("");
      setValidationError(null);
      setVideoPlaybackError(false);
      setReviewSuccessMessage(null);
      setPickupError(null);
      setRestockInventory(true);

      const returnId = order.returnRequest?.id;
      if (returnId) {
        fetchReturnDetails(returnId);
      } else if (order.id) {
        // Check order details to see if returnRequest is present
        fetch(`/api/admin/orders/${order.id}`)
          .then((r) => r.json())
          .then((res) => {
            const ret = res.data?.returnRequest;
            if (ret?.id) {
              fetchReturnDetails(ret.id);
            } else {
              setReturnDetail(null);
            }
          })
          .catch(() => setReturnDetail(null));
      } else {
        setReturnDetail(null);
      }
    }
  }, [order, open]);

  // Handle Shiprocket pickup booking
  const handleBookShiprocketPickup = async () => {
    const returnId = returnDetail?.id || order?.returnRequest?.id;
    if (!returnId) return;
    setIsBookingPickup(true);
    setPickupError(null);

    try {
      const res = await fetch(`/api/admin/returns/${returnId}/shiprocket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error?.message || "Failed to schedule return pickup");
      }
      const retData = data.data || {};
      setPickupSuccess({
        returnAwb: retData.returnAwb || "AWB-CONFIRMED",
        courierName: retData.courierName || "Shiprocket Reverse",
        labelUrl: retData.labelUrl,
      });
      toast.success("Reverse Pickup Booked", "Shiprocket doorstep pickup scheduled.");
      await fetchReturnDetails(returnId);
      onSuccess();
    } catch (err: any) {
      setPickupError(err.message || "Failed to book reverse pickup with Shiprocket");
      toast.error("Pickup Booking Failed", err.message);
    } finally {
      setIsBookingPickup(false);
    }
  };

  // Handle Admin Approve Request (from requested -> approved)
  const handleApproveRequest = async () => {
    const returnId = returnDetail?.id || order?.returnRequest?.id;
    if (!returnId) return;

    try {
      const res = await fetch(`/api/admin/returns/${returnId}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to approve return request");
      toast.success("Return Request Approved", "Request is approved. You can now schedule reverse pickup.");
      await fetchReturnDetails(returnId);
      onSuccess();
    } catch (err: any) {
      toast.error("Approval Failed", err.message);
    }
  };

  // Handle Admin Reject Request
  const handleRejectRequest = async () => {
    const returnId = returnDetail?.id || order?.returnRequest?.id;
    if (!returnId) return;

    try {
      const res = await fetch(`/api/admin/returns/${returnId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() || "Rejected by admin" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reject return request");
      toast.success("Return Request Rejected", "The return request has been rejected.");
      await fetchReturnDetails(returnId);
      onSuccess();
    } catch (err: any) {
      toast.error("Rejection Failed", err.message);
    }
  };

  // Handle Admin Physical Product Inspection Review
  const handleSaveInspection = async () => {
    const returnId = returnDetail?.id || order?.returnRequest?.id;
    if (!returnId) return;

    if (!inspectionNotes.trim() || inspectionNotes.trim().length < 3) {
      setValidationError("Please enter inspection review notes (min 3 characters).");
      return;
    }

    setIsSubmittingReview(true);
    setValidationError(null);

    try {
      const res = await fetch(`/api/admin/returns/${returnId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: inspectionDecision,
          notes: inspectionNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save inspection review");

      toast.success(
        inspectionDecision === "passed"
          ? "Inspection Passed"
          : "Return Inspection Rejected",
        "Physical product review recorded."
      );
      setReviewSuccessMessage(
        inspectionDecision === "passed"
          ? "Physical product inspection passed. You may now authorize the refund below."
          : "Return inspection failed and marked rejected."
      );
      await fetchReturnDetails(returnId);
      onSuccess();
    } catch (err: any) {
      toast.error("Review Failed", err.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Refund Amount calculation
  const eligibleAmount = useMemo(() => {
    if (returnDetail?.eligibleRefundAmount != null && returnDetail.eligibleRefundAmount > 0) {
      return returnDetail.eligibleRefundAmount;
    }
    return totalAmount;
  }, [returnDetail, totalAmount]);

  const handleSelectPreset = (preset: number | "custom") => {
    setSelectedPreset(preset);
    setValidationError(null);
    if (preset !== "custom") {
      const calc = (eligibleAmount * preset) / 100;
      setRefundAmount(calc.toFixed(2));
    }
  };

  const handleAmountChange = (val: string) => {
    setSelectedPreset("custom");
    const clean = val.replace(/^0+(?=\d)/, "");
    setRefundAmount(clean);
    const num = parseFloat(clean);
    if (isNaN(num) || num <= 0) {
      setValidationError("Refund amount must be greater than ₹0.");
    } else if (num > totalAmount) {
      setValidationError(`Refund cannot exceed order total of ${formatPrice(totalAmount)}.`);
    } else if (num > eligibleAmount + 0.01) {
      setValidationError(`Refund cannot exceed eligible return amount of ${formatPrice(eligibleAmount)}.`);
    } else {
      setValidationError(null);
    }
  };

  const currentRefundNum = parseFloat(refundAmount) || 0;
  const retainedNum = Math.max(0, totalAmount - currentRefundNum);
  const refundPercent =
    totalAmount > 0 ? Math.round((currentRefundNum / totalAmount) * 100) : 100;

  // Determine Lifecycle Stage
  const currentStatus: ReturnRequestStatus | string =
    returnDetail?.status || order?.returnRequest?.status || "requested";

  const isDelivered = currentStatus === "delivered";
  const isInspected = Boolean(returnDetail?.inspectedAt);
  const isRefunded =
    currentStatus === "refunded" ||
    order?.paymentStatus === "refunded" ||
    order?.orderStatus === "returned";
  const isRejected = currentStatus === "rejected";

  const isCancelledOrder = order?.orderStatus === "cancelled";
  const isCod = Boolean(returnDetail?.isCod ?? (order?.paymentStatus === "pending"));

  // Check if refund authorization gate is satisfied
  const canAuthorizeRefund = Boolean(
    // Case 1: Cancelled orders can be refunded directly if paid
    isCancelledOrder ||
    // Case 2: Customer returns MUST be delivered and inspected
    (returnDetail && isDelivered && isInspected && !isRefunded && !isRejected)
  );

  // Submit Refund
  const handleProcessRefund = async () => {
    if (!order) return;

    if (isNaN(currentRefundNum) || currentRefundNum <= 0) {
      setValidationError("Please enter a valid refund amount.");
      return;
    }

    if (currentRefundNum > totalAmount) {
      setValidationError(`Refund cannot exceed order total of ${formatPrice(totalAmount)}.`);
      return;
    }

    setIsProcessingRefund(true);
    setValidationError(null);

    const returnId = returnDetail?.id || order.returnRequest?.id;

    try {
      if (returnId && !isCancelledOrder) {
        // Dedicated Return Refund endpoint
        const res = await fetch(`/api/admin/returns/${returnId}/refund`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: currentRefundNum,
            paymentMode,
            referenceId: referenceId.trim() || undefined,
            restockInventory,
            note: note.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || data.error?.message || "Failed to process refund");
        }

        toast.success("Refund Processed", data.message || "Return refund processed successfully.");
        await fetchReturnDetails(returnId);
        onSuccess();
        onClose();
      } else {
        // Fallback or Cancelled Order Refund
        const finalReason = note.trim() ? `${reason}: ${note.trim()}` : reason;
        const auditNote = `Admin sent refund of ${formatPrice(currentRefundNum)} via ${paymentMode}${
          referenceId.trim() ? ` (Ref: ${referenceId.trim()})` : ""
        }${note.trim() ? ` - ${note.trim()}` : ""}`;

        returnOrder.mutate(
          {
            id: order.id,
            amount: currentRefundNum,
            paymentMode,
            referenceId: referenceId.trim() || undefined,
            reason: finalReason,
            note: auditNote,
          },
          {
            onSuccess: () => {
              toast.success("Refund Recorded", "Order refund successfully recorded.");
              onSuccess();
              onClose();
            },
            onError: (err: any) => {
              setValidationError(err.message || "Failed to record refund");
            },
          }
        );
      }
    } catch (err: any) {
      setValidationError(err.message || "Failed to process refund");
      toast.error("Refund Failed", err.message);
    } finally {
      setIsProcessingRefund(false);
    }
  };

  if (!order) return null;

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={
        isCancelledOrder
          ? `Approve & Record Refund: ${order.orderNumber}`
          : `Process Customer Return: ${order.orderNumber}`
      }
      description="Review product condition video, delivery tracking, physical inspection, and authorize refund."
      size="lg"
    >
      <div className="space-y-4 pt-1 max-h-[75vh] overflow-y-auto pr-1">
        {/* Order & Return Status Header Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-neutral-900 text-white p-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-400">
                Order #{order.orderNumber}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  isRefunded
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : isRejected
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : isDelivered
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                }`}
              >
                Return Status: {currentStatus.replace(/_/g, " ")}
              </span>
            </div>
            <div className="text-lg font-extrabold text-white mt-1">
              {formatPrice(totalAmount)}
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="text-neutral-400 block">Payment Method:</span>
            <span className="font-bold text-white">
              {isCod ? "Cash on Delivery (COD)" : "Online Payment (Prepaid)"}
            </span>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Status: <span className="font-semibold text-neutral-200">{order.paymentStatus?.toUpperCase() || "PENDING"}</span>
            </div>
          </div>
        </div>

        {/* SECTION 1: CUSTOMER DETAILS */}
        {returnDetail?.customer && (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3.5 text-xs">
            <p className="font-bold uppercase tracking-wider text-neutral-700 text-[11px] mb-1.5">
              Customer Details
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-neutral-800">
              <div>
                <span className="text-neutral-500 block text-[10px]">Name:</span>
                <span className="font-semibold">{returnDetail.customer.name || "Customer"}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">Phone:</span>
                <span className="font-semibold">{returnDetail.customer.phone || "—"}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">Email:</span>
                <span className="font-semibold truncate block">{returnDetail.customer.email || "—"}</span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: RETURN ITEMS */}
        {returnDetail?.items && returnDetail.items.length > 0 && (
          <div className="rounded-xl border border-neutral-200 bg-white p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="font-bold uppercase tracking-wider text-neutral-700 text-[11px]">
                Returned Items ({returnDetail.items.length})
              </p>
              <span className="text-xs font-extrabold text-emerald-700">
                Eligible Refund: {formatPrice(eligibleAmount)}
              </span>
            </div>

            <div className="divide-y divide-neutral-100">
              {returnDetail.items.map((it) => (
                <div key={it.orderItemId} className="py-2.5 flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                    <ProductImage
                      src={it.primaryImage}
                      alt={it.productName}
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-semibold text-neutral-900 truncate">
                      {it.productName}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {it.variantName || it.sku} · Ordered: {it.orderedQuantity} ·{" "}
                      <strong className="text-emerald-800 font-bold">
                        Returning: {it.returnQuantity} unit{it.returnQuantity === 1 ? "" : "s"}
                      </strong>
                    </p>
                    {it.reason && (
                      <p className="text-[10px] text-neutral-400 italic">
                        Reason: {it.reason}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 text-xs">
                    <span className="font-bold text-neutral-900">
                      {formatPrice(it.refundAmount ?? it.unitPrice * it.returnQuantity)}
                    </span>
                    <p className="text-[10px] text-neutral-400">
                      {formatPrice(it.unitPrice)} / unit
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: PRODUCT-CONDITION VIDEO PLAYER */}
        {returnDetail && (
          <div className="rounded-xl border border-neutral-200 bg-neutral-900 text-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                  Customer Product Condition Video
                </span>
              </div>
              {returnDetail.videoUrl ? (
                <a
                  href={returnDetail.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1"
                >
                  Open in New Tab <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>

            {returnDetail.videoUrl ? (
              <div className="overflow-hidden rounded-xl bg-black border border-neutral-800">
                {!videoPlaybackError ? (
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    src={returnDetail.videoUrl}
                    onError={() => setVideoPlaybackError(true)}
                    className="w-full h-auto max-h-64 object-contain mx-auto"
                  >
                    Your browser does not support HTML5 video playback.
                  </video>
                ) : (
                  <div className="p-8 text-center text-xs space-y-2">
                    <AlertCircle className="mx-auto h-8 w-8 text-amber-400" />
                    <p className="text-neutral-300">
                      Unable to stream video inline in current format.
                    </p>
                    <a
                      href={returnDetail.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs mt-2"
                    >
                      Download or Open Video Link
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-neutral-400 border border-dashed border-neutral-800 rounded-xl space-y-1">
                <AlertCircle className="mx-auto h-6 w-6 text-neutral-500" />
                <p>No condition video was uploaded for this return request.</p>
              </div>
            )}
            <p className="text-[11px] text-neutral-400">
              Inspect the packaging, seal, and product condition before approving return or authorizing refund.
            </p>
          </div>
        )}

        {/* SECTION 4: REVERSE PICKUP VIA SHIPROCKET */}
        {returnDetail && (
          <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-950">
                <Rocket className="h-4 w-4 text-purple-700" />
                <span>Shiprocket Doorstep Reverse Pickup</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-900 uppercase">
                {currentStatus}
              </span>
            </div>

            {pickupError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{pickupError}</span>
              </div>
            )}

            {pickupSuccess || returnDetail.returnAwb ? (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 space-y-2 text-emerald-950">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Pickup Booked ({pickupSuccess?.courierName || returnDetail.courierName || "Courier"})
                  </span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-200 font-bold text-emerald-900">
                    AWB: {pickupSuccess?.returnAwb || returnDetail.returnAwb}
                  </span>
                </div>
                {(pickupSuccess?.labelUrl || returnDetail.returnLabelUrl) && (
                  <a
                    href={pickupSuccess?.labelUrl || returnDetail.returnLabelUrl!}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
                  >
                    Download Return Shipping Label (PDF) <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ) : currentStatus === "requested" ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApproveRequest}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                >
                  Approve Return Request
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleRejectRequest}
                  className="text-red-600 hover:bg-red-50 border-red-200 text-xs font-bold rounded-xl"
                >
                  Reject Return
                </Button>
              </div>
            ) : currentStatus === "approved" ? (
              <Button
                type="button"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold h-9 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
                onClick={handleBookShiprocketPickup}
                disabled={isBookingPickup}
              >
                {isBookingPickup ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Booking Reverse Pickup with Shiprocket...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Book Doorstep Reverse Pickup via Shiprocket
                  </>
                )}
              </Button>
            ) : null}
          </div>
        )}

        {/* SECTION 5: PHYSICAL PRODUCT INSPECTION & REVIEW (MANDATORY BEFORE REFUND) */}
        {!isCancelledOrder && (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-900">
                <ClipboardCheck className="h-4 w-4 text-secondary-600" />
                <span>Physical Product Inspection Review</span>
              </div>
              {isInspected && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Inspected & Approved
                </span>
              )}
            </div>

            {!isDelivered && !isRefunded && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2.5">
                <Lock className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Parcel Not Yet Delivered:</strong> The returned parcel must reach{" "}
                  <strong>&apos;Delivered&apos;</strong> status before physical product inspection can be recorded. Current status is <strong>&apos;{currentStatus}&apos;</strong>.
                </div>
              </div>
            )}

            {isDelivered && !isRefunded && (
              <div className="space-y-3">
                <p className="text-xs text-neutral-600 leading-relaxed">
                  The returned package has been marked delivered. Inspect the actual condition of the returned products and record your review decision below:
                </p>

                <div className="flex items-center gap-4 text-xs font-bold">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="inspectionDecision"
                      value="passed"
                      checked={inspectionDecision === "passed"}
                      onChange={() => setInspectionDecision("passed")}
                      className="accent-emerald-600"
                    />
                    <span className="text-emerald-800">Product Satisfies Policy (Passed)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="inspectionDecision"
                      value="failed"
                      checked={inspectionDecision === "failed"}
                      onChange={() => setInspectionDecision("failed")}
                      className="accent-red-600"
                    />
                    <span className="text-red-700">Damaged / Non-Genuine (Reject)</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Inspection Notes <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={inspectionNotes}
                    onChange={(e) => setInspectionNotes(e.target.value)}
                    placeholder="e.g. Received 2 jars intact with seal broken as reported; approved for refund."
                    className="w-full p-2.5 rounded-lg border border-neutral-300 text-xs text-neutral-800 focus:border-secondary-600 focus:ring-1 focus:ring-secondary-600 outline-none resize-none bg-white"
                  />
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveInspection}
                  disabled={isSubmittingReview || !inspectionNotes.trim()}
                  className="rounded-xl text-xs font-bold bg-neutral-900 text-white hover:bg-neutral-800"
                >
                  {isSubmittingReview ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving Review...
                    </>
                  ) : (
                    "Record Physical Inspection Outcome"
                  )}
                </Button>
              </div>
            )}

            {reviewSuccessMessage && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{reviewSuccessMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* SECTION 6: REFUND AUTHORIZATION & WORKFLOW */}
        {isRefunded ? (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-4 text-emerald-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              Return & Refund Already Completed
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              This return request has already been fully refunded and closed.
            </p>
          </div>
        ) : isRejected ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-red-700">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              Return Request Rejected
            </div>
            <p className="text-xs text-red-700 leading-relaxed">
              This return was rejected. No refund can be authorized.
            </p>
          </div>
        ) : !canAuthorizeRefund ? (
          /* Gated refund alert */
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
              <Lock className="h-5 w-5 text-amber-700 shrink-0" />
              Refund Authorization Locked
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Per return safety policy, a refund cannot be triggered solely because a return request was approved or picked up.
              The returned package must reach <strong>&apos;Delivered&apos;</strong> status and pass <strong>Physical Product Inspection</strong> before a refund can be authorized.
            </p>
          </div>
        ) : (
          /* UNLOCKED REFUND FORM */
          <div className="rounded-xl border border-emerald-200 bg-white p-4 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span>Authorize & Process Refund</span>
              </div>
              <span className="text-[11px] font-bold text-neutral-500">
                Eligible Max: {formatPrice(eligibleAmount)}
              </span>
            </div>

            {/* Presets */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Refund Percentage
              </label>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_PERCENTAGES.map((preset) => {
                  const isSelected = selectedPreset === preset.value;
                  return (
                    <button
                      key={String(preset.value)}
                      type="button"
                      onClick={() => handleSelectPreset(preset.value)}
                      className={`py-1.5 px-1 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Refund Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-neutral-500 text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={totalAmount}
                  value={refundAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="w-full pl-8 pr-16 py-2 rounded-lg border border-neutral-300 text-neutral-900 font-bold text-base focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                  {refundPercent}%
                </span>
              </div>
              {validationError && (
                <p className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 inline" />
                  {validationError}
                </p>
              )}
            </div>

            {/* COD Manual Transfer details OR Razorpay Gateway Notice */}
            {isCod ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                  <Info className="h-4 w-4 text-amber-700" />
                  <span>Cash on Delivery (COD) Manual Refund Workflow</span>
                </div>
                <p className="text-[11.5px] text-amber-900 leading-relaxed">
                  As this order was paid in cash upon delivery, do <strong>not</strong> attempt an online gateway refund.
                  Process a direct payout to the customer&apos;s verified bank/UPI account and record the transaction details below.
                </p>

                {returnDetail?.payoutDetails && (
                  <div className="rounded-lg bg-white p-3 border border-amber-200 text-xs space-y-1">
                    <p className="font-bold text-neutral-900">
                      Customer Requested Payout Destination:
                    </p>
                    {returnDetail.payoutDetails.method === "upi" ? (
                      <p className="font-mono text-emerald-700 font-bold">
                        UPI: {returnDetail.payoutDetails.upiId}
                      </p>
                    ) : (
                      <div className="space-y-0.5 text-neutral-700">
                        <p>Holder: <strong>{returnDetail.payoutDetails.accountHolderName}</strong></p>
                        <p>A/C: <span className="font-mono font-bold">{returnDetail.payoutDetails.accountNumber}</span></p>
                        <p>IFSC: <span className="font-mono font-bold">{returnDetail.payoutDetails.ifscCode}</span></p>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                      Payment Mode
                    </label>
                    <Select
                      value={paymentMode}
                      onValueChange={(val) => setPaymentMode(val)}
                      options={COD_PAYMENT_MODES.map((m) => ({ value: m, label: m }))}
                      size="sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                      UTR / Transaction ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={referenceId}
                      onChange={(e) => setReferenceId(e.target.value)}
                      placeholder="e.g. UPI Ref / Bank UTR No."
                      className="w-full py-2 px-3 rounded-lg border border-neutral-300 text-xs font-medium text-neutral-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none bg-white"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-blue-950">
                  <Info className="h-4 w-4 text-blue-700" />
                  <span>Online Prepaid Refund via Razorpay Gateway</span>
                </div>
                <p className="text-blue-900 leading-relaxed text-[11.5px]">
                  Order was paid online at checkout. Authorizing this refund will initiate a direct refund via the payment gateway to the original customer account.
                </p>
                <div className="pt-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Gateway Reference ID (Optional override)
                  </label>
                  <input
                    type="text"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    placeholder="Auto-generated by gateway or enter reference"
                    className="w-full py-1.5 px-3 rounded-lg border border-neutral-300 text-xs font-medium text-neutral-800 bg-white"
                  />
                </div>
              </div>
            )}

            {/* Restock Inventory Checkbox */}
            <label className="flex items-center gap-2.5 text-xs text-neutral-800 font-semibold cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={restockInventory}
                onChange={(e) => setRestockInventory(e.target.checked)}
                className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
              />
              <span>Restock inspected returned items to available inventory</span>
            </label>

            {/* Internal Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Admin Audit Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Internal audit trail notes for accounting records..."
                className="w-full p-2.5 rounded-lg border border-neutral-300 text-xs text-neutral-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none resize-none"
              />
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isProcessingRefund || returnOrder.isPending}
            className="rounded-xl text-xs font-semibold"
          >
            {isRefunded || isRejected ? "Close" : "Cancel"}
          </Button>

          {canAuthorizeRefund && (
            <Button
              size="sm"
              onClick={handleProcessRefund}
              disabled={
                isProcessingRefund ||
                returnOrder.isPending ||
                !!validationError ||
                currentRefundNum <= 0 ||
                (isCod && !referenceId.trim())
              }
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs px-4 cursor-pointer disabled:opacity-50"
            >
              {isProcessingRefund || returnOrder.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Processing Refund...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Authorize & Process Refund ({formatPrice(currentRefundNum)})
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </FormModal>
  );
}
