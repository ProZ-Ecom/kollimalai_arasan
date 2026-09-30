"use client";

import { useState, useCallback, useRef } from "react";
import { lookupPostalPincode, type PincodeLookupSuccess } from "../utils/pincode.util";

export function usePincodeLookup() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [postalData, setPostalData] = useState<PincodeLookupSuccess | null>(null);
  const lastPostalDataRef = useRef<PincodeLookupSuccess | null>(null);
  const lastCheckedPincode = useRef<string>("");

  const verifyPincode = useCallback(async (pincode: string, force = false) => {
    const cleanCode = (pincode || "").trim().replace(/\D/g, "");

    if (cleanCode.length !== 6 || cleanCode.startsWith("0")) {
      setPostalData(null);
      lastPostalDataRef.current = null;
      setVerificationError(null);
      lastCheckedPincode.current = "";
      return null;
    }

    if (!force && lastCheckedPincode.current === cleanCode && lastPostalDataRef.current) {
      return lastPostalDataRef.current;
    }

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const result = await lookupPostalPincode(cleanCode);
      if (result.valid) {
        setPostalData(result);
        lastPostalDataRef.current = result;
        setVerificationError(null);
        lastCheckedPincode.current = cleanCode;
        return result;
      } else {
        setPostalData(null);
        lastPostalDataRef.current = null;
        setVerificationError(result.error);
        lastCheckedPincode.current = cleanCode;
        return null;
      }
    } catch {
      setPostalData(null);
      lastPostalDataRef.current = null;
      setVerificationError("Failed to verify PIN code with India Post.");
      return null;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const resetPincodeVerification = useCallback(() => {
    setIsVerifying(false);
    setVerificationError(null);
    setPostalData(null);
    lastCheckedPincode.current = "";
  }, []);

  return {
    isVerifying,
    verificationError,
    postalData,
    isVerified: Boolean(postalData && postalData.valid),
    verifyPincode,
    resetPincodeVerification,
  };
}
