/**
 * Shared enum label maps for report services and UI pages so Prisma enum keys
 * render consistently across charts, tables, and Excel exports.
 */

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

export const ORDER_STATUS_ORDER = Object.keys(ORDER_STATUS_LABELS);

export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

export const IN_PROGRESS_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
] as const;

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
  partial_refund: "Partially refunded",
};

export const PAYMENT_STATUS_OPTIONS = Object.entries(PAYMENT_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

export const INVENTORY_TX_TYPE_LABELS: Record<string, string> = {
  in: "Stock In",
  out: "Stock Out",
  reserved: "Reserved",
  released: "Released",
};

export const STOCK_ADJUSTMENT_TYPE_LABELS: Record<string, string> = {
  add: "Manual Addition",
  remove: "Manual Deduction",
};

export const RETURN_STATUS_LABELS: Record<string, string> = {
  requested: "Requested",
  approved: "Approved",
  rejected: "Rejected",
  picked_up: "Picked Up",
  delivered: "Delivered",
  refunded: "Refunded",
};

export const label = (map: Record<string, string>, key: string | null | undefined) =>
  key == null ? "—" : (map[key] ?? key);
