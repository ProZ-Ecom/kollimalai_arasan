export interface ReturnItemInfo {
  orderItemId: string;
  productName: string;
  variantName: string;
  sku: string;
  orderedQuantity: number;
  returnQuantity: number;
  unitPrice: number;
  totalPrice: number;
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

export interface ReturnRequestListItem {
  id: string;
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  customer?: ReturnCustomerInfo;
  reason: string;
  status: "requested" | "approved" | "rejected" | "picked_up" | "refunded";
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
  status: "requested" | "approved" | "rejected" | "picked_up" | "refunded";
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
