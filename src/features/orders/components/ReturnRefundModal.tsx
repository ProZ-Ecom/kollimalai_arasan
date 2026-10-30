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
  CreditCard,
  Copy,
  Check,
  Banknote,
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

const MANUAL_PAYMENT_MODES = [
  "UPI (GPay / PhonePe / Paytm / BHIM)",
  "Bank Transfer (NEFT / IMPS / RTGS)",
  "Cash",
  "Other Manual Transfer",
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
  const [refundMethod, setRefundMethod] = useState<"gateway" | "manual">("gateway");
  const [paymentMode, setPaymentMode] = useState<string>(MANUAL_PAYMENT_MODES[0]);
  const [referenceId, setReferenceId] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [reason, setReason] = useState<string>(PRESET_REASONS[0]);
  const [note, setNote] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

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

        // Autofill payout method and method preference if customer requested one
        if (ret.isCod) {
          setRefundMethod("manual");
        }
        if (ret.payoutDetails?.method === "upi") {
          setPaymentMode("UPI (GPay / PhonePe / Paytm / BHIM)");
        } else if (ret.payoutDetails?.method === "bank_transfer") {
          setPaymentMode("Bank Transfer (NEFT / IMPS / RTGS)");
        } else if (ret.isCod) {
          setPaymentMode(MANUAL_PAYMENT_MODES[0]);
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
      const orderIsCod = Boolean(
        order.paymentStatus === "pending" || (order as any).isCod
      );
      setRefundMethod(orderIsCod ? "manual" : "gateway");
      setPaymentMode(orderIsCod ? MANUAL_PAYMENT_MODES[0] : "Razorpay Gateway Refund");
      setReferenceId("");
      setCopiedField(null);
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

    const selectedMode =
      refundMethod === "gateway"
        ? "Razorpay Gateway Refund"
        : paymentMode || MANUAL_PAYMENT_MODES[0];

    try {
      if (returnId && !isCancelledOrder) {
        // Dedicated Return Refund endpoint
        const res = await fetch(`/api/admin/returns/${returnId}/refund`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: currentRefundNum,
            refundMethod,
            paymentMode: selectedMode,
            referenceId: referenceId.trim() || undefined,
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
        const auditNote = `Admin processed ${refundMethod === "gateway" ? "gateway" : "manual"} refund of ${formatPrice(currentRefundNum)} via ${selectedMode}${
          referenceId.trim() ? ` (Ref: ${referenceId.trim()})` : ""
        }${note.trim() ? ` - ${note.trim()}` : ""}`;

        returnOrder.mutate(
          {
            id: order.id,
            amount: currentRefundNum,
            paymentMode: selectedMode,
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

        {/* SECTION 1B: CUSTOMER REFUND / PAYOUT TRANSFER DETAILS */}
        {returnDetail?.payoutDetails ? (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 p-4 text-xs space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  {returnDetail.payoutDetails.method === "upi" ? (
                    <Smartphone className="h-4 w-4" />
                  ) : (
                    <Building2 className="h-4 w-4" />
                  )}
                </span>
                <div>
                  <h4 className="font-bold text-neutral-900 text-xs sm:text-sm">
                    Customer Refund Transfer Details
                  </h4>
                  <p className="text-[11px] text-neutral-500 font-normal">
                    {returnDetail.payoutDetails.method === "upi"
                      ? "Customer requested refund via Instant UPI Transfer"
                      : "Customer requested refund via Bank Account Transfer (IMPS/NEFT)"}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wide">
                {returnDetail.payoutDetails.method === "upi" ? "UPI ID" : "Bank Account"}
              </span>
            </div>

            {returnDetail.payoutDetails.method === "upi" ? (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-emerald-200">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                    Customer UPI ID / VPA
                  </span>
                  <span className="font-mono font-bold text-emerald-950 text-sm">
                    {returnDetail.payoutDetails.upiId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(returnDetail.payoutDetails?.upiId || "", "upi_banner")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary-700 hover:text-secondary-900 bg-secondary-50 hover:bg-secondary-100 px-3 py-1.5 rounded-lg border border-secondary-200 transition-colors cursor-pointer"
                >
                  {copiedField === "upi_banner" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied UPI!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy UPI ID
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-white rounded-xl border border-emerald-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                    Account Holder Name
                  </span>
                  <span className="font-semibold text-neutral-900 text-xs">
                    {returnDetail.payoutDetails.accountHolderName || "—"}
                  </span>
                </div>
                {returnDetail.payoutDetails.bankName && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                      Bank Name
                    </span>
                    <span className="font-semibold text-neutral-900 text-xs">
                      {returnDetail.payoutDetails.bankName}
                    </span>
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                      Bank Account Number
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(returnDetail.payoutDetails?.accountNumber || "", "acct_banner")}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-secondary-700 hover:underline cursor-pointer"
                    >
                      {copiedField === "acct_banner" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      {copiedField === "acct_banner" ? "Copied" : "Copy Account No"}
                    </button>
                  </div>
                  <span className="font-mono font-bold text-neutral-900 text-xs sm:text-sm">
                    {returnDetail.payoutDetails.accountNumber}
                  </span>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                      IFSC Code
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(returnDetail.payoutDetails?.ifscCode || "", "ifsc_banner")}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-secondary-700 hover:underline cursor-pointer"
                    >
                      {copiedField === "ifsc_banner" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      {copiedField === "ifsc_banner" ? "Copied" : "Copy IFSC"}
                    </button>
                  </div>
                  <span className="font-mono font-bold text-neutral-900 text-xs sm:text-sm">
                    {returnDetail.payoutDetails.ifscCode}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : !isCancelledOrder && (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 text-xs text-neutral-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-neutral-400 shrink-0" />
              <span>
                {isCod
                  ? "No manual payout details recorded for this return request."
                  : "Customer paid online via Razorpay. Online gateway refund reverses funds directly to customer's card/bank."}
              </span>
            </div>
            {!isCod && (
              <span className="text-[10px] font-semibold text-neutral-500 uppercase bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                Prepaid Order
              </span>
            )}
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

            {/* REFUND METHOD SELECTION (Prepaid Orders can choose between Gateway vs Manual; COD is always Manual) */}
            {!isCod ? (
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Refund Method / Channel
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: Automatic Gateway Refund */}
                  <div
                    onClick={() => {
                      setRefundMethod("gateway");
                      setPaymentMode("Razorpay Gateway Refund");
                    }}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      refundMethod === "gateway"
                        ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20 shadow-xs"
                        : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/60"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-lg ${
                            refundMethod === "gateway"
                              ? "bg-emerald-600 text-white"
                              : "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-neutral-900 block">
                            Online Gateway Refund
                          </span>
                          <span className="text-[10px] font-semibold text-neutral-500">
                            Automatic Source Reversal (Razorpay)
                          </span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="refundMethod"
                        checked={refundMethod === "gateway"}
                        onChange={() => {
                          setRefundMethod("gateway");
                          setPaymentMode("Razorpay Gateway Refund");
                        }}
                        className="accent-emerald-600 h-4 w-4 mt-0.5 cursor-pointer"
                      />
                    </div>
                    <p className="text-[11px] text-neutral-600 mt-2.5 leading-relaxed">
                      Reverses the amount directly back to the customer&apos;s original online payment method via Razorpay.
                    </p>
                  </div>

                  {/* Option 2: Manual Direct Payout */}
                  <div
                    onClick={() => {
                      setRefundMethod("manual");
                      setPaymentMode(MANUAL_PAYMENT_MODES[0]);
                    }}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      refundMethod === "manual"
                        ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20 shadow-xs"
                        : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/60"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-lg ${
                            refundMethod === "manual"
                              ? "bg-emerald-600 text-white"
                              : "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          <Smartphone className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-neutral-900 block">
                            Manual Direct Transfer
                          </span>
                          <span className="text-[10px] font-semibold text-neutral-500">
                            UPI / Bank / Cash Payout by Admin
                          </span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="refundMethod"
                        checked={refundMethod === "manual"}
                        onChange={() => {
                          setRefundMethod("manual");
                          setPaymentMode(MANUAL_PAYMENT_MODES[0]);
                        }}
                        className="accent-emerald-600 h-4 w-4 mt-0.5 cursor-pointer"
                      />
                    </div>
                    <p className="text-[11px] text-neutral-600 mt-2.5 leading-relaxed">
                      Admin manually transfers funds to customer (GPay / PhonePe / Bank / Cash) and enters reference ID here.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 flex items-center gap-2.5 text-xs text-amber-950 font-medium">
                <Building2 className="h-4 w-4 text-amber-700 shrink-0" />
                <span>
                  <strong>Cash on Delivery (COD) Order:</strong> Customer paid in cash upon delivery. Manual direct transfer (UPI / Bank / Cash) is used to process this refund.
                </span>
              </div>
            )}

            {/* DETAILS BASED ON SELECTED REFUND METHOD */}
            {refundMethod === "manual" || isCod ? (
              <div className="rounded-xl border border-amber-200/90 bg-amber-50/60 p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                    <Banknote className="h-4 w-4 text-amber-700" />
                    <span>Manual Payout Information</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900">
                    Admin Direct Transfer
                  </span>
                </div>

                {/* Customer Provided Payout Destination (if any) */}
                {returnDetail?.payoutDetails && (
                  <div className="rounded-xl bg-white p-3.5 border border-amber-200 text-xs space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-800 flex items-center gap-1.5">
                        <Smartphone className="h-3.5 w-3.5 text-amber-600" />
                        Customer Requested Payout Destination:
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-400">
                        Provided by Customer
                      </span>
                    </div>

                    {returnDetail.payoutDetails.method === "upi" ? (
                      <div className="flex items-center justify-between gap-2 p-2 bg-neutral-50 rounded-lg border border-neutral-200 font-mono text-xs">
                        <span className="font-bold text-emerald-800">
                          UPI ID: {returnDetail.payoutDetails.upiId}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(returnDetail.payoutDetails?.upiId || "", "upi")}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-secondary-600 hover:text-secondary-800 bg-white px-2 py-0.5 rounded border border-neutral-300 hover:bg-neutral-100 transition-colors cursor-pointer"
                        >
                          {copiedField === "upi" ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> Copy UPI
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5 text-neutral-700 p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 text-xs">
                        <div className="flex justify-between items-center">
                          <span>A/C Holder: <strong>{returnDetail.payoutDetails.accountHolderName}</strong></span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span>A/C No: <strong className="font-mono text-neutral-900">{returnDetail.payoutDetails.accountNumber}</strong></span>
                          <button
                            type="button"
                            onClick={() => handleCopy(returnDetail.payoutDetails?.accountNumber || "", "acct")}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-secondary-600 hover:text-secondary-800 bg-white px-2 py-0.5 rounded border border-neutral-300 hover:bg-neutral-100 transition-colors cursor-pointer"
                          >
                            {copiedField === "acct" ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" /> Copy A/C
                              </>
                            )}
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>IFSC Code: <strong className="font-mono text-neutral-900">{returnDetail.payoutDetails.ifscCode}</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Form Fields: Payout Channel + Transaction ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                      Payout Channel / Mode
                    </label>
                    <Select
                      value={paymentMode}
                      onValueChange={(val) => setPaymentMode(val)}
                      options={MANUAL_PAYMENT_MODES.map((m) => ({ value: m, label: m }))}
                      size="sm"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                        Transaction ID / UTR No.
                      </label>
                      <span className="text-[10px] font-semibold text-neutral-500 bg-white px-1.5 py-0.2 rounded border border-neutral-200">
                        Optional
                      </span>
                    </div>
                    <input
                      type="text"
                      value={referenceId}
                      onChange={(e) => setReferenceId(e.target.value)}
                      placeholder="e.g. UPI Ref / Bank UTR No."
                      className="w-full py-2 px-3 rounded-lg border border-neutral-300 text-xs font-mono font-medium text-neutral-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none bg-white placeholder:font-sans placeholder:text-neutral-400"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-amber-900/80 leading-relaxed">
                  Transfer the refund manually to the customer, then enter the transaction reference / UTR number above so it is logged in order audit history.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-blue-950">
                  <Info className="h-4 w-4 text-blue-700" />
                  <span>Online Prepaid Refund via Razorpay Gateway</span>
                </div>
                <p className="text-blue-900 leading-relaxed text-[11.5px]">
                  Order was paid online at checkout. Authorizing this refund will request a direct reversal from the Razorpay payment gateway to the original customer bank/card.
                </p>
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                      Gateway Reference ID
                    </label>
                    <span className="text-[10px] font-semibold text-neutral-500 bg-white px-1.5 py-0.2 rounded border border-neutral-200">
                      Optional override
                    </span>
                  </div>
                  <input
                    type="text"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    placeholder="Auto-generated by gateway or enter reference"
                    className="w-full py-1.5 px-3 rounded-lg border border-neutral-300 text-xs font-mono font-medium text-neutral-800 bg-white placeholder:font-sans placeholder:text-neutral-400"
                  />
                </div>
              </div>
            )}

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
                currentRefundNum <= 0
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
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  {refundMethod === "manual" || isCod
                    ? `Record Manual Refund (${formatPrice(currentRefundNum)})`
                    : `Authorize Gateway Refund (${formatPrice(currentRefundNum)})`}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </FormModal>
  );
}
