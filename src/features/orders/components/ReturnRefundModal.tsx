"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/common/FormModal";
import { Button } from "@/components/ui/button";
import { useReturnAdminOrder } from "@/features/orders/hooks";
import { formatPrice } from "@/lib/utils";
import {
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Percent,
  HelpCircle,
} from "lucide-react";

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

const PAYMENT_MODES = [
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
  const [selectedPreset, setSelectedPreset] = useState<number | "custom">(100);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<string>(PAYMENT_MODES[0]);
  const [referenceId, setReferenceId] = useState<string>("");
  const [reason, setReason] = useState<string>(PRESET_REASONS[0]);
  const [note, setNote] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const returnOrder = useReturnAdminOrder();

  const totalAmount = order?.totalAmount || 0;

  // Sync amount when order changes or preset changes
  useEffect(() => {
    if (order && open) {
      setSelectedPreset(100);
      setRefundAmount(Number(order.totalAmount || 0).toFixed(2));
      setPaymentMode(PAYMENT_MODES[0]);
      setReferenceId("");
      setReason(
        order.orderStatus === "cancelled"
          ? PRESET_REASONS[0]
          : PRESET_REASONS[1]
      );
      setNote("");
      setValidationError(null);
    }
  }, [order, open]);

  const handleSelectPreset = (preset: number | "custom") => {
    setSelectedPreset(preset);
    setValidationError(null);
    if (preset === "custom") {
      // Keep current amount editable
    } else {
      const calc = (totalAmount * preset) / 100;
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
      setValidationError(
        `Refund cannot exceed order total of ${formatPrice(totalAmount)}.`
      );
    } else {
      setValidationError(null);
    }
  };

  const currentRefundNum = parseFloat(refundAmount) || 0;
  const retainedNum = Math.max(0, totalAmount - currentRefundNum);
  const isPartial = currentRefundNum < totalAmount && currentRefundNum > 0;
  const refundPercent =
    totalAmount > 0 ? Math.round((currentRefundNum / totalAmount) * 100) : 100;

  const handleSubmit = () => {
    if (!order) return;
    if (isNaN(currentRefundNum) || currentRefundNum <= 0) {
      setValidationError("Please enter a valid refund amount.");
      return;
    }
    if (currentRefundNum > totalAmount) {
      setValidationError(
        `Refund cannot exceed order total of ${formatPrice(totalAmount)}.`
      );
      return;
    }

    const finalReason = note.trim()
      ? `${reason}: ${note.trim()}`
      : reason;

    const auditNote = `Admin sent personal refund of ${formatPrice(currentRefundNum)} via ${paymentMode}${
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
          onSuccess();
          onClose();
        },
      }
    );
  };

  if (!order) return null;

  const isCancelled = order.orderStatus === "cancelled";

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={
        isCancelled
          ? `Approve & Record Refund: ${order.orderNumber}`
          : `Process Return & Refund: ${order.orderNumber}`
      }
      description="Record a personal/direct refund sent by admin to the customer (UPI, Bank, Cash, etc.)."
      size="md"
    >
      <div className="space-y-4 pt-1">
        {/* Order Details Banner */}
        <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-3.5 border border-neutral-200">
          <div>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Total Order Amount
            </div>
            <div className="text-xl font-bold text-neutral-900 mt-0.5">
              {formatPrice(totalAmount)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Payment Status
            </div>
            <span
              className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                order.paymentStatus === "paid"
                  ? "bg-emerald-100 text-emerald-800"
                  : order.paymentStatus === "partial_refund"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-neutral-200 text-neutral-800"
              }`}
            >
              {order.paymentStatus?.toUpperCase() || "PAID"}
            </span>
          </div>
        </div>

        {/* Preset Percentage Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
            Select Refund Option
          </label>
          <div className="grid grid-cols-5 gap-2">
            {PRESET_PERCENTAGES.map((preset) => {
              const isSelected = selectedPreset === preset.value;
              return (
                <button
                  key={String(preset.value)}
                  type="button"
                  onClick={() => handleSelectPreset(preset.value)}
                  className={`py-2 px-1 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                    isSelected
                      ? "bg-secondary-600 text-white border-secondary-600 shadow-xs"
                      : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Refund Amount Input & Preview */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
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
              onFocus={(e) => {
                if (e.target.value === "0" || e.target.value === "0.00") {
                  e.target.select();
                }
              }}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-full pl-8 pr-16 py-2 rounded-lg border border-neutral-300 text-neutral-900 font-bold text-base focus:border-secondary-600 focus:ring-1 focus:ring-secondary-600 outline-none"
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

        {/* Payment Mode & Reference / UTR Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
              Admin Payment Mode
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full py-2 px-3 rounded-lg border border-neutral-300 text-xs font-semibold text-neutral-800 focus:border-secondary-600 focus:ring-1 focus:ring-secondary-600 outline-none"
            >
              {PAYMENT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
              UTR / Txn ID (Optional)
            </label>
            <input
              type="text"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder="e.g. UPI Ref / UTR / Txn No."
              className="w-full py-2 px-3 rounded-lg border border-neutral-300 text-xs font-medium text-neutral-800 focus:border-secondary-600 focus:ring-1 focus:ring-secondary-600 outline-none"
            />
          </div>
        </div>

        {/* Refund Breakdown Card */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 space-y-2 text-xs">
          <div className="flex justify-between items-center text-neutral-600">
            <span>Direct Transfer to Customer:</span>
            <span className="font-bold text-rose-600">
              - {formatPrice(currentRefundNum)} ({refundPercent}%)
            </span>
          </div>
          <div className="flex justify-between items-center text-neutral-600">
            <span>Retained by Store:</span>
            <span className="font-bold text-emerald-700">
              + {formatPrice(retainedNum)} ({100 - refundPercent}%)
            </span>
          </div>
          <div className="pt-2 border-t border-neutral-200/80 flex items-start gap-2 text-[11px] text-neutral-500 leading-relaxed">
            <CheckCircle2 className="h-3.5 w-3.5 text-secondary-600 shrink-0 mt-0.5" />
            <span>
              This records the money personally sent by admin via{" "}
              <strong>{paymentMode}</strong>. Order status updates to{" "}
              <strong>{isCancelled ? "Cancelled" : "Returned"}</strong> and payment to{" "}
              <strong>{isPartial ? "Partial Refund" : "Refunded"}</strong>.
            </span>
          </div>
        </div>

        {/* Reason Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
            Refund Reason
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full py-2 px-3 rounded-lg border border-neutral-300 text-xs font-medium text-neutral-800 focus:border-secondary-600 focus:ring-1 focus:ring-secondary-600 outline-none"
          >
            {PRESET_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Admin Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
            Admin Note (Optional)
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add internal notes about the transfer or customer confirmation..."
            className="w-full p-2.5 rounded-lg border border-neutral-300 text-xs text-neutral-800 focus:border-secondary-600 focus:ring-1 focus:ring-secondary-600 outline-none resize-none"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={returnOrder.isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={
              returnOrder.isPending ||
              !!validationError ||
              currentRefundNum <= 0 ||
              currentRefundNum > totalAmount
            }
            className="bg-secondary-600 hover:bg-secondary-700 text-white font-bold"
          >
            {returnOrder.isPending ? (
              "Recording Refund..."
            ) : (
              <>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Confirm Personal Refund ({formatPrice(currentRefundNum)})
              </>
            )}
          </Button>
        </div>
      </div>
    </FormModal>
  );
}
