"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  MapPin,
  ShoppingBag,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup } from "@/components/ui/Radio";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/Toast";
import { useCart } from "@/features/cart/hooks/use-cart";
import { useAddresses } from "@/features/addresses/hooks";
import { useCheckout } from "@/features/checkout/checkout-context";
import { useCheckoutSummary, usePlaceOrder } from "@/features/orders/hooks";
import {
  useCreateRazorpayOrder,
  useVerifyRazorpayPayment,
} from "@/features/customers/hooks/use-customer-payment";
import { loadRazorpayScript } from "@/features/customers/utils/razorpay-loader";
import { OrderItemsList } from "@/features/orders/components/OrderItemsList";
import { OrderTotals } from "@/features/orders/components/OrderTotals";
import { PAYMENT_METHOD_OPTIONS } from "@/features/orders/constants";

export default function CheckoutPaymentPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const userRole = (session?.user as any)?.role?.toUpperCase();
  const isAdminUser = userRole === "ADMIN" || userRole === "STAFF";

  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: addresses, isLoading: addressesLoading } = useAddresses();
  const checkout = useCheckout();
  const placeOrder = usePlaceOrder();
  const createRazorpayOrder = useCreateRazorpayOrder();
  const verifyRazorpayPayment = useVerifyRazorpayPayment();

  const [isRazorpayLoading, setIsRazorpayLoading] = React.useState(false);

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useCheckoutSummary(checkout.deliveryMethod, checkout.couponCode);

  if (status === "loading" || cartLoading || addressesLoading) {
    return <LoadingState text="Loading payment..." />;
  }

  if (status === "unauthenticated" || !session) {
    router.push("/login?callbackUrl=/checkout/payment");
    return null;
  }

  const items = cart?.items ?? [];
  const selectedAddress = addresses?.find((a) => a.id === checkout.addressId);

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Nothing to pay for right now."
      >
        <Link href="/products">
          <Button>Browse Products</Button>
        </Link>
      </EmptyState>
    );
  }

  const handlePlaceOrder = async () => {
    if (isAdminUser || !checkout.addressId) return;

    // COD Flow
    if (checkout.paymentMethod === "CASH_ON_DELIVERY") {
      placeOrder.mutate(
        {
          addressId: checkout.addressId,
          shippingAddressId: String(checkout.addressId),
          deliveryMethod: checkout.deliveryMethod,
          couponCode: checkout.couponCode ?? undefined,
          paymentMethod: "CASH_ON_DELIVERY",
          notes: checkout.notes || undefined,
        },
        {
          onSuccess: (order) => {
            checkout.resetCheckout();
            router.push(`/checkout/success?orderNumber=${order.orderNumber}`);
          },
        }
      );
      return;
    }

    // Razorpay Online Flow
    try {
      setIsRazorpayLoading(true);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Payment Gateway Error", "Unable to load Razorpay checkout SDK. Please check your internet connection.");
        setIsRazorpayLoading(false);
        return;
      }

      // 1. Create order on server from current cart
      const rzpOrder = await createRazorpayOrder.mutateAsync({
        orderId: "cart",
        shippingAddressId: String(checkout.addressId),
      });

      // 2. Open Razorpay Checkout Modal
      const options = {
        key: rzpOrder.keyId,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency || "INR",
        name: "Kollimalai Arasan",
        description: "Pure Farm & Forest Products",
        order_id: rzpOrder.razorpayOrderId,
        prefill: {
          name: selectedAddress
            ? `${selectedAddress.firstName} ${selectedAddress.lastName}`.trim()
            : "",
          contact: selectedAddress?.phone || "",
          email: session?.user?.email || "",
        },
        theme: {
          color: "#16a34a",
        },
        modal: {
          ondismiss: function () {
            setIsRazorpayLoading(false);
            toast.info("Payment Cancelled", "Transaction was cancelled. Your cart is preserved.");
          },
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            // 3. Cryptographically verify signature and commit order to database
            const verifyResult = await verifyRazorpayPayment.mutateAsync({
              orderId: "cart",
              shippingAddressId: String(checkout.addressId),
              billingAddressId: String(checkout.addressId),
              notes: checkout.notes || undefined,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast.success("Payment Successful", "Your order has been placed successfully!");
            checkout.resetCheckout();
            router.push(`/checkout/success?orderNumber=${verifyResult.orderNumber}`);
          } catch (err: any) {
            toast.error("Verification Error", err?.message || "Payment verification failed. Please contact support.");
          } finally {
            setIsRazorpayLoading(false);
          }
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on("payment.failed", function (response: any) {
        setIsRazorpayLoading(false);
        toast.error("Payment Failed", response?.error?.description || "Transaction failed. Please try again.");
      });
      razorpayInstance.open();
    } catch (err: any) {
      setIsRazorpayLoading(false);
      toast.error("Order Creation Failed", err?.message || "Failed to initialize payment gateway.");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payment</h1>
        <Button variant="outline" onClick={() => router.push("/checkout")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {isAdminUser && (
        <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-5 text-amber-950 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm sm:text-base font-bold text-amber-900">
              You are admin kindly comes with customer login
            </h3>
            <p className="text-xs sm:text-sm text-amber-800 mt-1 leading-relaxed">
              Admin accounts cannot execute payments or book orders. Please log in with a customer account to continue.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Delivering To
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedAddress ? (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">
                    {selectedAddress.firstName} {selectedAddress.lastName}
                  </p>
                  <p>
                    {selectedAddress.addressLine1}
                    {selectedAddress.addressLine2
                      ? `, ${selectedAddress.addressLine2}`
                      : ""}
                  </p>
                  <p>
                    {selectedAddress.city}, {selectedAddress.state} -{" "}
                    {selectedAddress.postalCode}
                  </p>
                  <p>Phone: {selectedAddress.phone}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No address selected.{" "}
                  <Link
                    href="/checkout/address"
                    className="text-primary hover:underline"
                  >
                    Select an address
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Choose Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                name="paymentMethod"
                value={checkout.paymentMethod}
                onValueChange={(value) =>
                  checkout.setPaymentMethod(
                    value as typeof checkout.paymentMethod
                  )
                }
                options={PAYMENT_METHOD_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                  description: option.description,
                }))}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-72 overflow-y-auto">
                <OrderItemsList items={summary?.items ?? []} compact />
              </div>

              <div className="my-4 border-t" />

              {summaryLoading ? (
                <LoadingState size="sm" text="Calculating totals..." />
              ) : summary ? (
                <OrderTotals
                  totals={
                    summary.totals ?? {
                      subtotal: summary.subtotal,
                      taxAmount: summary.taxAmount ?? 0,
                      shippingAmount: summary.shippingCharge ?? summary.deliveryCharge ?? 0,
                      discountAmount: summary.discountAmount ?? summary.discount ?? 0,
                      totalAmount: summary.totalAmount ?? summary.total ?? summary.subtotal,
                    }
                  }
                  couponLabel={summary.coupon?.code ?? summary.couponCode ?? null}
                />
              ) : (
                <ErrorState
                  title="Could not calculate totals"
                  message={summaryError?.message}
                  onRetry={refetchSummary}
                />
              )}

              <Button
                className="mt-5 w-full"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={
                  isAdminUser ||
                  !checkout.addressId ||
                  summaryLoading ||
                  placeOrder.isPending ||
                  isRazorpayLoading ||
                  createRazorpayOrder.isPending ||
                  verifyRazorpayPayment.isPending
                }
              >
                {(placeOrder.isPending ||
                  isRazorpayLoading ||
                  createRazorpayOrder.isPending ||
                  verifyRazorpayPayment.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isAdminUser
                  ? "Payment Disabled for Admin"
                  : verifyRazorpayPayment.isPending
                  ? "Verifying Payment..."
                  : isRazorpayLoading || createRazorpayOrder.isPending
                  ? "Opening Payment Gateway..."
                  : checkout.paymentMethod === "CASH_ON_DELIVERY"
                  ? "Place Order (Cash on Delivery)"
                  : "Pay Online with Razorpay"}
              </Button>

              {placeOrder.error && (
                <p className="mt-2 text-sm text-error-600">
                  {placeOrder.error.message}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
