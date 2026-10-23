"use client";

import { useState, useEffect, useMemo } from "react";
import { FormModal } from "@/components/common/FormModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import {
  useDeliveryPartners,
  useShipOrderCourier,
  useShipOrderShiprocket,
} from "@/features/orders/hooks";
import {
  Truck,
  Barcode,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  PackageCheck,
  Rocket,
  Sparkles,
  Printer,
} from "lucide-react";

interface ShipOrderModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string | null;
  orderNumber?: string;
  customerName?: string;
  initialPartnerCode?: string;
  initialTrackingNumber?: string;
  onSuccess?: () => void;
}

export function ShipOrderModal({
  open,
  onClose,
  orderId,
  orderNumber,
  customerName,
  initialPartnerCode,
  initialTrackingNumber,
  onSuccess,
}: ShipOrderModalProps) {
  const { data: partners = [], isLoading: partnersLoading } = useDeliveryPartners();
  const shipMutation = useShipOrderCourier();
  const shiprocketMutation = useShipOrderShiprocket();

  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");
  const [shiprocketSuccess, setShiprocketSuccess] = useState<{
    awbCode: string;
    courierName: string;
    labelUrl?: string | null;
  } | null>(null);

  // Default to ST Courier or existing courier
  useEffect(() => {
    if (open) {
      if (initialTrackingNumber) {
        setTrackingNumber(initialTrackingNumber);
      } else {
        setTrackingNumber("");
      }

      setNotes("");
      setValidationError("");
      setShiprocketSuccess(null);

      if (partners.length > 0) {
        const matchedPartner = initialPartnerCode
          ? partners.find(
              (p) =>
                p.code?.toLowerCase() === initialPartnerCode.toLowerCase() ||
                p.name?.toLowerCase().includes(initialPartnerCode.toLowerCase())
            )
          : null;
        const stPartner = partners.find(
          (p) =>
            p.code === "ST_COURIER" ||
            p.name.toLowerCase().includes("st courier")
        );
        setSelectedPartnerId(String(matchedPartner ? matchedPartner.id : stPartner ? stPartner.id : partners[0].id));
      }
    }
  }, [open, partners, initialPartnerCode, initialTrackingNumber]);

  const partnerOptions: SelectOption[] = useMemo(() => {
    return partners.map((partner) => ({
      value: String(partner.id),
      label: `${partner.name} (${partner.code})`,
    }));
  }, [partners]);

  const activePartner = useMemo(() => {
    return partners.find((p) => String(p.id) === String(selectedPartnerId));
  }, [partners, selectedPartnerId]);

  const isShiprocket = useMemo(() => {
    return (
      activePartner?.code === "SHIPROCKET" ||
      activePartner?.name?.toLowerCase().includes("shiprocket")
    );
  }, [activePartner]);

  const handleClose = () => {
    setTrackingNumber("");
    setNotes("");
    setValidationError("");
    setShiprocketSuccess(null);
    onClose();
  };

  const handleShiprocketAutoBook = async () => {
    if (!orderId) return;
    setValidationError("");

    shiprocketMutation.mutate(
      {
        uuid: orderId,
        payload: {
          notes: notes.trim() || undefined,
        },
      },
      {
        onSuccess: (data) => {
          setShiprocketSuccess({
            awbCode: data.awbCode,
            courierName: data.courierName,
            labelUrl: data.labelUrl,
          });
          onSuccess?.();
        },
        onError: (err: any) => {
          setValidationError(
            err.message ||
              "Shiprocket booking failed. Please verify API credentials and wallet balance."
          );
        },
      }
    );
  };

  const handleShip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;

    if (!selectedPartnerId) {
      setValidationError("Please select a courier partner");
      return;
    }

    const trimmedAwb = trackingNumber.trim();
    if (!trimmedAwb || trimmedAwb.length < 3) {
      setValidationError("Please enter a valid AWB / Tracking number (min 3 digits)");
      return;
    }

    setValidationError("");

    shipMutation.mutate(
      {
        uuid: orderId,
        payload: {
          deliveryPartnerId: selectedPartnerId,
          trackingNumber: trimmedAwb,
          notes: notes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          handleClose();
          onSuccess?.();
        },
      }
    );
  };

  // If successfully booked via Shiprocket, show success screen with printable label
  if (shiprocketSuccess) {
    return (
      <FormModal
        open={open}
        onClose={handleClose}
        title="Shiprocket Dispatch Complete"
        description={`Order #${orderNumber || ""} successfully booked and assigned.`}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 font-semibold"
              onClick={handleClose}
            >
              Done
            </Button>
          </div>
        }
      >
        <div className="py-4 space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              Shipment Created with {shiprocketSuccess.courierName}!
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Consignment AWB number generated and doorstep pickup requested.
            </p>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-left space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500">AWB Tracking Code:</span>
              <span className="font-mono font-bold text-neutral-900 text-sm">
                {shiprocketSuccess.awbCode}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500">Assigned Courier:</span>
              <span className="font-semibold text-neutral-800">
                {shiprocketSuccess.courierName}
              </span>
            </div>
          </div>

          {shiprocketSuccess.labelUrl && (
            <div className="pt-2">
              <a
                href={shiprocketSuccess.labelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary-600 hover:bg-secondary-700 text-white font-medium text-xs shadow-sm transition-all"
              >
                <Printer className="h-4 w-4" />
                Print Shipping Label (PDF)
                <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </a>
            </div>
          )}
        </div>
      </FormModal>
    );
  }

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title="Ship Order via Courier"
      description={
        orderNumber
          ? `Add courier dispatch details & live tracking for Order #${orderNumber}${customerName ? ` (${customerName})` : ""}`
          : "Add courier dispatch details & live tracking"
      }
      size="md"
      overflowVisible={true}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            variant="outline"
            type="button"
            onClick={handleClose}
            disabled={shipMutation.isPending || shiprocketMutation.isPending}
            className="h-10 px-5"
          >
            Cancel
          </Button>
          {!isShiprocket && (
            <Button
              type="button"
              className="bg-secondary-600 hover:bg-secondary-700 text-white flex items-center gap-2 h-10 px-6 font-semibold"
              onClick={handleShip}
              disabled={shipMutation.isPending}
            >
              {shipMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Shipping...
                </>
              ) : (
                <>
                  <PackageCheck className="h-4 w-4" />
                  Confirm & Mark Shipped
                </>
              )}
            </Button>
          )}
        </div>
      }
    >
      <form onSubmit={handleShip} className="space-y-6 py-2">
        {validationError && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span className="font-medium">{validationError}</span>
          </div>
        )}

        {shipMutation.error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>
              {(shipMutation.error as any)?.message ||
                "Failed to update shipment tracking. Please try again."}
            </span>
          </div>
        )}

        {/* Courier Partner Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
            Courier Service Partner <span className="text-red-500">*</span>
          </label>
          {partnersLoading ? (
            <div className="h-11 w-full bg-neutral-100 rounded-xl animate-pulse" />
          ) : (
            <Select
              options={partnerOptions}
              value={selectedPartnerId}
              onValueChange={(val) => setSelectedPartnerId(val)}
              placeholder="Select Courier Partner"
              leftIcon={<Truck className="h-4 w-4 text-neutral-400" />}
              size="md"
            />
          )}
        </div>

        {/* Special 1-Click Shiprocket Banner */}
        {isShiprocket ? (
          <div className="rounded-2xl border-2 border-primary-200 bg-gradient-to-br from-primary-50/80 to-amber-50/50 p-4 space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm">
                <Rocket className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                  Automated 1-Click Dispatch via Shiprocket
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                    <Sparkles className="h-3 w-3" /> Recommended
                  </span>
                </h4>
                <p className="text-[11.5px] text-neutral-600 leading-relaxed">
                  Automatically calculates parcel weight, sends order to Shiprocket, assigns the fastest courier (Delhivery, Bluedart, etc.), generates AWB, and generates your printable shipping label.
                </p>
              </div>
            </div>

            <Button
              type="button"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold h-11 rounded-xl shadow-md flex items-center justify-center gap-2"
              onClick={handleShiprocketAutoBook}
              disabled={shiprocketMutation.isPending}
            >
              {shiprocketMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Booking with Shiprocket...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  Auto-Book & Generate Label via Shiprocket
                </>
              )}
            </Button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-neutral-300"></div>
              <span className="flex-shrink mx-3 text-[11px] text-neutral-500 uppercase tracking-wider">
                or enter manual AWB
              </span>
              <div className="flex-grow border-t border-neutral-300"></div>
            </div>

            {/* Manual AWB Input fallback */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                Existing AWB Number
              </label>
              <Input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter AWB if already booked on Shiprocket dashboard"
                className="h-10 rounded-xl font-mono text-xs bg-white text-neutral-900 border-neutral-300"
              />
            </div>
            {trackingNumber && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-9 text-xs font-semibold"
                onClick={handleShip}
                disabled={shipMutation.isPending}
              >
                Save Manual AWB
              </Button>
            )}
          </div>
        ) : (
          /* Standard Manual Tracking / AWB Number Input for ST Courier and MSS */
          <div className="space-y-2">
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
              Tracking / AWB Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                <Barcode className="h-4 w-4" />
              </div>
              <Input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder={
                  activePartner?.code === "MSS"
                    ? "e.g. MSS-LR-94821"
                    : "e.g. 64414926026"
                }
                className="pl-10 h-11 rounded-xl font-mono tracking-wider text-sm font-semibold text-neutral-900 border-neutral-300 focus:border-secondary-500 focus:ring-secondary-500"
                autoFocus
              />
            </div>
            <p className="text-[11.5px] text-neutral-500 pt-0.5">
              {activePartner?.code === "MSS"
                ? "Enter the Mettur Super Services (MSS) LR / Waybill number."
                : "Enter the consignment note / AWB barcode number provided on the ST Courier receipt."}
            </p>
          </div>
        )}

        {/* Optional Notes */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
            Dispatch Notes / Remarks <span className="text-neutral-400 font-normal text-[11px] lowercase">(optional)</span>
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3.5 text-neutral-400 pointer-events-none">
              <FileText className="h-4 w-4" />
            </div>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Dispatched via evening pickup from Kolli Hills branch"
              className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all resize-none"
            />
          </div>
        </div>
      </form>
    </FormModal>
  );
}
