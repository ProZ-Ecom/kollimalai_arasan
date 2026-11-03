import { apiClient } from "@/lib/api/api-client";
import type {
  CreateRazorpayOrderInput,
  VerifyRazorpayPaymentInput,
  ReconcileRazorpayPaymentInput,
  RazorpayOrderResponse,
} from "@/features/payment/validations/payment.schema";

export interface VerifyPaymentResult {
  success: boolean;
  message: string;
  orderNumber: string;
  orderId: string;
}

export interface ReconcilePaymentResult {
  found: boolean;
  success?: boolean;
  reconciled?: boolean;
  alreadyProcessed?: boolean;
  orderNumber?: string;
  orderId?: string;
  status?: string;
  isPaid?: boolean;
  message?: string;
}

export const customerPaymentApi = {
  /**
   * Create Razorpay order for an existing pending customer order
   */
  async createRazorpayOrder(
    payload: CreateRazorpayOrderInput
  ): Promise<RazorpayOrderResponse> {
    const response = await apiClient.post<RazorpayOrderResponse>(
      "/api/customer/payment/create-order",
      payload
    );
    if (!response.data) {
      throw new Error(response.message || "Failed to create Razorpay order");
    }
    return response.data;
  },

  /**
   * Verify Razorpay payment signature after customer completes payment in modal
   */
  async verifyPayment(
    payload: VerifyRazorpayPaymentInput
  ): Promise<VerifyPaymentResult> {
    const response = await apiClient.post<VerifyPaymentResult>(
      "/api/customer/payment/verify",
      payload
    );
    if (!response.data) {
      throw new Error(response.message || "Failed to verify payment");
    }
    return response.data;
  },

  /**
   * Reconcile interrupted or refreshed payment directly with Razorpay gateway
   */
  async reconcilePayment(
    payload: ReconcileRazorpayPaymentInput
  ): Promise<ReconcilePaymentResult> {
    const response = await apiClient.post<ReconcilePaymentResult>(
      "/api/customer/payment/reconcile",
      payload
    );
    if (!response.data) {
      throw new Error(response.message || "Failed to reconcile payment");
    }
    return response.data;
  },
};

