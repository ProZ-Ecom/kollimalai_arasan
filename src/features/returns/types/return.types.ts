export type ReturnRequestStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "picked_up"
  | "delivered"
  | "refunded";

export interface ReturnItemInfo {
  orderItemId: string;
  productName: string;
  variantName: string;
  sku: string;
  orderedQuantity: number;
  returnQuantity: number;
  unitPrice: number;
  totalPrice: number;
  refundAmount?: number | null;
  primaryImage?: string | null;
  reason: string | null;
}

export interface ReturnCustomerInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface ReturnOrderInfo {
  id: string;
  orderNumber: string;
  orderStatus: string;
  totalAmount: number;
  placedAt: Date | null;
  createdAt: Date;
}

export interface ReturnPayoutDetails {
  method: "upi" | "bank_transfer" | "other";
  upiId?: string;
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
}

export interface ReturnRefundRecord {
  id: string;
  amount: number;
  status: string;
  reason?: string | null;
  processedAt?: Date | null;
}

export interface ReturnRequestListItem {
  id: string;
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  customer?: ReturnCustomerInfo;
  reason: string;
  videoUrl?: string | null;
  status: ReturnRequestStatus;
  adminNotes?: string | null;
  inspectedAt?: Date | null;
  payoutDetails?: ReturnPayoutDetails | null;
  totalItems: number;
  requestedAt: Date;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReturnRequestDetailResponse {
  id: string;
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  customer: ReturnCustomerInfo;
  reason: string;
  videoUrl?: string | null;
  status: ReturnRequestStatus;
  adminNotes?: string | null;
  inspectedAt?: Date | null;
  returnAwb?: string | null;
  returnShipmentId?: string | null;
  returnLabelUrl?: string | null;
  courierName?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  isCod?: boolean;
  totalAmount?: number;
  eligibleRefundAmount?: number;
  payoutDetails?: ReturnPayoutDetails | null;
  refunds?: ReturnRefundRecord[];
  requestedAt: Date;
  approvedAt: Date | null;
  items: ReturnItemInfo[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReturnRequestResult {
  id: string;
  orderId: string;
  orderNumber: string;
  status: "requested";
  reason: string;
  videoUrl?: string | null;
  requestedAt: Date;
  items: {
    orderItemId: string;
    quantity: number;
    reason: string | null;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApproveReturnResult {
  id: string;
  orderId: string;
  status: "approved";
  approvedAt: Date;
}

export interface RejectReturnResult {
  id: string;
  orderId: string;
  status: "rejected";
}

export interface PickupReturnResult {
  id: string;
  orderId: string;
  orderNumber: string;
  returnStatus: "picked_up";
  orderStatus: "returned";
}

export interface ReviewReturnResult {
  id: string;
  orderId: string;
  status: ReturnRequestStatus;
  adminNotes: string;
  inspectedAt: Date;
}

export interface ProcessReturnRefundResult {
  id: string;
  orderId: string;
  orderNumber: string;
  refundAmount: number;
  paymentMode: string;
  referenceId?: string;
  returnStatus: "refunded";
  orderPaymentStatus: string;
  isSimulated?: boolean;
  message: string;
}
