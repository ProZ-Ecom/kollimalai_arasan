"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Truck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Banknote,
  RotateCcw,
} from "lucide-react";

interface CourierItem {
  id: number;
  name: string;
  rate: number;
  etd: string;
  isCodAvailable: boolean;
}

interface ServiceabilityData {
  isServiceable: boolean;
  couriers: CourierItem[];
  recommendedCourier?: {
    id: number;
    name: string;
    rate: number;
    etd: string;
  };
}

export function PincodeDeliveryChecker({
  weightKg = 0.5,
}: {
  weightKg?: number;
}) {
  const [pincode, setPincode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<ServiceabilityData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Restore saved pincode from previous checks
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ka_user_pincode");
      if (saved && /^\d{6}$/.test(saved)) {
        setPincode(saved);
        handleCheck(saved);
      }
    } catch {
      // Ignore localStorage read errors in private browsing
    }
  }, []);

  const handleCheck = async (pincodeToCheck?: string) => {
    const targetPin = (pincodeToCheck || pincode).trim();
    if (!/^\d{6}$/.test(targetPin)) {
      setError("Please enter a valid 6-digit Indian PIN code.");
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/shipping/serviceability?pincode=${encodeURIComponent(
          targetPin
        )}&weight=${weightKg}`
      );
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || "Unable to check delivery for this pincode.");
        setData(null);
      } else {
        setData(json);
        try {
          localStorage.setItem("ka_user_pincode", targetPin);
        } catch {
          // ignore
        }
      }
    } catch {
      setError("Failed to connect to delivery service. Please try again.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCheck();
    }
  };

  const isTamilNadu =
    pincode.startsWith("60") ||
    pincode.startsWith("61") ||
    pincode.startsWith("62") ||
    pincode.startsWith("63") ||
    pincode.startsWith("64");

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-gradient-to-b from-neutral-50/50 to-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
          <Truck className="h-4 w-4 text-primary-600" />
          Delivery & COD Check
        </span>
        {pincode.length === 6 && data?.isServiceable && (
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Serviceable
          </span>
        )}
      </div>

      {/* Input Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
            <MapPin className="h-4 w-4" />
          </div>
          <input
            type="text"
            maxLength={6}
            value={pincode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              setPincode(val);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter 6-digit pincode (e.g. 600001)"
            className="w-full pl-9 pr-3 py-2 text-xs font-medium text-neutral-900 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-600 transition-all placeholder:text-neutral-400"
          />
        </div>
        <button
          type="button"
          onClick={() => handleCheck()}
          disabled={isLoading || pincode.length !== 6}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Checking</span>
            </>
          ) : (
            <span>Check</span>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-[11.5px] text-red-600 flex items-center gap-1.5 pt-0.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Verified Serviceability Result */}
      {data && (
        <div className="pt-2 space-y-2.5 border-t border-neutral-100">
          {data.isServiceable ? (
            <>
              <div className="flex items-start gap-2.5 text-xs text-neutral-800">
                <Calendar className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-neutral-900">
                    Expected Delivery:{" "}
                  </span>
                  <span className="text-emerald-700 font-semibold">
                    {data.recommendedCourier?.etd || "2 – 4 business days"}
                  </span>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Dispatched within 24 hours directly from Kolli Hills agro hub.
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                  <Banknote className="h-3.5 w-3.5" />
                  Cash on Delivery Available
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-medium">
                  <Truck className="h-3.5 w-3.5" />
                  {isTamilNadu
                    ? "Express via ST Courier / Delhivery"
                    : "Express via Blue Dart / Delhivery"}
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-medium">
                  <RotateCcw className="h-3.5 w-3.5" />
                  7 Business Days Return Policy
                </span>
              </div>
            </>
          ) : (
            <div className="text-xs text-amber-800 bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                Standard automated couriers may be limited in this area. You can still order via WhatsApp for India Post delivery!
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
