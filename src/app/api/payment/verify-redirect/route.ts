import { NextRequest, NextResponse } from "next/server";
import { razorpayService } from "@/features/payment/services/razorpay.service";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(32),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

/**
 * POST /api/payment/verify-redirect
 * Called by the payment app after Razorpay payment succeeds.
 * NO session auth — the one-time token IS the authentication for this call.
 * CORS-enabled for payment app origin.
 *
 * - Validates token (unused + not expired)
 * - Verifies Razorpay HMAC signature
 * - Marks token as used
 * - Creates internal order with confirmed+paid status
 * - Returns { orderNumber, orderId, mainAppSuccessUrl }
 */
export async function POST(request: NextRequest) {
  const mainAppUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const paymentAppUrl = process.env.PAYMENT_APP_URL || "http://localhost:3001";

  const corsHeaders = {
    "Access-Control-Allow-Origin": paymentAppUrl,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400, headers: corsHeaders }
      );
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Validation error", errors: parsed.error.flatten() },
        { status: 422, headers: corsHeaders }
      );
    }

    const result = await razorpayService.verifyRedirectPayment(parsed.data);

    const params = new URLSearchParams();
    if (result.orderId) params.set("orderId", String(result.orderId));
    if (result.orderNumber) params.set("orderNumber", String(result.orderNumber));

    return NextResponse.json(
      {
        success: true,
        message: "Payment verified and order placed",
        data: {
          orderNumber: result.orderNumber,
          orderId: result.orderId,
          successUrl: `${mainAppUrl}/checkout/success?${params.toString()}`,
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    const status = err?.statusCode || err?.status || 500;
    return NextResponse.json(
      { success: false, message: err?.message || "Verification failed" },
      { status, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  const paymentAppUrl = process.env.PAYMENT_APP_URL || "http://localhost:3001";
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": paymentAppUrl,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
