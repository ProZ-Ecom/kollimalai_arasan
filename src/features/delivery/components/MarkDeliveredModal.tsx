"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, PackageCheck } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useMarkDelivered } from "../hooks";

interface MarkDeliveredModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipmentId: string | null;
  orderNumber?: string;
  customerName?: string;
  onSuccess?: () => void;
}

export function MarkDeliveredModal({
  isOpen,
  onClose,
  shipmentId,
  orderNumber,
  customerName,
  onSuccess,
}: MarkDeliveredModalProps) {
  const [note, setNote] = useState("Handed over to customer successfully");
  const markDelivered = useMarkDelivered();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipmentId) return;

    markDelivered.mutate(
      {
        uuid: shipmentId,
        data: { note: note.trim() || undefined },
      },
      {
        onSuccess: () => {
          onSuccess?.();
          onClose();
        },
      }
    );
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Complete Delivery Handover"
      className="max-w-md p-6 bg-white rounded-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm">
          <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-emerald-600 text-white">
            <PackageCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold">Mark Order as Delivered</p>
            <p className="text-xs text-emerald-700">
              {orderNumber ? `Order #${orderNumber}` : "Delivery Shipment"}
              {customerName ? ` • Customer: ${customerName}` : ""}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="delivery-note"
            className="block text-xs font-semibold text-neutral-700"
          >
            Delivery / Handover Note (Optional)
          </label>
          <textarea
            id="delivery-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Handed over to recipient, OTP verified, etc."
            className="w-full rounded-xl border border-neutral-300 p-3 text-sm text-neutral-800 focus:border-secondary-600 focus:outline-none focus:ring-2 focus:ring-secondary-600/10 transition-colors resize-none"
            maxLength={255}
          />
          <div className="flex justify-between text-[11px] text-neutral-400">
            <span>Quick presets:</span>
            <span>{note.length}/255</span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              "Handed over to customer directly",
              "Delivered to security / front desk",
              "Received by family member",
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setNote(preset)}
                className="text-[11px] font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-md px-2 py-1 transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={markDelivered.isPending}
            className="rounded-xl cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={markDelivered.isPending}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
          >
            {markDelivered.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Confirm Delivery
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
