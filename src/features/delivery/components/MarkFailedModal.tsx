"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, PackageX } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useMarkFailed } from "../hooks";

interface MarkFailedModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipmentId: string | null;
  orderNumber?: string;
  customerName?: string;
  onSuccess?: () => void;
}

export function MarkFailedModal({
  isOpen,
  onClose,
  shipmentId,
  orderNumber,
  customerName,
  onSuccess,
}: MarkFailedModalProps) {
  const [note, setNote] = useState("");
  const markFailed = useMarkFailed();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipmentId || !note.trim()) return;

    markFailed.mutate(
      {
        uuid: shipmentId,
        data: { note: note.trim() },
      },
      {
        onSuccess: () => {
          setNote("");
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
      title="Mark Delivery as Failed"
      className="max-w-md p-6 bg-white rounded-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-sm">
          <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-rose-600 text-white">
            <PackageX className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold">Delivery Could Not Be Completed</p>
            <p className="text-xs text-rose-700">
              {orderNumber ? `Order #${orderNumber}` : "Delivery Shipment"}
              {customerName ? ` • Customer: ${customerName}` : ""}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="failed-note"
            className="block text-xs font-semibold text-neutral-700"
          >
            Reason for Failure <span className="text-rose-600">*</span>
          </label>
          <textarea
            id="failed-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Customer not available, address not found, etc."
            className="w-full rounded-xl border border-neutral-300 p-3 text-sm text-neutral-800 focus:border-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-600/10 transition-colors resize-none"
            maxLength={255}
            required
          />
          <div className="flex justify-between text-[11px] text-neutral-400">
            <span>Quick presets:</span>
            <span>{note.length}/255</span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              "Customer not available",
              "Customer refused delivery",
              "Address not found",
              "Customer unreachable",
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

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Admin will be notified to decide on reassignment or cancellation.</span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={markFailed.isPending}
            className="rounded-xl cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={markFailed.isPending || !note.trim()}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
          >
            {markFailed.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <PackageX className="h-4 w-4" />
                Confirm Failed
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
