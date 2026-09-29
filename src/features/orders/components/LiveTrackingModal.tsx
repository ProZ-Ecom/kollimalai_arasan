"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import {
  Truck,
  CheckCircle2,
  Package,
  MapPin,
  Calendar,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Building2,
  Clock,
} from "lucide-react";
import type { TrackingResult, TrackingCheckpoint } from "../services/courier-tracking.service";

interface LiveTrackingModalProps {
  open: boolean;
  onClose: () => void;
  awb: string;
  courierName?: string;
  orderNumber?: string;
}

export function LiveTrackingModal({
  open,
  onClose,
  awb,
  courierName = "ST Courier",
  orderNumber,
}: LiveTrackingModalProps) {
  const [data, setData] = useState<TrackingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchTracking = async (awbNumber: string) => {
    if (!awbNumber) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/orders/track?awb=${encodeURIComponent(awbNumber)}&courier=st-courier`
      );
      const json: TrackingResult = await res.json();

      if (!json.success && json.error) {
        setError(json.error);
        setData(json);
      } else {
        setData(json);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch live tracking details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && awb) {
      fetchTracking(awb);
    } else {
      setData(null);
      setError(null);
    }
  }, [open, awb]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDelivered =
    data?.summary?.currentStatus?.toLowerCase().includes("delivered") ||
    data?.checkpoints?.[0]?.isDelivered;

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl bg-white border border-neutral-200 shadow-2xl [&>button:first-child]:text-white/80 [&>button:first-child]:hover:text-white [&>button:first-child]:hover:bg-white/20 [&>button:first-child]:z-20"
    >
      <div className="w-full">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-secondary-800 to-secondary-900 text-white px-6 py-5 rounded-t-2xl">
          <div className="flex items-center justify-between gap-4 pr-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-secondary-700/80 text-secondary-100 border border-secondary-600">
                  {courierName}
                </span>
                {orderNumber && (
                  <span className="text-xs text-secondary-200 font-mono">
                    Order {orderNumber}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white mt-1.5 flex items-center gap-2">
                <Truck className="h-5 w-5 text-secondary-300" />
                Live Shipment Tracking
              </h3>
            </div>

            {/* AWB Pill */}
            <div className="bg-secondary-950/60 border border-secondary-700/80 rounded-xl px-3.5 py-2 text-right">
              <div className="text-[10px] uppercase font-bold text-secondary-300 tracking-wider">
                AWB / Tracking No.
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-sm font-bold text-white tracking-wider">
                  {awb}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(awb)}
                  title="Copy AWB Number"
                  className="text-secondary-300 hover:text-white transition-colors cursor-pointer"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {isLoading ? (
            /* Skeleton Loading State */
            <div className="space-y-4 animate-pulse">
              <div className="h-24 bg-neutral-100 rounded-xl" />
              <div className="h-40 bg-neutral-100 rounded-xl" />
              <div className="space-y-3">
                <div className="h-6 w-36 bg-neutral-200 rounded" />
                <div className="h-16 bg-neutral-100 rounded-lg" />
                <div className="h-16 bg-neutral-100 rounded-lg" />
              </div>
            </div>
          ) : error && !data?.checkpoints?.length ? (
            /* Error State */
            <div className="text-center py-8 px-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-neutral-800">
                Unable to load tracking details
              </h4>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                {error}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => fetchTracking(awb)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-secondary-600 hover:bg-secondary-700 text-white transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Retry
                </button>
                {data?.officialUrl && (
                  <a
                    href={data.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-neutral-300 hover:bg-neutral-50 text-neutral-700 transition-colors cursor-pointer"
                  >
                    Open ST Courier Website <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          ) : (
            /* Loaded State */
            <>
              {/* Status Banner */}
              <div
                className={`rounded-2xl p-4.5 border flex items-center justify-between gap-4 ${
                  isDelivered
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                    : "bg-blue-50/80 border-blue-200 text-blue-900"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs ${
                      isDelivered
                        ? "bg-emerald-600 text-white"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {isDelivered ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <Truck className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                        Current Status
                      </span>
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          isDelivered
                            ? "bg-emerald-500"
                            : "bg-blue-500 animate-pulse"
                        }`}
                      />
                    </div>
                    <div className="text-lg font-extrabold capitalize leading-tight mt-0.5">
                      {data?.summary?.currentStatus || "In Transit"}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fetchTracking(awb)}
                  title="Refresh Live Status"
                  className="p-2 rounded-lg hover:bg-white/80 transition-colors text-neutral-500 hover:text-neutral-800 cursor-pointer"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              {/* Summary Details Grid */}
              {data?.summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {data.summary.origin && (
                    <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200/80">
                      <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-neutral-400" /> Origin
                      </div>
                      <div className="text-xs font-bold text-neutral-800 mt-1 font-mono truncate">
                        {data.summary.origin}
                      </div>
                    </div>
                  )}

                  {data.summary.destination && (
                    <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200/80">
                      <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-secondary-600" /> Destination
                      </div>
                      <div className="text-xs font-bold text-neutral-800 mt-1 font-mono truncate">
                        {data.summary.destination}
                      </div>
                    </div>
                  )}

                  {data.summary.bookingDate && (
                    <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200/80">
                      <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-neutral-400" /> Booked On
                      </div>
                      <div className="text-xs font-semibold text-neutral-800 mt-1 truncate">
                        {data.summary.bookingDate}
                      </div>
                    </div>
                  )}

                  {data.summary.deliveryDate && (
                    <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200/80">
                      <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider flex items-center gap-1">
                        <Clock className="h-3 w-3 text-emerald-600" /> Delivered On
                      </div>
                      <div className="text-xs font-semibold text-neutral-800 mt-1 truncate">
                        {data.summary.deliveryDate}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline Section */}
              <div className="pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3.5">
                  Shipment Checkpoints & Timeline
                </div>

                {data?.checkpoints && data.checkpoints.length > 0 ? (
                  <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
                    {data.checkpoints.map((cp, idx) => {
                      const isLatest = idx === 0;
                      const isCpDelivered =
                        cp.isDelivered ||
                        cp.status.toLowerCase().includes("delivered");

                      return (
                        <div key={idx} className="relative group">
                          {/* Dot / Icon */}
                          <div
                            className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                              isCpDelivered
                                ? "bg-emerald-600 text-white"
                                : isLatest
                                ? "bg-secondary-600 text-white animate-pulse"
                                : "bg-neutral-300 text-white"
                            }`}
                          >
                            {isCpDelivered ? (
                              <Check className="h-3 w-3 stroke-[3]" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>

                          {/* Content */}
                          <div
                            className={`rounded-xl p-3.5 border transition-all ${
                              isLatest
                                ? "bg-secondary-50/50 border-secondary-200 shadow-2xs"
                                : "bg-white border-neutral-200/70"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <span
                                className={`text-sm font-bold ${
                                  isCpDelivered
                                    ? "text-emerald-700"
                                    : isLatest
                                    ? "text-secondary-900"
                                    : "text-neutral-800"
                                }`}
                              >
                                {cp.status}
                              </span>
                              <span className="text-[11px] font-semibold text-neutral-500 whitespace-nowrap">
                                {cp.date}
                              </span>
                            </div>

                            {cp.location && (
                              <div className="text-xs text-neutral-600 mt-1 flex items-start gap-1">
                                <Building2 className="h-3.5 w-3.5 text-neutral-400 mt-0.5 flex-shrink-0" />
                                <span>{cp.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-neutral-500 bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
                    No checkpoints recorded yet. Package is awaiting initial dispatch scan.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200/80 flex items-center justify-between rounded-b-2xl">
          <span className="text-[11px] text-neutral-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Verified live data from {courierName} network
          </span>

          <div className="flex items-center gap-2">
            {data?.officialUrl && (
              <a
                href={data.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-neutral-700 transition-colors"
              >
                Official Website <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold bg-neutral-800 hover:bg-neutral-900 text-white rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
