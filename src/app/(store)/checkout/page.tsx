"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { ProductImage } from "@/components/common/ProductImage";
import {
  MapPin,
  Truck,
  CreditCard,
  CheckCircle2,
  Plus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Lock,
  AlertCircle,
  AlertTriangle,
  Loader2,
  X,
  Phone,
  Clock,
  Check,
  Banknote,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatPrice, cn } from "@/lib/utils";
import { formatMeasurementLabel } from "@/features/variants/utils/measurement.util";
import { ICONS, contacts } from "@/constants/storefront";
import { useCustomerCart } from "@/features/customers/hooks/use-customer-cart";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCustomerAddresses,
  useCreateCustomerAddress,
  useUpdateCustomerAddress,
  useDeleteCustomerAddress,
} from "@/features/customers/hooks/use-customer-address";
import {
  useCreateCustomerOrder,
  CUSTOMER_ORDERS_QUERY_KEY,
} from "@/features/customers/hooks/use-customer-orders";
import {
  useCreateRazorpayOrder,
  useVerifyRazorpayPayment,
} from "@/features/customers/hooks/use-customer-payment";
import { loadRazorpayScript } from "@/features/customers/utils/razorpay-loader";
import { useCheckout } from "@/features/checkout/checkout-context";
import { usePincodeLookup } from "@/features/customers/hooks/use-pincode-lookup";
import type { CustomerAddressResponse } from "@/features/customers/types/customer-address.types";

const waContact = contacts.find((c) => c.title.toLowerCase().includes("whatsapp"));
const KOLLIMALAI_WHATSAPP_DISPLAY = waContact?.value || "+91 73388 80950";
const KOLLIMALAI_WHATSAPP_NUMBER = (waContact?.value || "+91 73388 80950").replace(/\D/g, "");

const callContact = contacts.find((c) => c.title.toLowerCase().includes("call"));
const KOLLIMALAI_CALL_DISPLAY = callContact?.value || "+91 74181 88950";
const KOLLIMALAI_CALL_NUMBER = (callContact?.value || "+91 74181 88950").replace(/\D/g, "");


function CheckoutSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-10 max-w-7xl animate-pulse">
      <div className="mb-8 space-y-2">
        <div className="h-8 w-64 rounded-xl skeleton-shimmer" />
        <div className="h-4 w-96 rounded-lg skeleton-shimmer" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl border border-theme-border bg-theme-surface p-6 space-y-4">
            <div className="h-6 w-48 rounded-md skeleton-shimmer" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-36 rounded-xl skeleton-shimmer" />
              <div className="h-36 rounded-xl skeleton-shimmer" />
            </div>
          </div>

          <div className="rounded-2xl border border-theme-border bg-theme-surface p-6 space-y-4">
            <div className="h-6 w-48 rounded-md skeleton-shimmer" />
            <div className="h-24 rounded-xl skeleton-shimmer" />
          </div>

          <div className="rounded-2xl border border-theme-border bg-theme-surface p-6 space-y-4">
            <div className="h-6 w-48 rounded-md skeleton-shimmer" />
            <div className="h-40 rounded-xl skeleton-shimmer" />
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-theme-border bg-theme-surface p-6 space-y-4">
            <div className="h-6 w-36 rounded-md skeleton-shimmer" />
            <div className="h-32 rounded-xl skeleton-shimmer" />
            <div className="h-12 rounded-xl skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, status: authStatus } = useSession();
  const { isOrderPlaced, setIsOrderPlaced } = useCheckout();

  const userRole = (session?.user as any)?.role?.toUpperCase();
  const isAdminUser = userRole === "ADMIN" || userRole === "STAFF";

  // Customer Module TanStack Query hooks
  const { data: cart, isLoading: cartLoading } = useCustomerCart();
  const { data: addresses = [], isLoading: addressesLoading } =
    useCustomerAddresses();
  const createAddressMutation = useCreateCustomerAddress();
  const updateAddressMutation = useUpdateCustomerAddress();
  const deleteAddressMutation = useDeleteCustomerAddress();
  const createOrderMutation = useCreateCustomerOrder();
  const createRazorpayOrderMutation = useCreateRazorpayOrder();
  const verifyRazorpayPaymentMutation = useVerifyRazorpayPayment();

  // Selected state
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [courierType, setCourierType] = useState<"st_courier" | "mss" | "shiprocket">(
    "st_courier"
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "CARD" | "COD" | "WHATSAPP" | "CALL"
  >("CARD");
  const [orderNotes, setOrderNotes] = useState<string>("");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // In-flight payment guard
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [isPlacingCodOrder, setIsPlacingCodOrder] = useState(false);
  const [pendingOrder] = useState<null>(null);

  // CRITICAL FLOW GUARD: If customer chooses Cash On Delivery (COD), the courier partner MUST be Shiprocket only!
  useEffect(() => {
    if (paymentMethod === "COD" && courierType !== "shiprocket") {
      setCourierType("shiprocket");
    }
  }, [paymentMethod, courierType]);

  // Restore courier selection across browser refreshes or payment retries
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("checkout_courier_type");
      if (saved === "st_courier" || saved === "mss" || saved === "shiprocket") {
        if (paymentMethod === "COD") {
          setCourierType("shiprocket");
        } else {
          setCourierType(saved);
        }
      }
    } catch {
      // sessionStorage not available in SSR / restricted environments
    }
  }, [paymentMethod]);

  // Persist customer courier selection to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem("checkout_courier_type", courierType);
    } catch {
      // sessionStorage not available in SSR / restricted environments
    }
  }, [courierType]);

  // Reset in-flight payment loading state when user returns to this page (BFCache / browser Back button)
  useEffect(() => {
    const handleReset = () => {
      setIsProcessingPayment(false);
    };

    window.addEventListener("pageshow", handleReset);
    window.addEventListener("focus", handleReset);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setIsProcessingPayment(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", handleReset);
      window.removeEventListener("focus", handleReset);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);


  // Add / Edit Address state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<CustomerAddressResponse | null>(null);
  const [deleteAddressError, setDeleteAddressError] = useState<string | null>(null);
  const [newAddressForm, setNewAddressForm] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "Tamil Nadu",
    pincode: "",
    country: "India",
    addressType: "shipping" as "shipping" | "billing",
    isDefault: true,
  });
  const [addressFieldErrors, setAddressFieldErrors] = useState<Record<string, string>>({});
  const [touchedAddressFields, setTouchedAddressFields] = useState<Record<string, boolean>>({});
  const [addressFormError, setAddressFormError] = useState<string | null>(null);

  const isSavingAddress =
    createAddressMutation.isPending || updateAddressMutation.isPending;

  // India Post PIN code verification hook
  const {
    isVerifying: isPincodeVerifying,
    verificationError: pincodeVerificationError,
    postalData: pincodePostalData,
    isVerified: isPincodeVerified,
    verifyPincode,
    resetPincodeVerification,
  } = usePincodeLookup();

  const validateAddressField = (field: string, value: string): string => {
    switch (field) {
      case "fullName": {
        const trimmed = value.trim();
        if (!trimmed) return "Recipient Name is required";
        if (trimmed.length < 2) return "Recipient Name must be at least 2 characters";
        if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) return "Recipient Name can only contain letters and spaces";
        if (trimmed.length > 150) return "Recipient Name cannot exceed 150 characters";
        return "";
      }
      case "phone": {
        const digits = value.replace(/\D/g, "");
        if (!digits) return "Phone Number is required";
        if (!/^[6-9]/.test(digits)) return "Phone number must start with 6, 7, 8, or 9";
        if (digits.length < 10) return "Phone number must be exactly 10 digits";
        return "";
      }
      case "addressLine1": {
        const trimmed = value.trim();
        if (!trimmed) return "Flat / House No., Building, Street is required";
        if (trimmed.length < 3) return "Address must be at least 3 characters";
        if (trimmed.length > 255) return "Address cannot exceed 255 characters";
        return "";
      }
      case "city": {
        const trimmed = value.trim();
        if (!trimmed) return "City is required";
        if (trimmed.length < 2) return "City must be at least 2 characters";
        if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) return "City can only contain letters and spaces";
        if (trimmed.length > 100) return "City cannot exceed 100 characters";
        return "";
      }
      case "pincode": {
        const digits = value.replace(/\D/g, "");
        if (!digits) return "PIN Code is required";
        if (digits.startsWith("0")) return "Invalid PIN code (cannot start with 0)";
        if (digits.length < 6) return "PIN code must be exactly 6 digits";
        return "";
      }
      default:
        return "";
    }
  };

  const handleAddressFieldChange = (field: string, rawValue: string | boolean) => {
    let value = rawValue;

    // Enforce numbers-only constraint and max length while typing
    if (field === "phone" && typeof rawValue === "string") {
      value = rawValue.replace(/\D/g, "").slice(0, 10);
    } else if (field === "pincode" && typeof rawValue === "string") {
      const cleanPin = rawValue.replace(/\D/g, "").slice(0, 6);
      value = cleanPin;

      if (cleanPin.length === 6) {
        verifyPincode(cleanPin).then((result) => {
          if (result) {
            setNewAddressForm((prev) => ({
              ...prev,
              pincode: cleanPin,
              city: result.district || result.city,
              state: result.state,
            }));
            setAddressFieldErrors((prev) => {
              const next = { ...prev };
              delete next.pincode;
              delete next.city;
              delete next.state;
              return next;
            });
          } else {
            setAddressFieldErrors((prev) => ({
              ...prev,
              pincode: "Invalid PIN code. No records found in India Post database.",
            }));
            setNewAddressForm((prev) => ({
              ...prev,
              pincode: cleanPin,
              city: "",
              state: "",
            }));
          }
        });
      } else {
        resetPincodeVerification();
      }
    }

    setNewAddressForm((prev) => ({ ...prev, [field]: value }));
    setTouchedAddressFields((prev) => ({ ...prev, [field]: true }));

    if (typeof value === "string") {
      const errorMsg = validateAddressField(field, value);
      setAddressFieldErrors((prev) => {
        const next = { ...prev };
        if (errorMsg) {
          next[field] = errorMsg;
        } else {
          delete next[field];
        }
        return next;
      });
    }

    if (addressFormError) {
      setAddressFormError(null);
    }
  };

  const handleAddressFieldBlur = (field: string) => {
    setTouchedAddressFields((prev) => ({ ...prev, [field]: true }));
    const val = String((newAddressForm as any)[field] || "");
    const errorMsg = validateAddressField(field, val);
    setAddressFieldErrors((prev) => {
      const next = { ...prev };
      if (errorMsg) {
        next[field] = errorMsg;
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const handleCloseAddressForm = () => {
    setIsAddingAddress(false);
    setEditingAddressId(null);
    resetPincodeVerification();
    setAddressFieldErrors({});
    setTouchedAddressFields({});
    setAddressFormError(null);
    setNewAddressForm({
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      landmark: "",
      city: "",
      state: "Tamil Nadu",
      pincode: "",
      country: "India",
      addressType: "shipping",
      isDefault: addresses.length === 0,
    });
  };

  const handleStartAddAddress = () => {
    handleCloseAddressForm();
    setIsAddingAddress(true);
    setEditingAddressId(null);
    setNewAddressForm((prev) => ({
      ...prev,
      isDefault: addresses.length === 0,
    }));
  };

  const handleStartEditAddress = (
    addr: CustomerAddressResponse,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    setEditingAddressId(addr.id);
    setIsAddingAddress(true);
    setAddressFormError(null);
    setAddressFieldErrors({});
    setTouchedAddressFields({});

    const rawPhone = addr.phone
      ? addr.phone.replace(/^\+91/, "").replace(/\D/g, "").slice(-10)
      : "";

    setNewAddressForm({
      fullName: addr.fullName || "",
      phone: rawPhone,
      addressLine1: addr.addressLine1 || "",
      addressLine2: addr.addressLine2 || "",
      landmark: addr.landmark || "",
      city: addr.city || "",
      state: addr.state || "Tamil Nadu",
      pincode: addr.pincode || "",
      country: addr.country || "India",
      addressType: (addr.addressType as "shipping" | "billing") || "shipping",
      isDefault: Boolean(addr.isDefault),
    });

    if (addr.pincode && addr.pincode.trim().length === 6) {
      verifyPincode(addr.pincode.trim());
    } else {
      resetPincodeVerification();
    }
  };

  const handlePromptDeleteAddress = (
    addr: CustomerAddressResponse,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setDeleteAddressError(null);
    setAddressToDelete(addr);
  };

  const handleConfirmDeleteAddress = async () => {
    if (!addressToDelete) return;
    setDeleteAddressError(null);

    try {
      const targetId = addressToDelete.id;
      await deleteAddressMutation.mutateAsync(targetId);

      // If the deleted address was currently selected or effective, switch selection
      if (selectedAddressId === targetId || effectiveAddressId === targetId) {
        const remaining = addresses.filter((a) => a.id !== targetId);
        const nextDefault = remaining.find((a) => a.isDefault);
        if (nextDefault) {
          setSelectedAddressId(nextDefault.id);
        } else if (remaining.length > 0) {
          setSelectedAddressId(remaining[0].id);
        } else {
          setSelectedAddressId("");
        }
      }

      // If the address was currently being edited, close the edit form
      if (editingAddressId === targetId) {
        handleCloseAddressForm();
      }

      setAddressToDelete(null);
    } catch (err: any) {
      setDeleteAddressError(
        err.message || "Failed to delete address. Please try again."
      );
    }
  };


  // Effective selected address (fall back to default or first available)
  const effectiveAddressId = useMemo(() => {
    if (selectedAddressId && addresses.some((a) => a.id === selectedAddressId)) {
      return selectedAddressId;
    }
    const defaultAddr = addresses.find((a) => a.isDefault);
    if (defaultAddr) return defaultAddr.id;
    if (addresses.length > 0) return addresses[0].id;
    return "";
  }, [selectedAddressId, addresses]);

  // Pricing and weight calculations
  const items = cart?.items || [];
  const subtotal = Number(cart?.subtotal || 0);
  const discount = Number(cart?.totalDiscount ?? cart?.totalSavings ?? 0);
  const payableBeforeShipping = Math.max(0, subtotal - discount);

  // Cart total weight in kg
  const totalWeightKg = useMemo(() => {
    if (cart?.totalWeightKg && cart.totalWeightKg > 0) {
      return cart.totalWeightKg;
    }
    const computed = items.reduce(
      (sum, it) => sum + (it.weightKg ?? 0.5) * it.quantity,
      0
    );
    return Number(computed.toFixed(2));
  }, [cart?.totalWeightKg, items]);

  const selectedAddress = useMemo(() => {
    return (
      addresses.find(
        (a) => a.id === effectiveAddressId || (a as any).uuid === effectiveAddressId
      ) || null
    );
  }, [addresses, effectiveAddressId]);

  const deliveryPincode = selectedAddress?.pincode?.trim() || "";

  const [liveShiprocketQuote, setLiveShiprocketQuote] = useState<{
    rate: number;
    courierName: string;
    etd: string;
  } | null>(null);
  const [isLoadingShiprocketQuote, setIsLoadingShiprocketQuote] = useState(false);
  const [isShiprocketChecked, setIsShiprocketChecked] = useState(false);
  const [isShiprocketAvailable, setIsShiprocketAvailable] = useState(false);
  const [shiprocketErrorMessage, setShiprocketErrorMessage] = useState<string | null>(null);

  const stBillableKg = Math.max(1, Math.ceil(totalWeightKg));

  useEffect(() => {
    if (!deliveryPincode || !/^\d{6}$/.test(deliveryPincode)) {
      setLiveShiprocketQuote(null);
      setIsShiprocketChecked(false);
      setIsShiprocketAvailable(false);
      setShiprocketErrorMessage(null);
      setIsLoadingShiprocketQuote(false);
      return;
    }

    let isMounted = true;
    setIsLoadingShiprocketQuote(true);
    setShiprocketErrorMessage(null);

    const codParam = paymentMethod === "COD" ? "&cod=1" : "";
    fetch(
      `/api/shipping/serviceability?pincode=${encodeURIComponent(
        deliveryPincode
      )}&weight=${totalWeightKg}${codParam}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setIsShiprocketChecked(true);
        if (
          data &&
          data.success &&
          data.isServiceable &&
          data.recommendedCourier &&
          data.recommendedCourier.rate > 0
        ) {
          setLiveShiprocketQuote({
            rate: Math.ceil(data.recommendedCourier.rate),
            courierName: data.recommendedCourier.name || "Shiprocket Express",
            etd: data.recommendedCourier.etd || "2 - 5 days",
          });
          setIsShiprocketAvailable(true);
          setShiprocketErrorMessage(null);
        } else {
          // API failed or PIN code is not serviceable: mark unavailable, never fallback to default rate!
          setLiveShiprocketQuote(null);
          setIsShiprocketAvailable(false);
          setShiprocketErrorMessage(
            data?.error || "Shiprocket delivery is unavailable for this PIN code."
          );
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setIsShiprocketChecked(true);
        setLiveShiprocketQuote(null);
        setIsShiprocketAvailable(false);
        setShiprocketErrorMessage(
          "Delivery service check failed. Shiprocket is unavailable."
        );
      })
      .finally(() => {
        if (isMounted) setIsLoadingShiprocketQuote(false);
      });

    return () => {
      isMounted = false;
    };
  }, [deliveryPincode, totalWeightKg, paymentMethod]);

  // If Shiprocket is unavailable for this PIN code, safely fall back to ST Courier / Online Payment
  useEffect(() => {
    if (isShiprocketChecked && !isShiprocketAvailable) {
      if (paymentMethod === "COD") {
        setPaymentMethod("CARD");
        setCourierType("st_courier");
        setCheckoutError(
          deliveryPincode
            ? `Cash on Delivery is unavailable because Shiprocket delivery is not available for PIN ${deliveryPincode}. Switched to Online Payment with ST Courier.`
            : "Cash on Delivery is unavailable. Switched to Online Payment with ST Courier."
        );
      } else if (courierType === "shiprocket") {
        setCourierType("st_courier");
      }
    }
  }, [isShiprocketChecked, isShiprocketAvailable, paymentMethod, courierType, deliveryPincode]);

  const stShippingCharge = stBillableKg * 40;
  const shiprocketShippingCharge =
    isShiprocketAvailable && liveShiprocketQuote ? liveShiprocketQuote.rate : null;
  const mssShippingCharge = Math.max(1, Math.ceil(totalWeightKg / 20)) * 200;

  const baseShippingCharge =
    courierType === "mss"
      ? mssShippingCharge
      : courierType === "shiprocket"
      ? (shiprocketShippingCharge ?? 0)
      : stShippingCharge;
  const isWhatsApp = paymentMethod === "WHATSAPP";
  const isCall = paymentMethod === "CALL";
  const isShippingWaived = isWhatsApp || isCall;
  const shippingCharge = isShippingWaived ? 0 : baseShippingCharge;
  const grandTotal = payableBeforeShipping + shippingCharge;
  const isSelectedCourierUnavailable =
    courierType === "shiprocket" && isShiprocketChecked && !isShiprocketAvailable;

  // Authentication gate
  if (authStatus === "loading" || (cartLoading && !cart) || addressesLoading) {
    return <CheckoutSkeleton />;
  }

  if (authStatus === "unauthenticated" || !session) {
    router.push("/login?callbackUrl=/checkout");
    return null;
  }

  // Order placed confirmation guard (prevents flashing empty cart screen)
  if (isOrderPlaced) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center space-y-4 animate-in fade-in duration-300">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 border border-emerald-300 text-emerald-600 shadow-sm animate-in zoom-in-75 duration-300">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-theme-text-primary">
          Order Placed Successfully!
        </h2>
        <p className="text-xs sm:text-sm text-theme-text-subtle">
          Finalizing your order confirmation... Please wait.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-theme-text-muted pt-2">
          <Loader2 className="h-4 w-4 animate-spin text-theme-primary" />
          <span>Preparing your order receipt...</span>
        </div>
      </div>
    );
  }

  // With redirect flow, pendingOrder is always null — this guard is kept for safety.
  if (pendingOrder && !isOrderPlaced) {
    return null;
  }

  // Empty cart guard
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-theme-surface-alt border border-theme-border text-theme-primary">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-theme-text-primary mb-2">
          Your Cart is Empty
        </h1>
        <p className="text-theme-text-subtle mb-6 text-sm max-w-md mx-auto">
          Explore our authentic Kolli Hills spices, herbs, and natural hill produce to
          proceed with your order.
        </p>
        <Link href="/products">
          <Button className="min-h-[44px] px-6 rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-white font-semibold shadow-sm">
            Browse Authentic Products
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }


  // Handle address form creation or update
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressFormError(null);

    // Mark all required fields as touched on submit
    setTouchedAddressFields({
      fullName: true,
      phone: true,
      addressLine1: true,
      city: true,
      pincode: true,
    });

    const errors: Record<string, string> = {};
    const nameErr = validateAddressField("fullName", newAddressForm.fullName);
    if (nameErr) errors.fullName = nameErr;

    const phoneErr = validateAddressField("phone", newAddressForm.phone);
    if (phoneErr) errors.phone = phoneErr;

    const addrErr = validateAddressField("addressLine1", newAddressForm.addressLine1);
    if (addrErr) errors.addressLine1 = addrErr;

    const cityErr = validateAddressField("city", newAddressForm.city);
    if (cityErr) errors.city = cityErr;

    const pinErr = validateAddressField("pincode", newAddressForm.pincode);
    if (pinErr) {
      errors.pincode = pinErr;
    } else if (!isPincodeVerified) {
      const verified = await verifyPincode(newAddressForm.pincode);
      if (!verified) {
        errors.pincode = "Invalid PIN code. No records found in India Post database.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setAddressFieldErrors(errors);
      return;
    }

    try {
      const cleanPhone = `+91${newAddressForm.phone.replace(/\D/g, "").slice(-10)}`;

      if (editingAddressId) {
        // UPDATE EXISTING ADDRESS
        const updated = await updateAddressMutation.mutateAsync({
          uuid: editingAddressId,
          data: {
            fullName: newAddressForm.fullName.trim(),
            phone: cleanPhone,
            addressLine1: newAddressForm.addressLine1.trim(),
            addressLine2: newAddressForm.addressLine2.trim() || null,
            landmark: newAddressForm.landmark.trim() || null,
            city: newAddressForm.city.trim(),
            state: newAddressForm.state.trim() || "Tamil Nadu",
            pincode: newAddressForm.pincode.trim(),
            country: "India",
            addressType: newAddressForm.addressType,
            isDefault: newAddressForm.isDefault,
          },
        });

        setSelectedAddressId(updated.id);
        handleCloseAddressForm();
      } else {
        // CREATE NEW ADDRESS
        const created = await createAddressMutation.mutateAsync({
          fullName: newAddressForm.fullName.trim(),
          phone: cleanPhone,
          addressLine1: newAddressForm.addressLine1.trim(),
          addressLine2: newAddressForm.addressLine2.trim() || undefined,
          landmark: newAddressForm.landmark.trim() || undefined,
          city: newAddressForm.city.trim(),
          state: newAddressForm.state.trim() || "Tamil Nadu",
          pincode: newAddressForm.pincode.trim(),
          country: "India",
          addressType: "shipping",
          isDefault: newAddressForm.isDefault,
        });

        setSelectedAddressId(created.id);
        handleCloseAddressForm();
      }
    } catch (err: any) {
      setAddressFormError(
        err.message || (editingAddressId ? "Failed to update address" : "Failed to save address")
      );
    }
  };

  // Launch in-app Razorpay payment modal
  const launchInAppRazorpayPayment = async (targetAddressId?: string) => {
    if (isAdminUser) {
      setCheckoutError("You are admin kindly comes with customer login");
      return;
    }

    setIsProcessingPayment(true);
    setCheckoutError(null);

    const shippingId = targetAddressId || effectiveAddressId;
    if (!shippingId) {
      setIsProcessingPayment(false);
      setCheckoutError("Please select or add a delivery address first.");
      return;
    }

    try {
      // 1. Ensure Razorpay SDK script is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setIsProcessingPayment(false);
        setCheckoutError(
          "Unable to load Razorpay payment gateway. Please check your internet connection."
        );
        return;
      }

      // 1b. Pre-payment stock validation — catch issues before Razorpay opens
      try {
        const stockRes = await fetch("/api/customer/cart/validate-stock", {
          method: "POST",
          credentials: "include",
        });
        if (!stockRes.ok) {
          const stockData = await stockRes.json().catch(() => ({}));
          setIsProcessingPayment(false);
          setCheckoutError(
            stockData?.message ||
            "Some items in your cart are no longer available. Please update your cart."
          );
          return;
        }
      } catch {
        // Network error — allow through, server will catch it at verify
      }

      // 2. Call backend to create Razorpay order for current cart
      const rzpOrder = await createRazorpayOrderMutation.mutateAsync({
        orderId: "cart",
        shippingAddressId: shippingId,
        courierType,
      });


      // 3. Find recipient info for prefill
      const selectedAddr = addresses.find(
        (a) => a.id === shippingId || (a as any).uuid === shippingId
      );

      const options = {
        key: rzpOrder.keyId,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency || "INR",
        name: "Kollimalai Arasan",
        description: "Pure Hills Spices & Farm Products",
        order_id: rzpOrder.razorpayOrderId,
        prefill: {
          name: selectedAddr ? selectedAddr.fullName : (session?.user?.name || ""),
          contact: selectedAddr ? selectedAddr.phone : "",
          email: session?.user?.email || "",
        },
        theme: {
          color: "#16a34a",
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
            setCheckoutError("Payment was cancelled. Your cart items are still saved.");
          },
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            setIsProcessingPayment(false);
            setIsVerifyingPayment(true);

            // 4. Server-side HMAC-SHA256 signature verification & order creation
            const verifyResult = await verifyRazorpayPaymentMutation.mutateAsync({
              orderId: "cart",
              shippingAddressId: shippingId,
              billingAddressId: shippingId,
              notes: orderNotes.trim() || undefined,
              courierType,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setIsOrderPlaced(true);
            queryClient.invalidateQueries({ queryKey: CUSTOMER_ORDERS_QUERY_KEY, refetchType: "all" });
            queryClient.invalidateQueries({ queryKey: ["customer", "cart"], refetchType: "all" });
            queryClient.invalidateQueries({ queryKey: ["cart"], refetchType: "all" });

            const params = new URLSearchParams();
            if (verifyResult.orderId) {
              params.set("orderId", String(verifyResult.orderId));
            }
            if (verifyResult.orderNumber) {
              params.set("orderNumber", String(verifyResult.orderNumber));
            }
            router.push(`/checkout/success${params.toString() ? `?${params.toString()}` : ""}`);
          } catch (err: any) {
            setIsVerifyingPayment(false);
            setCheckoutError(
              err.message || "Payment verification failed. Please contact customer support."
            );
          }
        },
      };

      const rzpInstance = new (window as any).Razorpay(options);
      rzpInstance.on("payment.failed", function (response: any) {
        setIsProcessingPayment(false);
        setCheckoutError(
          response?.error?.description || "Payment was declined. Please try another payment method."
        );
      });
      rzpInstance.open();
    } catch (err: any) {
      setIsProcessingPayment(false);
      setCheckoutError(
        err.message || "Failed to initiate payment. Please check your details and try again."
      );
    }
  };

  // WhatsApp Order Handler
  const handleOrderByWhatsApp = () => {
    if (!effectiveAddressId) {
      setCheckoutError("Please select or add a delivery address to place your order.");
      return;
    }

    const selectedAddr = addresses.find((a) => a.id === effectiveAddressId);
    const courierName =
      courierType === "mss"
        ? "Mettur Super Services (MSS)"
        : courierType === "shiprocket"
        ? "Shiprocket Express (All India)"
        : "ST Courier";

    let msg = `*NEW ORDER INQUIRY - KOLLIMALAI ARASAN*\n\n`;
    msg += `*Items Ordered:*\n`;
    items.forEach((it, idx) => {
      const vText = it.variantName ? ` (${it.variantName})` : "";
      msg += `${idx + 1}. *${it.productName}*${vText} × ${it.quantity} = ₹${it.itemTotal}\n`;
    });
    msg += `\n*Cart Weight:* ${totalWeightKg} kg\n`;
    msg += `*Subtotal:* ₹${subtotal}\n`;
    if (discount > 0) {
      msg += `*Discount:* -₹${discount}\n`;
    }
    msg += `*Selected Courier:* ${courierName} (Waived at checkout · Calculated on WhatsApp)\n`;
    msg += `*Total Amount (Items Subtotal):* ₹${grandTotal}\n`;
    msg += `*(Shipping charges will be calculated and confirmed on WhatsApp based on delivery location)*\n\n`;

    if (selectedAddr) {
      msg += `*Delivery Address:*\n`;
      msg += `Name: ${selectedAddr.fullName}\n`;
      msg += `Phone: ${selectedAddr.phone}\n`;
      msg += `Address: ${selectedAddr.addressLine1}${selectedAddr.addressLine2 ? `, ${selectedAddr.addressLine2}` : ""}\n`;
      msg += `City, State: ${selectedAddr.city}, ${selectedAddr.state} - ${selectedAddr.pincode}\n\n`;
    }

    if (orderNotes.trim()) {
      msg += `*Customer Note:* ${orderNotes.trim()}\n\n`;
    }
    msg += `Please confirm my order and share details. Thank you!`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${KOLLIMALAI_WHATSAPP_NUMBER}?text=${encoded}`, "_blank");
  };

  // Call Order Handler
  const handleOrderByCall = () => {
    window.location.href = `tel:+${KOLLIMALAI_CALL_NUMBER}`;
  };

  // Cash on Delivery (COD) Order Handler
  const handlePlaceCodOrder = async () => {
    if (isAdminUser) {
      setCheckoutError("You are admin kindly comes with customer login");
      return;
    }

    if (!effectiveAddressId) {
      setCheckoutError("Please select or add a delivery address to proceed.");
      return;
    }

    if (isShiprocketChecked && !isShiprocketAvailable) {
      setCheckoutError(
        deliveryPincode
          ? `Cash on Delivery is unavailable because Shiprocket delivery is not available for PIN ${deliveryPincode}. Please select Online Payment.`
          : "Cash on Delivery is unavailable. Please select Online Payment."
      );
      return;
    }

    setIsPlacingCodOrder(true);
    setCheckoutError(null);

    try {
      // 1. Pre-order stock validation — ensure no out-of-stock items
      try {
        const stockRes = await fetch("/api/customer/cart/validate-stock", {
          method: "POST",
          credentials: "include",
        });
        if (!stockRes.ok) {
          const stockData = await stockRes.json().catch(() => ({}));
          setIsPlacingCodOrder(false);
          setCheckoutError(
            stockData?.message ||
              "Some items in your cart are no longer available. Please update your cart."
          );
          return;
        }
      } catch {
        // Network error — backend will catch stock validation in transaction
      }

      // 2. Create customer order with COD (courier partner is forced to Shiprocket)
      const createdOrder = await createOrderMutation.mutateAsync({
        shippingAddressId: effectiveAddressId,
        billingAddressId: effectiveAddressId,
        notes: orderNotes.trim() || undefined,
        paymentMethod: "COD",
        courierType: "shiprocket",
      });

      setIsOrderPlaced(true);
      queryClient.invalidateQueries({ queryKey: CUSTOMER_ORDERS_QUERY_KEY, refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["customer", "cart"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["cart"], refetchType: "all" });

      const params = new URLSearchParams();
      if (createdOrder.id) {
        params.set("orderId", String(createdOrder.id));
      }
      if (createdOrder.orderNumber) {
        params.set("orderNumber", String(createdOrder.orderNumber));
      }
      router.push(`/checkout/success${params.toString() ? `?${params.toString()}` : ""}`);
    } catch (err: any) {
      setIsPlacingCodOrder(false);
      setCheckoutError(
        err.message || "Failed to place Cash on Delivery order. Please try again."
      );
    }
  };

  // Place Order Handler
  const handlePlaceOrder = async () => {
    setCheckoutError(null);

    if (isAdminUser) {
      setCheckoutError("You are admin kindly comes with customer login");
      return;
    }

    if (!effectiveAddressId) {
      setCheckoutError("Please select or add a delivery address to proceed.");
      return;
    }

    if (courierType === "shiprocket" && isShiprocketChecked && !isShiprocketAvailable) {
      setCheckoutError(
        deliveryPincode
          ? `Shiprocket Express is currently unavailable for PIN ${deliveryPincode}. Please select ST Courier or MSS Cargo.`
          : "Shiprocket Express is currently unavailable. Please select ST Courier or MSS Cargo."
      );
      return;
    }

    if (
      isProcessingPayment ||
      isVerifyingPayment ||
      isPlacingCodOrder ||
      createOrderMutation.isPending
    ) {
      return;
    }

    if (paymentMethod === "WHATSAPP") {
      handleOrderByWhatsApp();
      return;
    }

    if (paymentMethod === "CALL") {
      handleOrderByCall();
      return;
    }

    if (paymentMethod === "COD") {
      await handlePlaceCodOrder();
      return;
    }

    // Online Payment (Razorpay) — Opens in-app modal popup
    await launchInAppRazorpayPayment(effectiveAddressId);
  };


  return (
    <div className="container mx-auto px-4 py-8 sm:py-10 max-w-7xl">
      {/* Header & Steps */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-theme-text-subtle mb-2">
          <Link
            href="/cart"
            className="hover:text-theme-primary transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to Cart
          </Link>
          <span>/</span>
          <span className="text-theme-primary font-bold">Checkout</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-theme-text-primary">
              Checkout & Payment
            </h1>
            <p className="text-xs sm:text-sm text-theme-text-subtle mt-0.5">
              Review your delivery address, choose a shipping option, and complete
              your simulated payment.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold bg-theme-surface-alt border border-theme-border px-3.5 py-1.5 rounded-full text-theme-text-subtle self-start sm:self-auto">
            <ShieldCheck className="h-4 w-4 text-theme-secondary" />
            <span>256-Bit SSL Encrypted</span>
          </div>
        </div>
      </div>

      {/* Admin Warning Banner */}
      {isAdminUser && (
        <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-5 text-amber-950 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm sm:text-base font-bold text-amber-900">
              You are admin kindly comes with customer login
            </h3>
            <p className="text-xs sm:text-sm text-amber-800 mt-1 leading-relaxed">
              Admin accounts can browse products, add items to cart, and test shopping cart features, but cannot place orders or execute payments. Please sign in with a customer account to purchase.
            </p>
          </div>
        </div>
      )}

      {checkoutError && (
        <div className="mb-6 rounded-2xl border border-error-200 bg-error-50 p-4 text-sm text-error-700 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-error-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to complete checkout</p>
            <p className="text-xs mt-0.5">{checkoutError}</p>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & Steps (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Delivery Address Card */}
          <div className="rounded-2xl border border-theme-border bg-theme-surface shadow-xs p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-theme-border-subtle">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme-surface-alt border border-theme-border text-theme-primary font-bold text-xs">
                  1
                </span>
                <h2 className="text-base sm:text-lg font-bold text-theme-text-primary flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-theme-secondary" />
                  Delivery Address
                </h2>
              </div>

              {!isAddingAddress && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleStartAddAddress}
                  className="rounded-xl border-theme-border text-xs font-bold text-theme-primary hover:bg-theme-surface-alt min-h-[36px]"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add New
                </Button>
              )}
            </div>

            {/* Address Selection List */}
            {!isAddingAddress && (
              <div className="space-y-3">
                {addresses.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-theme-border p-6 text-center">
                    <p className="text-sm font-semibold text-theme-text-primary mb-1">
                      No saved addresses found
                    </p>
                    <p className="text-xs text-theme-text-subtle mb-4">
                      Please add your delivery address to receive freshly packed
                      products.
                    </p>
                    <Button
                      type="button"
                      onClick={handleStartAddAddress}
                      className="min-h-[44px] rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-white text-xs font-semibold px-4"
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      Add Delivery Address
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {addresses.map((addr) => {
                      const isSelected = effectiveAddressId === addr.id;
                      const isBeingEdited = editingAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`group relative rounded-xl border p-4 cursor-pointer transition-all flex flex-col justify-between ${isSelected
                            ? "border-theme-primary bg-theme-surface-alt/70 shadow-xs ring-1 ring-theme-primary"
                            : isBeingEdited
                            ? "border-amber-400 bg-amber-50/20"
                            : "border-theme-border bg-theme-surface hover:border-theme-border-accent hover:bg-theme-surface-warm"
                            }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${isSelected
                                    ? "border-theme-primary bg-theme-primary text-white"
                                    : "border-theme-border-input bg-white"
                                    }`}
                                >
                                  {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                                </span>
                                <span className="font-bold text-sm text-theme-text-primary line-clamp-1">
                                  {addr.fullName}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isBeingEdited && (
                                  <span className="rounded-md bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-extrabold">
                                    Editing
                                  </span>
                                )}
                                {addr.isDefault && (
                                  <span className="shrink-0 rounded-md bg-theme-status-del-bg px-2 py-0.5 text-[10px] font-extrabold text-theme-status-del-fg">
                                    Default
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-xs text-theme-text-subtle space-y-1 pl-6">
                              <p className="line-clamp-2">
                                {addr.addressLine1}
                                {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                              </p>
                              {addr.landmark && (
                                <p className="text-[11px] text-theme-text-muted italic">
                                  Landmark: {addr.landmark}
                                </p>
                              )}
                              <p>
                                {addr.city}, {addr.state} - {addr.pincode}
                              </p>
                              <p className="flex items-center gap-1 text-theme-text-muted pt-0.5">
                                <Phone className="h-3 w-3" />
                                {addr.phone}
                              </p>
                            </div>
                          </div>

                          {/* Address Card Actions: Set Default, Edit, Delete */}
                          <div className="flex items-center justify-between pt-3 mt-3 border-t border-theme-border-subtle pl-6">
                            <div>
                              {!addr.isDefault ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateAddressMutation.mutate({
                                      uuid: addr.id,
                                      data: { isDefault: true },
                                    });
                                  }}
                                  disabled={updateAddressMutation.isPending || deleteAddressMutation.isPending}
                                  className="text-[11px] font-semibold text-theme-primary hover:text-theme-primary-hover hover:underline cursor-pointer disabled:opacity-50"
                                >
                                  Set as default
                                </button>
                              ) : null}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => handleStartEditAddress(addr, e)}
                                disabled={updateAddressMutation.isPending || deleteAddressMutation.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-theme-border text-theme-text-secondary bg-theme-surface hover:bg-theme-surface-alt hover:text-theme-primary transition-colors cursor-pointer disabled:opacity-50"
                                title="Edit Address"
                              >
                                <Pencil className="h-3 w-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handlePromptDeleteAddress(addr, e)}
                                disabled={updateAddressMutation.isPending || deleteAddressMutation.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-error-200 text-error-600 bg-error-50/50 hover:bg-error-50 hover:text-error-700 transition-colors cursor-pointer disabled:opacity-50"
                                title="Delete Address"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Inline Add / Edit Address Form */}
            {isAddingAddress && (
              <form
                onSubmit={handleSaveAddress}
                noValidate
                className="rounded-xl border border-theme-border bg-theme-surface-warm p-4 sm:p-5 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-theme-border pb-2.5">
                  <div>
                    <h3 className="text-sm font-bold text-theme-text-primary">
                      {editingAddressId ? "Edit Delivery Address" : "New Delivery Address"}
                    </h3>
                    <p className="text-[11px] text-theme-text-muted mt-0.5">
                      {editingAddressId
                        ? "Update your recipient details or PIN code below."
                        : "Enter your complete delivery address for courier dispatch."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseAddressForm}
                    className="p-1 rounded-lg text-theme-text-subtle hover:text-theme-text-primary hover:bg-theme-surface-alt transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {addressFormError && (
                  <div className="rounded-lg bg-error-50 border border-error-200 p-2.5 text-xs text-error-600 font-medium">
                    {addressFormError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-theme-text-secondary mb-1">
                      Recipient Name <span className="text-error-600 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={newAddressForm.fullName}
                      onChange={(e) =>
                        handleAddressFieldChange("fullName", e.target.value)
                      }
                      onBlur={() => handleAddressFieldBlur("fullName")}
                      aria-invalid={touchedAddressFields.fullName && !!addressFieldErrors.fullName}
                      className={`w-full min-h-[44px] rounded-xl border bg-white px-3 text-xs text-theme-text-primary placeholder:text-theme-text-muted focus:outline-none transition-colors ${touchedAddressFields.fullName && addressFieldErrors.fullName
                        ? "border-error-500 bg-error-50/20 focus:border-error-500"
                        : "border-theme-border-input focus:border-theme-primary"
                        }`}
                    />
                    {touchedAddressFields.fullName && addressFieldErrors.fullName && (
                      <p className="mt-1 text-xs text-error-600 font-medium">
                        {addressFieldErrors.fullName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-theme-text-secondary mb-1">
                      Phone Number (10 digits) <span className="text-error-600 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={newAddressForm.phone}
                      onChange={(e) =>
                        handleAddressFieldChange("phone", e.target.value)
                      }
                      onBlur={() => handleAddressFieldBlur("phone")}
                      aria-invalid={touchedAddressFields.phone && !!addressFieldErrors.phone}
                      className={`w-full min-h-[44px] rounded-xl border bg-white px-3 text-xs text-theme-text-primary placeholder:text-theme-text-muted focus:outline-none transition-colors ${touchedAddressFields.phone && addressFieldErrors.phone
                        ? "border-error-500 bg-error-50/20 focus:border-error-500"
                        : "border-theme-border-input focus:border-theme-primary"
                        }`}
                    />
                    {touchedAddressFields.phone && addressFieldErrors.phone && (
                      <p className="mt-1 text-xs text-error-600 font-medium">
                        {addressFieldErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* PIN Code with India Post Live Lookup */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-theme-text-secondary">
                        PIN Code (6 digits) <span className="text-error-600 font-bold ml-0.5">*</span>
                      </label>
                      {isPincodeVerifying && (
                        <span className="flex items-center gap-1 text-[11px] text-theme-primary font-medium">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Checking India Post...
                        </span>
                      )}
                      {isPincodeVerified && pincodePostalData && (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                          <CheckCircle2 className="h-3 w-3" />
                          Verified ({pincodePostalData.district}, {pincodePostalData.state})
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Enter 6-digit PIN code (e.g. 607106)"
                        value={newAddressForm.pincode}
                        onChange={(e) =>
                          handleAddressFieldChange("pincode", e.target.value)
                        }
                        onBlur={() => handleAddressFieldBlur("pincode")}
                        aria-invalid={touchedAddressFields.pincode && !!(addressFieldErrors.pincode || pincodeVerificationError)}
                        className={`w-full min-h-[44px] rounded-xl border bg-white px-3 pr-10 text-xs text-theme-text-primary placeholder:text-theme-text-muted focus:outline-none transition-colors ${touchedAddressFields.pincode && (addressFieldErrors.pincode || pincodeVerificationError)
                          ? "border-error-500 bg-error-50/20 focus:border-error-500"
                          : isPincodeVerified
                            ? "border-emerald-500 focus:border-emerald-600"
                            : "border-theme-border-input focus:border-theme-primary"
                          }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        {isPincodeVerifying ? (
                          <Loader2 className="h-4 w-4 animate-spin text-theme-primary" />
                        ) : isPincodeVerified ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : null}
                      </div>
                    </div>
                    {(touchedAddressFields.pincode && addressFieldErrors.pincode) || pincodeVerificationError ? (
                      <p className="mt-1 text-xs text-error-600 font-medium">
                        {addressFieldErrors.pincode || pincodeVerificationError}
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] text-theme-text-muted">
                        Enter your 6-digit PIN code to automatically verify and fill City & State.
                      </p>
                    )}
                  </div>

                  {/* Locality / Post Office Selection (when multiple post offices exist) */}
                  {pincodePostalData?.postOffices && pincodePostalData.postOffices.length > 0 && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-theme-text-secondary mb-1">
                        Select Post Office / Locality ({pincodePostalData.postOffices.length} found)
                      </label>
                      <Select
                        value={newAddressForm.addressLine2}
                        onValueChange={(val) => handleAddressFieldChange("addressLine2", val)}
                        placeholder="-- Choose your nearest Post Office / Area --"
                        options={pincodePostalData.postOffices.map((po) => ({
                          value: po.name,
                          label: `${po.name} (${po.branchType} • ${po.deliveryStatus})`,
                        }))}
                        size="md"
                      />
                      <p className="mt-1 text-[11px] text-theme-text-muted">
                        Selecting your post office helps delivery executives locate your address accurately.
                      </p>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-theme-text-secondary mb-1">
                      Flat / House No., Building, Street <span className="text-error-600 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 42, Sri Krishna Nagar, Main Road"
                      value={newAddressForm.addressLine1}
                      onChange={(e) =>
                        handleAddressFieldChange("addressLine1", e.target.value)
                      }
                      onBlur={() => handleAddressFieldBlur("addressLine1")}
                      aria-invalid={touchedAddressFields.addressLine1 && !!addressFieldErrors.addressLine1}
                      className={`w-full min-h-[44px] rounded-xl border bg-white px-3 text-xs text-theme-text-primary placeholder:text-theme-text-muted focus:outline-none transition-colors ${touchedAddressFields.addressLine1 && addressFieldErrors.addressLine1
                        ? "border-error-500 bg-error-50/20 focus:border-error-500"
                        : "border-theme-border-input focus:border-theme-primary"
                        }`}
                    />
                    {touchedAddressFields.addressLine1 && addressFieldErrors.addressLine1 && (
                      <p className="mt-1 text-xs text-error-600 font-medium">
                        {addressFieldErrors.addressLine1}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-theme-text-secondary mb-1">
                      Area / Locality / Street Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Near Old Bus Stand, North Street"
                      value={newAddressForm.addressLine2}
                      onChange={(e) =>
                        handleAddressFieldChange("addressLine2", e.target.value)
                      }
                      className="w-full min-h-[44px] rounded-xl border border-theme-border-input bg-white px-3 text-xs text-theme-text-primary placeholder:text-theme-text-muted focus:outline-none focus:border-theme-primary transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-theme-text-secondary mb-1">
                      Landmark / Nearby Place (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Near Amman Temple, Opposite Primary Health Centre"
                      value={newAddressForm.landmark}
                      onChange={(e) =>
                        handleAddressFieldChange("landmark", e.target.value)
                      }
                      className="w-full min-h-[44px] rounded-xl border border-theme-border-input bg-white px-3 text-xs text-theme-text-primary placeholder:text-theme-text-muted focus:outline-none focus:border-theme-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-theme-text-secondary mb-1">
                      City / District <span className="text-error-600 font-bold ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly={isPincodeVerified}
                        placeholder={isPincodeVerified ? newAddressForm.city : "Enter PIN Code first"}
                        value={newAddressForm.city}
                        onChange={(e) =>
                          handleAddressFieldChange("city", e.target.value)
                        }
                        onBlur={() => handleAddressFieldBlur("city")}
                        aria-invalid={!isPincodeVerified && touchedAddressFields.city && !!addressFieldErrors.city}
                        className={`w-full min-h-[44px] rounded-xl border px-3 text-xs text-theme-text-primary placeholder:text-theme-text-muted focus:outline-none transition-colors ${isPincodeVerified
                          ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 cursor-not-allowed border-theme-border"
                          : touchedAddressFields.city && addressFieldErrors.city
                            ? "border-error-500 bg-error-50/20 focus:border-error-500"
                            : "border-theme-border-input focus:border-theme-primary bg-white"
                          }`}
                      />
                      {isPincodeVerified && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-theme-text-muted">
                          <Lock className="h-3 w-3" />
                          <span>Verified</span>
                        </div>
                      )}
                    </div>
                    {touchedAddressFields.city && addressFieldErrors.city && (
                      <p className="mt-1 text-xs text-error-600 font-medium">
                        {addressFieldErrors.city}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-theme-text-secondary mb-1">
                      State <span className="text-error-600 font-bold ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly={isPincodeVerified}
                        placeholder={isPincodeVerified ? newAddressForm.state : "Enter PIN Code first"}
                        value={newAddressForm.state}
                        onChange={(e) =>
                          handleAddressFieldChange("state", e.target.value)
                        }
                        className={`w-full min-h-[44px] rounded-xl border px-3 text-xs text-theme-text-primary placeholder:text-theme-text-muted focus:outline-none transition-colors ${isPincodeVerified
                          ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 cursor-not-allowed border-theme-border"
                          : "border-theme-border-input focus:border-theme-primary bg-white"
                          }`}
                      />
                      {isPincodeVerified && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-theme-text-muted">
                          <Lock className="h-3 w-3" />
                          <span>Verified</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Set as Default Checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer select-none pt-1 sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={newAddressForm.isDefault}
                      onChange={(e) =>
                        handleAddressFieldChange("isDefault", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-theme-border-input text-theme-primary accent-theme-primary cursor-pointer"
                    />
                    <span className="text-xs font-medium text-theme-text-primary">
                      Set as default delivery address
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-theme-border/60">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isSavingAddress}
                    onClick={handleCloseAddressForm}
                    className="min-h-[40px] text-xs font-semibold rounded-xl text-theme-text-subtle hover:bg-theme-surface-alt"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSavingAddress}
                    className="min-h-[40px] px-5 text-xs font-bold rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-white shadow-xs"
                  >
                    {isSavingAddress ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        {editingAddressId ? "Updating Address..." : "Saving Address..."}
                      </>
                    ) : (
                      editingAddressId ? "Update Address" : "Save Address"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* 2. Courier Selection Card */}
          <div className="rounded-2xl border border-theme-border bg-theme-surface shadow-xs p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-theme-border-subtle">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme-surface-alt border border-theme-border text-theme-primary font-bold text-xs">
                  2
                </span>
                <h2 className="text-base sm:text-lg font-bold text-theme-text-primary flex items-center gap-2">
                  <Truck className="h-4 w-4 text-theme-secondary" />
                  Select Courier Partner
                </h2>
              </div>
              <div className="text-xs font-semibold text-theme-text-subtle bg-theme-surface-alt border border-theme-border px-2.5 py-1 rounded-lg">
                Cart Weight: <span className="font-bold text-theme-text-primary">{totalWeightKg} kg</span>
              </div>
            </div>

            {paymentMethod === "COD" && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">Cash On Delivery (COD) Active:</span> ST Courier and MSS Cargo do not support Cash On Delivery. <strong>Shiprocket Express</strong> is the exclusive courier partner enabled for COD orders.
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* ST Courier */}
              <div
                onClick={() => {
                  if (paymentMethod === "COD") {
                    setCheckoutError(
                      "ST Courier does not support Cash On Delivery (COD). Only Shiprocket Express is available for COD orders."
                    );
                    return;
                  }
                  setCourierType("st_courier");
                }}
                className={`rounded-xl border p-4 transition-all ${
                  paymentMethod === "COD"
                    ? "opacity-50 cursor-not-allowed bg-neutral-100/70 border-dashed border-neutral-300 dark:bg-neutral-800/40 select-none"
                    : courierType === "st_courier"
                    ? "border-theme-primary bg-theme-surface-alt/70 shadow-xs ring-1 ring-theme-primary cursor-pointer"
                    : "border-theme-border bg-theme-surface hover:border-theme-border-accent cursor-pointer"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
                        paymentMethod === "COD"
                          ? "border-neutral-300 bg-neutral-200"
                          : courierType === "st_courier"
                          ? "border-theme-primary bg-theme-primary text-white"
                          : "border-theme-border-input bg-white"
                      }`}
                    >
                      {paymentMethod !== "COD" && courierType === "st_courier" && (
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      )}
                    </span>
                    <span className="text-xs font-bold text-theme-text-primary">
                      ST Courier
                    </span>
                  </div>
                  <div className="text-right">
                    {isShippingWaived ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-theme-text-muted line-through">
                          ₹{stShippingCharge}
                        </span>
                        <span className={cn("text-xs font-black", isWhatsApp ? "text-emerald-600" : "text-blue-600")}>
                          ₹0.00
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-extrabold text-theme-primary">
                        ₹{stShippingCharge}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-theme-text-subtle pl-6">
                  {paymentMethod === "COD"
                    ? "Unavailable for Cash on Delivery"
                    : isWhatsApp
                    ? `Rate: ₹40/kg (${stBillableKg} kg) · Waived / Calculated on WhatsApp`
                    : isCall
                    ? `Rate: ₹40/kg (${stBillableKg} kg) · Waived / Confirmed on Call`
                    : `Rate: ₹40 per kg (${stBillableKg} kg billable)`}
                </p>
                <p className="text-[11px] text-theme-text-muted pl-6 flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  Est. 2 - 4 days
                </p>
              </div>

              {/* Shiprocket All-India Express */}
              <div
                onClick={() => {
                  if (isShiprocketChecked && !isShiprocketAvailable) {
                    setCheckoutError(
                      deliveryPincode
                        ? `Shiprocket Express is currently unavailable for PIN ${deliveryPincode}. Please select ST Courier or MSS Cargo.`
                        : "Shiprocket Express is currently unavailable. Please select ST Courier or MSS Cargo."
                    );
                    return;
                  }
                  setCourierType("shiprocket");
                  setCheckoutError(null);
                }}
                className={cn(
                  "rounded-xl border p-4 transition-all",
                  isShiprocketChecked && !isShiprocketAvailable
                    ? "border-neutral-200 bg-neutral-50/70 opacity-65 cursor-not-allowed"
                    : courierType === "shiprocket"
                    ? "border-theme-primary bg-theme-surface-alt/70 shadow-xs ring-1 ring-theme-primary cursor-pointer"
                    : "border-theme-border bg-theme-surface hover:border-theme-border-accent cursor-pointer"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-full border transition-colors",
                        courierType === "shiprocket" && isShiprocketAvailable
                          ? "border-theme-primary bg-theme-primary text-white"
                          : "border-theme-border-input bg-white"
                      )}
                    >
                      {courierType === "shiprocket" && isShiprocketAvailable && (
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      )}
                    </span>
                    <span className="text-xs font-bold text-theme-text-primary">
                      {liveShiprocketQuote?.courierName
                        ? `Shiprocket (${liveShiprocketQuote.courierName})`
                        : "Shiprocket Express"}
                    </span>
                  </div>
                  <div className="text-right">
                    {isLoadingShiprocketQuote ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-400" />
                    ) : isShiprocketChecked && !isShiprocketAvailable ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                        Unavailable
                      </span>
                    ) : isShippingWaived ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-theme-text-muted line-through">
                          ₹{shiprocketShippingCharge}
                        </span>
                        <span className={cn("text-xs font-black", isWhatsApp ? "text-emerald-600" : "text-blue-600")}>
                          ₹0.00
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-extrabold text-theme-primary flex items-center gap-1">
                        ₹{shiprocketShippingCharge}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] pl-6">
                  {isLoadingShiprocketQuote ? (
                    <span className="text-theme-text-muted">Checking PIN {deliveryPincode} serviceability...</span>
                  ) : isShiprocketChecked && !isShiprocketAvailable ? (
                    <span className="text-rose-600 font-medium">
                      Service unavailable for PIN {deliveryPincode}. Please select ST Courier or MSS Cargo.
                    </span>
                  ) : !deliveryPincode || !/^\d{6}$/.test(deliveryPincode) ? (
                    <span className="text-theme-text-muted">Enter delivery address with 6-digit PIN code to check rates</span>
                  ) : isWhatsApp ? (
                    <span className="text-theme-text-subtle">
                      Live rate quote for PIN {deliveryPincode} • {liveShiprocketQuote?.courierName || "Shiprocket"} · Waived / Calculated on WhatsApp
                    </span>
                  ) : isCall ? (
                    <span className="text-theme-text-subtle">
                      Live rate quote for PIN {deliveryPincode} • {liveShiprocketQuote?.courierName || "Shiprocket"} · Waived / Confirmed on Call
                    </span>
                  ) : (
                    <span className="text-theme-text-subtle">
                      Live rate quote for PIN {deliveryPincode} • {liveShiprocketQuote?.courierName || "Shiprocket"}
                    </span>
                  )}
                </p>
                <p className="text-[11px] pl-6 flex items-center gap-1 mt-1">
                  {isShiprocketChecked && !isShiprocketAvailable ? (
                    <span className="text-rose-500 font-medium flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-rose-500" />
                      Shiprocket service unavailable
                    </span>
                  ) : (
                    <span className="text-theme-text-muted flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Est. {liveShiprocketQuote?.etd || "2 - 5 days"} • Pan-India
                    </span>
                  )}
                </p>
              </div>

              {/* MSS (Mettur Super Services) */}
              <div
                onClick={() => {
                  if (paymentMethod === "COD") {
                    setCheckoutError(
                      "MSS Cargo does not support Cash On Delivery (COD). Only Shiprocket Express is available for COD orders."
                    );
                    return;
                  }
                  setCourierType("mss");
                }}
                className={`rounded-xl border p-4 transition-all ${
                  paymentMethod === "COD"
                    ? "opacity-50 cursor-not-allowed bg-neutral-100/70 border-dashed border-neutral-300 dark:bg-neutral-800/40 select-none"
                    : courierType === "mss"
                    ? "border-theme-primary bg-theme-surface-alt/70 shadow-xs ring-1 ring-theme-primary cursor-pointer"
                    : "border-theme-border bg-theme-surface hover:border-theme-border-accent cursor-pointer"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
                        paymentMethod === "COD"
                          ? "border-neutral-300 bg-neutral-200"
                          : courierType === "mss"
                          ? "border-theme-primary bg-theme-primary text-white"
                          : "border-theme-border-input bg-white"
                      }`}
                    >
                      {paymentMethod !== "COD" && courierType === "mss" && (
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      )}
                    </span>
                    <span className="text-xs font-bold text-theme-text-primary">
                      MSS Cargo
                    </span>
                  </div>
                  <div className="text-right">
                    {isShippingWaived ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-theme-text-muted line-through">
                          ₹{mssShippingCharge}
                        </span>
                        <span className={cn("text-xs font-black", isWhatsApp ? "text-emerald-600" : "text-blue-600")}>
                          ₹0.00
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-extrabold text-theme-primary">
                        ₹{mssShippingCharge}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-theme-text-subtle pl-6">
                  {paymentMethod === "COD"
                    ? "Unavailable for Cash on Delivery"
                    : isWhatsApp
                    ? "Flat ₹200 for 1 to 20 kg · Waived / Calculated on WhatsApp"
                    : isCall
                    ? "Flat ₹200 for 1 to 20 kg · Waived / Confirmed on Call"
                    : "Flat ₹200 for 1 to 20 kg"}
                </p>
                <p className="text-[11px] text-theme-text-muted pl-6 flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  Est. 3 - 5 days • Branch parcel
                </p>
              </div>
            </div>
          </div>

          {/* 3. Payment & Ordering Method Card */}
          <div className="rounded-2xl border border-theme-border bg-theme-surface shadow-xs p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-theme-border-subtle">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme-surface-alt border border-theme-border text-theme-primary font-bold text-xs">
                  3
                </span>
                <h2 className="text-base sm:text-lg font-bold text-theme-text-primary flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-theme-secondary" />
                  Payment & Ordering Options
                </h2>
              </div>

              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-[11px] font-bold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Verified & Secure
              </span>
            </div>

            {/* Payment Method Selector Tabs: Online vs COD vs WhatsApp vs Call */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {/* Online Payment */}
              <button
                type="button"
                onClick={() => setPaymentMethod("CARD")}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all min-h-[72px] ${paymentMethod === "CARD"
                  ? "border-theme-primary bg-theme-surface-alt font-bold text-theme-primary shadow-xs ring-1 ring-theme-primary"
                  : "border-theme-border bg-theme-surface text-theme-text-subtle hover:bg-theme-surface-warm"
                  }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <CreditCard className="h-4 w-4 text-theme-primary" />
                  <span className="text-xs font-black">Pay Online</span>
                </div>
                <span className="text-[11px] font-medium text-theme-text-muted">
                  UPI / Cards / NetBanking
                </span>
              </button>

              {/* Cash On Delivery (COD) */}
              <button
                type="button"
                onClick={() => {
                  if (isShiprocketChecked && !isShiprocketAvailable) {
                    setCheckoutError(
                      deliveryPincode
                        ? `Cash on Delivery is unavailable because Shiprocket delivery is not available for PIN ${deliveryPincode}. Please select Pay Online.`
                        : "Cash on Delivery is unavailable. Please select Pay Online."
                    );
                    return;
                  }
                  setPaymentMethod("COD");
                  setCourierType("shiprocket");
                  setCheckoutError(null);
                }}
                disabled={isShiprocketChecked && !isShiprocketAvailable}
                className={cn(
                  "flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all min-h-[72px]",
                  isShiprocketChecked && !isShiprocketAvailable
                    ? "border-neutral-200 bg-neutral-50/70 text-neutral-400 opacity-60 cursor-not-allowed"
                    : paymentMethod === "COD"
                    ? "border-emerald-600 bg-emerald-50/90 font-bold text-emerald-900 shadow-xs ring-1 ring-emerald-600 cursor-pointer"
                    : "border-theme-border bg-theme-surface text-theme-text-subtle hover:bg-theme-surface-warm cursor-pointer"
                )}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Banknote className="h-4 w-4 text-emerald-700" />
                  <span className="text-xs font-black text-emerald-900">Cash on Delivery</span>
                  {isShiprocketChecked && !isShiprocketAvailable && (
                    <span className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1 rounded">
                      Unavailable
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-medium text-theme-text-muted">
                  {isShiprocketChecked && !isShiprocketAvailable
                    ? `Unavailable for PIN ${deliveryPincode || ""}`
                    : "Shiprocket Only · Pay at Door"}
                </span>
              </button>

              {/* Order via WhatsApp */}
              <button
                type="button"
                onClick={() => setPaymentMethod("WHATSAPP")}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all min-h-[72px] ${paymentMethod === "WHATSAPP"
                  ? "border-emerald-600 bg-emerald-50/80 font-bold text-emerald-800 shadow-xs ring-1 ring-emerald-600"
                  : "border-theme-border bg-theme-surface text-theme-text-subtle hover:bg-theme-surface-warm"
                  }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Image
                    src={ICONS.whatsapp}
                    alt="WhatsApp"
                    width={18}
                    height={18}
                    className="inline-block"
                  />
                  <span className="text-xs font-black text-emerald-800">Order on WhatsApp</span>
                </div>
                <span className="text-[11px] font-medium text-theme-text-muted">
                  Instant Chat & Confirm
                </span>
              </button>

              {/* Order via Call */}
              <button
                type="button"
                onClick={() => setPaymentMethod("CALL")}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all min-h-[72px] ${paymentMethod === "CALL"
                  ? "border-blue-600 bg-blue-50/80 font-bold text-blue-800 shadow-xs ring-1 ring-blue-600"
                  : "border-theme-border bg-theme-surface text-theme-text-subtle hover:bg-theme-surface-warm"
                  }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-black text-blue-800">Order by Call</span>
                </div>
                <span className="text-[11px] font-medium text-theme-text-muted">
                  {KOLLIMALAI_CALL_DISPLAY}
                </span>
              </button>
            </div>

            {/* Explanatory banner based on selected option */}
            {paymentMethod === "CARD" && (
              <div className="rounded-xl border border-theme-border-subtle bg-theme-surface-alt/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-theme-text-primary flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Razorpay 256-Bit SSL Secured Payment
                  </h3>
                  <span className="text-[10px] bg-white border border-theme-border rounded px-2 py-0.5 font-bold text-theme-text-muted">
                    Instant Confirmation
                  </span>
                </div>
                <p className="text-[11px] text-theme-text-subtle leading-relaxed">
                  Support all UPI apps (GPay, PhonePe, Paytm), Debit/Credit Cards & NetBanking. Instant automated confirmation.
                </p>
              </div>
            )}

            {paymentMethod === "COD" && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Banknote className="h-4 w-4 text-emerald-700" />
                    Cash On Delivery (COD) · Powered by Shiprocket
                  </h3>
                  <span className="text-[10px] bg-emerald-200/80 text-emerald-900 border border-emerald-300 rounded px-2 py-0.5 font-bold">
                    Shiprocket Exclusive
                  </span>
                </div>
                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  Pay with cash or UPI directly to the delivery courier when your package arrives at your doorstep. Cash On Delivery is exclusively handled and insured through <strong>Shiprocket Express</strong>. ST Courier and MSS Cargo do not support Cash On Delivery.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-emerald-800 pt-1 border-t border-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                  <span>Exact cash or QR payment is accepted at the time of delivery. Total: {formatPrice(grandTotal)}</span>
                </div>
              </div>
            )}

            {paymentMethod === "WHATSAPP" && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <Image src={ICONS.whatsapp} alt="WhatsApp" width={16} height={16} />
                    Order Directly on WhatsApp
                  </h3>
                  <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                    Clicking below will format your order details, selected courier ({courierType === "mss" ? "MSS" : courierType === "shiprocket" ? "Shiprocket" : "ST Courier"}), and delivery address into a message and open WhatsApp ({KOLLIMALAI_WHATSAPP_DISPLAY}). Shipping fee is waived at checkout and will be calculated and confirmed on WhatsApp based on your location.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleOrderByWhatsApp}
                  className="w-full min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2"
                >
                  <Image src={ICONS.whatsapp} alt="WhatsApp" width={16} height={16} className="brightness-200" />
                  Send Order to WhatsApp ({formatPrice(grandTotal)})
                </Button>
              </div>
            )}

            {paymentMethod === "CALL" && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-blue-600" />
                    Place Order by Phone Call
                  </h3>
                  <p className="text-[11px] text-blue-800 mt-1 leading-relaxed">
                    Prefer phone ordering? Tap below to call our support team ({KOLLIMALAI_CALL_DISPLAY}) directly. We will take your order and guide you. Shipping fee is waived at checkout and will be confirmed on call based on your delivery location.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleOrderByCall}
                  className="w-full min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Call Now ({KOLLIMALAI_CALL_DISPLAY}) · {formatPrice(grandTotal)}
                </Button>
              </div>
            )}
          </div>

          {/* 4. Delivery Instructions */}
          <div className="rounded-2xl border border-theme-border bg-theme-surface shadow-xs p-5 sm:p-6">
            <label className="block text-xs font-bold text-theme-text-primary mb-1.5">
              Special Delivery Instructions (Optional)
            </label>
            <textarea
              rows={2}
              maxLength={300}
              placeholder="e.g. Ring bell twice, leave with security, call before arrival..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full rounded-xl border border-theme-border-input bg-white p-3 text-xs text-theme-text-primary placeholder:text-theme-text-muted focus:border-theme-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Right Column: Order Summary Sidebar (4 cols - Sticky) */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="rounded-2xl border border-theme-border bg-theme-surface shadow-xs overflow-hidden">
            <div className="border-b border-theme-border-subtle bg-theme-surface-alt px-5 py-4">
              <h2 className="text-base font-bold text-theme-text-primary flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-theme-secondary" />
                Order Summary ({items.length} {items.length === 1 ? "item" : "items"})
              </h2>
            </div>

            <div className="p-5 space-y-4">
              {/* Items Mini List */}
              <div className="max-h-60 overflow-y-auto space-y-3 divide-y divide-theme-border-subtle pr-1">
                {items.map((item) => (
                  <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-3">
                    <div className="relative h-14 w-14 rounded-xl border border-theme-border bg-theme-surface-alt shrink-0 overflow-hidden">
                      <ProductImage
                        src={item.primaryImage}
                        alt={item.productName}
                        fallbackText={item.productName}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-theme-text-primary truncate">
                        {item.productName}
                      </p>
                      <p className="text-[11px] text-theme-text-subtle">
                        {item.variantName}{" "}
                        {item.measurement
                          ? `(${formatMeasurementLabel(item.measurement)})`
                          : ""}
                      </p>
                      <p className="text-[11px] text-theme-text-muted">
                        Qty: {item.quantity} × {formatPrice(item.currentPrice)}
                      </p>
                    </div>

                    <div className="text-xs font-bold text-theme-text-primary shrink-0">
                      {formatPrice(item.itemTotal)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Calculation Breakdown */}
              <div className="border-t border-theme-border-subtle pt-4 space-y-2.5 text-xs">
                <div className="flex justify-between text-theme-text-subtle">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-theme-text-primary">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-theme-status-del-fg font-medium">
                    <span>Special Discount</span>
                    <span className="font-semibold">
                      -{formatPrice(discount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-theme-text-subtle items-center">
                  <span>
                    Shipping (
                    {courierType === "mss"
                      ? "MSS Courier"
                      : courierType === "shiprocket"
                      ? liveShiprocketQuote?.courierName
                        ? `Shiprocket (${liveShiprocketQuote.courierName})`
                        : "Shiprocket Express"
                      : "ST Courier"}
                    {paymentMethod === "COD" ? " · COD" : ""}
                    )
                  </span>
                  {courierType === "shiprocket" && isShiprocketChecked && !isShiprocketAvailable ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                      Unavailable
                    </span>
                  ) : isShippingWaived ? (
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="line-through text-theme-text-muted text-[11px]">
                          {formatPrice(baseShippingCharge)}
                        </span>
                        <span className={cn("font-bold text-xs", isWhatsApp ? "text-emerald-700" : "text-blue-700")}>
                          ₹0.00
                        </span>
                      </div>
                      <span className={cn("text-[10px] font-semibold block", isWhatsApp ? "text-emerald-600" : "text-blue-600")}>
                        {isWhatsApp ? "Calculated on WhatsApp" : "Confirmed on Call"}
                      </span>
                    </div>
                  ) : (
                    <span className="font-semibold text-theme-text-primary">
                      {formatPrice(shippingCharge)}
                    </span>
                  )}
                </div>

                <div className="border-t border-theme-border pt-3 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold text-theme-text-primary block">
                      Total Amount
                    </span>
                    {paymentMethod === "COD" && (
                      <span className="text-[10px] text-emerald-700 font-bold block">
                        (Payable in cash on delivery)
                      </span>
                    )}
                    {isShippingWaived && (
                      <span className="text-[10px] text-theme-text-muted font-medium">
                        (Items Subtotal · Shipping excluded)
                      </span>
                    )}
                  </div>
                  <span className="text-xl font-extrabold text-theme-primary">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Place Order CTA Button */}
              {isAdminUser && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900 text-xs font-medium mb-3">
                  <span className="font-bold">Notice:</span> You are admin kindly comes with customer login to book orders.
                </div>
              )}
              <Button
                type="button"
                onClick={handlePlaceOrder}
                disabled={
                  isAdminUser ||
                  createOrderMutation.isPending ||
                  isProcessingPayment ||
                  isVerifyingPayment ||
                  isPlacingCodOrder ||
                  addressesLoading ||
                  !effectiveAddressId ||
                  isSelectedCourierUnavailable
                }
                className={cn(
                  "w-full min-h-[48px] rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2",
                  isAdminUser
                    ? "bg-neutral-200 text-neutral-500 cursor-not-allowed border border-neutral-300 shadow-none hover:bg-neutral-200"
                    : isSelectedCourierUnavailable
                      ? "bg-neutral-200 text-neutral-500 cursor-not-allowed border border-neutral-300 shadow-none"
                      : paymentMethod === "COD"
                        ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-700/20"
                        : paymentMethod === "WHATSAPP"
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : paymentMethod === "CALL"
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-theme-primary hover:bg-theme-primary-hover text-white disabled:opacity-50"
                )}
              >
                {isAdminUser ? (
                  "Booking Disabled for Admin"
                ) : isSelectedCourierUnavailable ? (
                  <>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Selected Courier Unavailable
                  </>
                ) : isVerifyingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying Payment...
                  </>
                ) : isProcessingPayment || createRazorpayOrderMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening Payment Gateway...
                  </>
                ) : isPlacingCodOrder || createOrderMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing Cash on Delivery Order...
                  </>
                ) : paymentMethod === "COD" ? (
                  <>
                    <Banknote className="mr-2 h-4 w-4" />
                    Place Order with COD ({formatPrice(grandTotal)})
                  </>
                ) : paymentMethod === "WHATSAPP" ? (
                  <>
                    <Image
                      src={ICONS.whatsapp}
                      alt="WhatsApp"
                      width={18}
                      height={18}
                      className="mr-2 brightness-0 invert inline-block"
                    />
                    Order via WhatsApp ({formatPrice(grandTotal)})
                  </>
                ) : paymentMethod === "CALL" ? (
                  <>
                    <Phone className="mr-2 h-4 w-4" />
                    Call to Order ({formatPrice(grandTotal)})
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Pay {formatPrice(grandTotal)} via Razorpay
                  </>
                )}
              </Button>

              {/* COD Option in Order Summary Section (Below Pay Button) */}
              {paymentMethod !== "COD" ? (
                <div className="pt-2">
                  <div className="relative flex items-center py-1">
                    <div className="flex-grow border-t border-theme-border-subtle" />
                    <span className="flex-shrink mx-2 text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">
                      Or choose COD
                    </span>
                    <div className="flex-grow border-t border-theme-border-subtle" />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (isShiprocketChecked && !isShiprocketAvailable) {
                        setCheckoutError(
                          deliveryPincode
                            ? `Cash on Delivery is unavailable because Shiprocket delivery is not available for PIN ${deliveryPincode}. Please select Pay Online.`
                            : "Please select an address first to check Cash on Delivery availability."
                        );
                        return;
                      }
                      setPaymentMethod("COD");
                      setCourierType("shiprocket");
                      setCheckoutError(null);
                    }}
                    disabled={isShiprocketChecked && !isShiprocketAvailable}
                    className={cn(
                      "w-full rounded-xl border p-3 transition-all text-left flex items-center justify-between group",
                      isShiprocketChecked && !isShiprocketAvailable
                        ? "border-neutral-200 bg-neutral-50/70 opacity-60 cursor-not-allowed"
                        : "border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100/80 hover:border-emerald-400 text-emerald-950 shadow-xs cursor-pointer"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                          isShiprocketChecked && !isShiprocketAvailable
                            ? "border-neutral-300 bg-neutral-100 text-neutral-400"
                            : "border-emerald-300 bg-emerald-100 text-emerald-700"
                        )}
                      >
                        <Banknote className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-theme-text-primary">
                            Cash on Delivery (COD)
                          </span>
                          {isShiprocketChecked && !isShiprocketAvailable ? (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                              Unavailable
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-1.5 py-0.2 rounded">
                              Pay at Doorstep
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-theme-text-muted leading-tight mt-0.5">
                          {isShiprocketChecked && !isShiprocketAvailable
                            ? `Not available for PIN ${deliveryPincode || ""}`
                            : "Pay via Cash or QR code on delivery"}
                        </p>
                      </div>
                    </div>
                    {(!isShiprocketChecked || isShiprocketAvailable) && (
                      <span className="text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Choose COD &rarr;
                      </span>
                    )}
                  </button>
                </div>
              ) : (
                <div className="pt-2">
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50/90 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                        <Check className="h-4 w-4 stroke-[3]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-emerald-950">
                            Cash on Delivery Selected
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/80 px-1.5 py-0.2 rounded">
                            Active
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800 leading-tight mt-0.5">
                          Pay with cash or QR code to courier on delivery
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod("CARD");
                        setCourierType("st_courier");
                        setCheckoutError(null);
                      }}
                      className="text-xs font-bold text-theme-primary hover:text-theme-primary-hover underline underline-offset-2 ml-2 shrink-0 cursor-pointer"
                    >
                      Switch to Online
                    </button>
                  </div>
                </div>
              )}

              <div className="text-[11px] text-center text-theme-text-muted space-y-1 pt-1">
                {paymentMethod === "COD" ? (
                  <p className="flex items-center justify-center gap-1.5 font-medium text-emerald-700">
                    <Truck className="h-3.5 w-3.5 text-emerald-600" />
                    Cash On Delivery exclusively via Shiprocket Express
                  </p>
                ) : (
                  <p className="flex items-center justify-center gap-1.5 font-medium text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    256-bit Bank-Grade Encryption by Razorpay
                  </p>
                )}
                <p>Pure hill spices, traditional rice & forest honey from Kolli Hills delivered to your door.</p>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Delete Address Confirmation Modal */}
      {addressToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-md rounded-2xl border border-theme-border bg-theme-surface p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-error-50 border border-error-200 text-error-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-theme-text-primary">
                  Delete Address?
                </h3>
                <p className="text-xs text-theme-text-subtle">
                  This address will be removed from your saved addresses.
                </p>
              </div>
            </div>

            {deleteAddressError && (
              <div className="rounded-xl bg-error-50 border border-error-200 p-3 text-xs text-error-600 font-medium">
                {deleteAddressError}
              </div>
            )}

            <div className="rounded-xl border border-theme-border bg-theme-surface-warm p-3.5 text-xs text-theme-text-secondary space-y-1">
              <p className="font-bold text-theme-text-primary">
                {addressToDelete.fullName}
              </p>
              <p>
                {addressToDelete.addressLine1}
                {addressToDelete.addressLine2 ? `, ${addressToDelete.addressLine2}` : ""}
              </p>
              {addressToDelete.landmark && (
                <p className="text-[11px] text-theme-text-muted italic">
                  Landmark: {addressToDelete.landmark}
                </p>
              )}
              <p>
                {addressToDelete.city}, {addressToDelete.state} - {addressToDelete.pincode}
              </p>
              <p className="text-theme-text-muted flex items-center gap-1 pt-0.5">
                <Phone className="h-3 w-3" />
                {addressToDelete.phone}
              </p>
            </div>

            <p className="text-xs text-theme-text-muted">
              Are you sure you want to delete this address? You can add it back later if needed.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-theme-border-subtle">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={deleteAddressMutation.isPending}
                onClick={() => {
                  setAddressToDelete(null);
                  setDeleteAddressError(null);
                }}
                className="min-h-[40px] text-xs font-semibold rounded-xl text-theme-text-subtle hover:bg-theme-surface-alt"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={deleteAddressMutation.isPending}
                onClick={handleConfirmDeleteAddress}
                className="min-h-[40px] px-4 text-xs font-bold rounded-xl bg-error-600 hover:bg-error-700 text-white shadow-xs"
              >
                {deleteAddressMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete Address
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
