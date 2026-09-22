import type {
  DeliveryMethod,
  PaymentMethod,
} from "./types";

export const DELIVERY_OPTIONS: Record<
  DeliveryMethod,
  { label: string; cost: number; description: string }
> = {
  standard: { label: "Standard Delivery", cost: 49, description: "3 - 5 business days" },
  express: { label: "Express Delivery", cost: 99, description: "1 - 2 business days" },
};

export const PAYMENT_METHOD_OPTIONS: {
  value: PaymentMethod;
  label: string;
  description: string;
}[] = [
  {
    value: "UPI",
    label: "Pay Online (Razorpay)",
    description: "Instant & Secure: UPI (Google Pay, PhonePe, Paytm), Cards, Net Banking & Wallets",
  },
  {
    value: "CASH_ON_DELIVERY",
    label: "Cash on Delivery (COD)",
    description: "Pay in cash when your order arrives at your doorstep",
  },
];
