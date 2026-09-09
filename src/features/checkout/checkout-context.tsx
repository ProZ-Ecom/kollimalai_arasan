"use client";

import * as React from "react";
import type {
  DeliveryMethod,
  PaymentMethod,
} from "@/features/orders/types";

export interface CheckoutState {
  addressId: number | null;
  deliveryMethod: DeliveryMethod;
  couponCode: string | null;
  paymentMethod: PaymentMethod;
  notes: string;
  isOrderPlaced: boolean;
}

interface CheckoutContextValue extends CheckoutState {
  setAddressId: (id: number | null) => void;
  setDeliveryMethod: (method: DeliveryMethod) => void;
  setCouponCode: (code: string | null) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setNotes: (notes: string) => void;
  setIsOrderPlaced: (isPlaced: boolean) => void;
  resetCheckout: () => void;
}

const STORAGE_KEY = "rithu-checkout-state";

const DEFAULT_STATE: CheckoutState = {
  addressId: null,
  deliveryMethod: "STANDARD",
  couponCode: null,
  paymentMethod: "CASH_ON_DELIVERY",
  notes: "",
  isOrderPlaced: false,
};

const CheckoutContext = React.createContext<CheckoutContextValue | null>(null);

function loadInitialState(): CheckoutState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CheckoutState>;
      return { ...DEFAULT_STATE, ...parsed, isOrderPlaced: false };
    }
  } catch {
    // ignore invalid storage
  }
  return DEFAULT_STATE;
}

export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<CheckoutState>(loadInitialState);

  React.useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage unavailable
    }
  }, [state]);

  const value = React.useMemo<CheckoutContextValue>(
    () => ({
      ...state,
      setAddressId: (addressId) =>
        setState((prev) => ({ ...prev, addressId })),
      setDeliveryMethod: (deliveryMethod) =>
        setState((prev) => ({ ...prev, deliveryMethod })),
      setCouponCode: (couponCode) =>
        setState((prev) => ({ ...prev, couponCode })),
      setPaymentMethod: (paymentMethod) =>
        setState((prev) => ({ ...prev, paymentMethod })),
      setNotes: (notes) => setState((prev) => ({ ...prev, notes })),
      setIsOrderPlaced: (isOrderPlaced) =>
        setState((prev) => ({ ...prev, isOrderPlaced })),
      resetCheckout: () => setState(DEFAULT_STATE),
    }),
    [state]
  );

  return (
    <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>
  );
}

export function useCheckout(): CheckoutContextValue {
  const context = React.useContext(CheckoutContext);
  if (!context) {
    throw new Error("useCheckout must be used within a CheckoutProvider");
  }
  return context;
}
