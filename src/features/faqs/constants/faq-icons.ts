/**
 * Icon keys an admin can pick for a FAQ category. Kept free of any React or
 * lucide import so the API routes and Zod schemas can use it on the server;
 * the matching components live in `faq-icon-map.ts`.
 */
export const FAQ_ICON_KEYS = [
  "truck",
  "package",
  "leaf",
  "gift",
  "rotate-ccw",
  "credit-card",
  "clock",
  "shield-check",
  "phone",
  "help-circle",
] as const;

export type FaqIconKey = (typeof FAQ_ICON_KEYS)[number];

export const FAQ_ICON_LABELS: Record<FaqIconKey, string> = {
  truck: "Delivery & Shipping",
  package: "Packaging",
  leaf: "Ingredients & Quality",
  gift: "Gifting",
  "rotate-ccw": "Returns & Refunds",
  "credit-card": "Payments",
  clock: "Shelf Life",
  "shield-check": "Safety & Trust",
  phone: "Support",
  "help-circle": "General",
};

export const FAQ_ICON_OPTIONS = FAQ_ICON_KEYS.map((key) => ({
  value: key,
  label: FAQ_ICON_LABELS[key],
}));

export function isFaqIconKey(value: unknown): value is FaqIconKey {
  return (
    typeof value === "string" &&
    (FAQ_ICON_KEYS as readonly string[]).includes(value)
  );
}
