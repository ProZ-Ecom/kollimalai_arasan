"use client";

import { useState, useEffect, useMemo } from "react";
import { FormModal } from "@/components/common/FormModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ShipOrderModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string | null;
  orderNumber?: string;
  customerName?: string;
  initialPartnerCode?: string;
  initialTrackingNumber?: string;
  isCod?: boolean;
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
  isCod,
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

  // Default to Shiprocket for COD, or ST Courier / existing courier for prepaid
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
        const shiprocketPartner = partners.find(
          (p) =>
            p.code?.toUpperCase() === "SHIPROCKET" ||
            p.code?.toUpperCase() === "SHIPROCKET_MOCK" ||
            p.name.toLowerCase().includes("shiprocket")
        );
        const mssPartner = partners.find(
          (p) =>
            p.code?.toUpperCase() === "MSS" ||
            p.name.toLowerCase().includes("mettur") ||
            p.name.toLowerCase().includes("mss")
        );
        const stPartner = partners.find(
          (p) =>
            p.code === "ST_COURIER" ||
            p.name.toLowerCase().includes("st courier")
        );

        let targetPartner = null;
        if (isCod) {
          targetPartner = shiprocketPartner;
        } else if (initialPartnerCode) {
          const codeUpper = initialPartnerCode.toUpperCase();
          if (codeUpper.includes("SHIPROCKET")) {
            targetPartner = shiprocketPartner;
          } else if (codeUpper.includes("MSS")) {
            targetPartner = mssPartner;
          } else if (codeUpper.includes("ST_COURIER") || codeUpper === "ST") {
            targetPartner = stPartner;
          } else {
            targetPartner = partners.find(
              (p) =>
                p.code?.toLowerCase() === initialPartnerCode.toLowerCase() ||
                p.name?.toLowerCase().includes(initialPartnerCode.toLowerCase())
            );
          }
        }

        if (!targetPartner) {
          targetPartner = stPartner || partners[0];
        }

        if (targetPartner) {
          setSelectedPartnerId(String(targetPartner.id));
        }
      }
    }
  }, [open, partners, initialPartnerCode, initialTrackingNumber, isCod]);

  // Keep partner locked to Shiprocket if order is COD
  useEffect(() => {
    if (isCod && partners.length > 0) {
      const shiprocketPartner = partners.find(
        (p) =>
          p.code?.toUpperCase() === "SHIPROCKET" ||
          p.code?.toUpperCase() === "SHIPROCKET_MOCK" ||
          p.name.toLowerCase().includes("shiprocket")
      );
      if (
        shiprocketPartner &&
        String(selectedPartnerId) !== String(shiprocketPartner.id)
      ) {
        setSelectedPartnerId(String(shiprocketPartner.id));
      }
    }
  }, [isCod, partners, selectedPartnerId]);

  const activePartner = useMemo(() => {
    return partners.find((p) => String(p.id) === String(selectedPartnerId));
  }, [partners, selectedPartnerId]);

  const isShiprocket = useMemo(() => {
    return Boolean(
      activePartner?.code?.toUpperCase().includes("SHIPROCKET") ||
      activePartner?.name?.toLowerCase().includes("shiprocket") ||
      initialPartnerCode?.toUpperCase().includes("SHIPROCKET") ||
      isCod
    );
  }, [activePartner, initialPartnerCode, isCod]);

  const isMss = useMemo(() => {
    return Boolean(
      activePartner?.code?.toUpperCase() === "MSS" ||
      activePartner?.name?.toLowerCase().includes("mettur") ||
      activePartner?.name?.toLowerCase().includes("mss") ||
      initialPartnerCode?.toUpperCase().includes("MSS")
    );
  }, [activePartner, initialPartnerCode]);

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

    if (isCod && !isShiprocket) {
      setValidationError(
        "This order was placed with Cash on Delivery (COD). COD orders must be assigned to Shiprocket Express."
      );
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
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2.5 sm:gap-3 w-full">
          <Button
            variant="outline"
            type="button"
            onClick={handleClose}
            disabled={shipMutation.isPending || shiprocketMutation.isPending}
            className="h-9 sm:h-10 px-4 sm:px-5 text-xs sm:text-sm font-medium"
          >
            Cancel
          </Button>
          {!isShiprocket && (
            <Button
              type="button"
              className="bg-secondary-600 hover:bg-secondary-700 text-white flex items-center gap-2 h-9 sm:h-10 px-5 sm:px-6 text-xs sm:text-sm font-semibold shadow-xs"
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
      <form onSubmit={handleShip} className="space-y-4 sm:space-y-5 py-1">
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

        {/* COD Notice Banner */}
        {isCod && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Cash on Delivery (COD) Order:</span> This customer selected Cash on Delivery. ST Courier and MSS Cargo do not support Cash on Delivery. The courier service is restricted exclusively to <strong>Shiprocket Express</strong>.
            </div>
          </div>
        )}

        {/* Courier Service Partner (Locked to Customer's Selection) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
              Courier Service Partner <span className="text-neutral-400 font-normal text-[11px] lowercase">(locked to order)</span>
            </label>
            {isCod ? (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full shrink-0">
                Shiprocket Only (COD)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-secondary-800 bg-secondary-50 border border-secondary-200 px-2.5 py-0.5 rounded-full shrink-0">
                <Lock className="h-3 w-3 text-secondary-600" />
                Customer Choice
              </span>
            )}
          </div>
          {partnersLoading ? (
            <div className="h-14 w-full bg-neutral-100 rounded-xl animate-pulse" />
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/80">
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-xs border mt-0.5 sm:mt-0",
                    isShiprocket
                      ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                      : isMss
                      ? "bg-blue-50 border-blue-200 text-blue-600"
                      : "bg-amber-50 border-amber-200 text-secondary-600"
                  )}
                >
                  {isShiprocket ? (
                    <Rocket className="h-5 w-5" />
                  ) : (
                    <Truck className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-neutral-900 flex items-center gap-1.5 flex-wrap">
                    <span>
                      {activePartner?.name || (isShiprocket ? "Shiprocket Express" : isMss ? "Mettur Super Services (MSS)" : "ST Courier")}
                    </span>
                    <span className="text-[10px] font-semibold text-neutral-500 bg-white border border-neutral-200 px-1.5 py-0.5 rounded font-mono shrink-0">
                      {activePartner?.code || (isShiprocket ? "SHIPROCKET" : isMss ? "MSS" : "ST_COURIER")}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                    {isShiprocket
                      ? "Order will be dispatched using Shiprocket Multi-Carrier API."
                      : isMss
                      ? "Dispatched via Mettur Super Services (MSS) parcel branch."
                      : "Dispatched via ST Courier South Express delivery."}
                  </p>
                </div>
              </div>
              <span className="self-start sm:self-center text-[10px] font-semibold text-neutral-500 bg-white border border-neutral-200 px-2 py-1 rounded-md shrink-0">
                Authoritative Courier
              </span>
            </div>
          )}
        </div>

        {/* Special 1-Click Shiprocket Banner */}
        {isShiprocket ? (
          <div className="rounded-xl sm:rounded-2xl border-2 border-primary-200 bg-gradient-to-br from-primary-50/80 to-amber-50/50 p-3.5 sm:p-4 space-y-3 sm:space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm mt-0.5">
                <Rocket className="h-5 w-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900">
                    Automated 1-Click Dispatch via Shiprocket
                  </h4>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                    <Sparkles className="h-3 w-3" /> Recommended
                  </span>
                </div>
                <p className="text-[11px] sm:text-[11.5px] text-neutral-600 leading-relaxed">
                  Automatically calculates parcel weight, sends order to Shiprocket, assigns the fastest courier (Delhivery, Bluedart, etc.), generates AWB, and generates your printable shipping label.
                </p>
              </div>
            </div>

            <Button
              type="button"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold h-10 sm:h-11 rounded-xl shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
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
              <span className="flex-shrink mx-3 text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">
                or enter manual AWB
              </span>
              <div className="flex-grow border-t border-neutral-300"></div>
            </div>

            {/* Manual AWB Input fallback */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                Existing AWB Number
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter AWB if already booked on Shiprocket dashboard"
                  className="h-10 rounded-xl font-mono text-xs bg-white text-neutral-900 border-neutral-300 flex-1"
                />
                {trackingNumber.trim() && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 px-4 text-xs font-semibold shrink-0 bg-white hover:bg-neutral-50 border-neutral-300"
                    onClick={handleShip}
                    disabled={shipMutation.isPending}
                  >
                    Save Manual AWB
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Standard Manual Tracking / AWB Number Input for ST Courier and MSS */
          <div className="space-y-2">
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
              {isMss ? "MSS LR / Waybill Number" : "ST Courier Tracking / AWB Number"} <span className="text-red-500">*</span>
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
                  isMss
                    ? "e.g. MSS-LR-94821"
                    : "e.g. 64414926026"
                }
                className="pl-10 h-10 sm:h-11 rounded-xl font-mono tracking-wider text-xs sm:text-sm font-semibold text-neutral-900 border-neutral-300 focus:border-secondary-500 focus:ring-secondary-500"
                autoFocus
              />
            </div>
            <p className="text-[11px] sm:text-[11.5px] text-neutral-500 pt-0.5">
              {isMss
                ? "Enter the Mettur Super Services (MSS) LR / Waybill number."
                : "Enter the consignment note / AWB barcode number provided on the ST Courier receipt."}
            </p>
          </div>
        )}

        {/* Optional Notes */}
        <div className="space-y-1.5">
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
              className="w-full pl-10 pr-3.5 py-2 bg-white border border-neutral-300 rounded-xl text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all resize-none"
            />
          </div>
        </div>
      </form>
    </FormModal>
  );
}
