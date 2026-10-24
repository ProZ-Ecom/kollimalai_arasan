/**
 * Shiprocket API Client & Service Layer
 * Handles authentication (with token caching), order creation, AWB generation,
 * pickup scheduling, shipping label generation, and tracking.
 */

interface ShiprocketAuthResponse {
  id?: number;
  first_name?: string;
  email?: string;
  token?: string;
  message?: string;
}

interface ShiprocketServiceabilityResponse {
  status: number;
  data?: {
    shipping_charges?: number;
    recommended_courier_company_id?: number;
    available_courier_companies?: Array<{
      courier_company_id: number;
      courier_name: string;
      rate: number;
      etd: string;
      cod: number;
      estimated_delivery_days?: string;
    }>;
  };
}

interface ShiprocketCreateOrderResponse {
  order_id: number;
  shipment_id: number;
  status: string;
  status_code: number;
  onboarding_completed_now?: number;
  awb_code?: string;
  courier_company_id?: number;
  courier_name?: string;
}

interface ShiprocketAwbResponse {
  awb_assign_status: number;
  response?: {
    data?: {
      awb_code?: string;
      courier_company_id?: number;
      courier_name?: string;
      assigned_date_time?: string;
    };
  };
  message?: string;
}

interface ShiprocketLabelResponse {
  label_created: number;
  label_url?: string;
  response?: string;
  not_created?: string[];
}

interface ShiprocketTrackingResponse {
  tracking_data?: {
    track_status: number;
    shipment_status: number;
    shipment_track?: Array<{
      id: number;
      awb_code: string;
      courier_name: string;
      current_status: string;
      origin: string;
      destination: string;
      pickup_date?: string;
      delivered_date?: string;
      edd?: string;
    }>;
    shipment_track_activities?: Array<{
      date: string;
      status: string;
      activity: string;
      location: string;
      "sr-status"?: string;
    }>;
  };
}

// In-memory token cache to prevent spamming Shiprocket's login endpoint
let cachedToken: string | null = null;
let cachedEmail: string | null = null;
let tokenExpiresAt: number = 0;

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

function syncShiprocketEnv() {
  if (typeof window !== "undefined") return;
  try {
    // Use dynamic evaluation so bundler never attempts to bundle fs on client
    const req = (globalThis as unknown as { __non_webpack_require__?: (mod: string) => any }).__non_webpack_require__ || eval("require");
    const fs = req("fs");
    const path = req("path");
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const dotenv = req("dotenv");
      const parsed = dotenv.parse(content);
      for (const [k, v] of Object.entries(parsed)) {
        if (k.startsWith("SHIPROCKET_")) {
          process.env[k] = String(v);
        }
      }
    }
  } catch {
    // fallback to standard process.env
  }
}

/**
 * Obtain a valid Shiprocket Bearer Token.
 * Tokens are valid for 24 hours (we refresh at 23 hours).
 */
export async function getShiprocketToken(): Promise<string> {
  syncShiprocketEnv();
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Shiprocket credentials not configured. Please set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in .env"
    );
  }

  const now = Date.now();
  if (cachedToken && cachedEmail === email && tokenExpiresAt > now) {
    return cachedToken;
  }

  const res = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    cachedToken = null;
    cachedEmail = null;
    const errorText = await res.text();
    console.error("Shiprocket authentication error:", res.status, errorText);
    throw new Error(`Shiprocket Auth Failed (${res.status}): ${errorText}`);
  }

  const data = (await res.json()) as ShiprocketAuthResponse;
  if (!data.token) {
    throw new Error(data.message || "No token returned from Shiprocket auth");
  }

  cachedToken = data.token;
  cachedEmail = email;
  // Cache for 23 hours (Shiprocket tokens expire in 24 hours)
  tokenExpiresAt = now + 23 * 60 * 60 * 1000;
  return cachedToken;
}

/**
 * Standard box dimensions based on parcel weight (in kg)
 */
export function estimateBoxDimensions(weightKg: number): {
  length: number;
  breadth: number;
  height: number;
} {
  const safeWeight = Math.max(0.1, Number(weightKg) || 0.5);

  if (safeWeight <= 0.5) {
    return { length: 15, breadth: 10, height: 8 };
  } else if (safeWeight <= 1.0) {
    return { length: 20, breadth: 15, height: 10 };
  } else if (safeWeight <= 3.0) {
    return { length: 25, breadth: 20, height: 15 };
  } else if (safeWeight <= 5.0) {
    return { length: 30, breadth: 25, height: 20 };
  } else {
    return { length: 40, breadth: 30, height: 25 };
  }
}

/**
 * Sanitize 10-digit Indian phone numbers for Shiprocket API
 */
export function sanitizeIndianPhone(phone: string): string {
  if (!phone) return "9876543210";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return cleaned.slice(2);
  }
  if (cleaned.length > 10) {
    return cleaned.slice(-10);
  }
  return cleaned.padEnd(10, "0");
}

/**
 * Check courier serviceability, estimated delivery days, and rates for a pincode
 */
export async function checkShiprocketServiceability(params: {
  deliveryPostcode: string;
  weightKg?: number;
  isCod?: boolean;
  pickupPostcode?: string;
}): Promise<{
  isServiceable: boolean;
  couriers: Array<{
    id: number;
    name: string;
    rate: number;
    etd: string;
    isCodAvailable: boolean;
  }>;
  recommendedCourier?: {
    id: number;
    name: string;
    rate: number;
    etd: string;
  };
}> {
  const token = await getShiprocketToken();
  const pickup =
    params.pickupPostcode ||
    process.env.SHIPROCKET_PICKUP_PINCODE ||
    "637411"; // Default Kolli Hills / Namakkal pincode
  const delivery = params.deliveryPostcode.trim();
  const weight = Math.max(0.1, params.weightKg || 0.5);
  const cod = params.isCod ? 1 : 0;

  const url = `${SHIPROCKET_BASE_URL}/courier/serviceability?pickup_postcode=${encodeURIComponent(
    pickup
  )}&delivery_postcode=${encodeURIComponent(
    delivery
  )}&weight=${weight}&cod=${cod}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    return { isServiceable: false, couriers: [] };
  }

  const json = (await res.json()) as ShiprocketServiceabilityResponse;
  const companies = json.data?.available_courier_companies || [];

  if (companies.length === 0) {
    return { isServiceable: false, couriers: [] };
  }

  const couriers = companies.map((c) => ({
    id: c.courier_company_id,
    name: c.courier_name,
    rate: c.rate,
    etd: c.estimated_delivery_days || c.etd || "3-5 days",
    isCodAvailable: c.cod === 1,
  }));

  const recommendedId = json.data?.recommended_courier_company_id;
  const rec = companies.find((c) => c.courier_company_id === recommendedId) || companies[0];

  return {
    isServiceable: true,
    couriers,
    recommendedCourier: rec
      ? {
          id: rec.courier_company_id,
          name: rec.courier_name,
          rate: rec.rate,
          etd: rec.estimated_delivery_days || rec.etd || "3-5 days",
        }
      : undefined,
  };
}

/**
 * Payload to create an adhoc order in Shiprocket
 */
export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
}

export interface CreateShiprocketOrderPayload {
  orderNumber: string;
  orderDate: Date;
  pickupLocation?: string;
  customerName: string;
  email?: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  items: ShiprocketOrderItem[];
  paymentMethod: "Prepaid" | "COD";
  subtotal: number;
  shippingCharge: number;
  discountAmount?: number;
  totalAmount: number;
  totalWeightKg: number;
  boxLength?: number;
  boxBreadth?: number;
  boxHeight?: number;
}

/**
 * Create a new custom order in Shiprocket
 */
export async function createShiprocketOrder(
  data: CreateShiprocketOrderPayload
): Promise<ShiprocketCreateOrderResponse> {
  const token = await getShiprocketToken();
  const pickupLocation =
    data.pickupLocation ||
    process.env.SHIPROCKET_PICKUP_LOCATION ||
    "Primary";

  const { length, breadth, height } = estimateBoxDimensions(data.totalWeightKg);

  const formattedDate = data.orderDate
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  const names = data.customerName.trim().split(" ");
  const firstName = names[0] || "Valued";
  const lastName = names.slice(1).join(" ") || "Customer";

  const payload = {
    order_id: data.orderNumber,
    order_date: formattedDate,
    pickup_location: pickupLocation,
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: data.addressLine1,
    billing_address_2: data.addressLine2 || "",
    billing_city: data.city,
    billing_pincode: data.pincode.replace(/\D/g, ""),
    billing_state: data.state,
    billing_country: data.country || "India",
    billing_email: data.email || "customer@kollimalaiarasan.com",
    billing_phone: sanitizeIndianPhone(data.phone),
    shipping_is_billing: true,
    order_items: data.items.map((it) => ({
      name: it.name.slice(0, 50),
      sku: it.sku || `SKU-${it.name.slice(0, 10).toUpperCase()}`,
      units: it.units,
      selling_price: it.selling_price,
      discount: it.discount || 0,
    })),
    payment_method: data.paymentMethod,
    sub_total: data.subtotal,
    length: data.boxLength || length,
    breadth: data.boxBreadth || breadth,
    height: data.boxHeight || height,
    weight: Math.max(0.1, Number(data.totalWeightKg.toFixed(3))),
  };

  const res = await fetch(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseJson = await res.json();
  if (!res.ok || (responseJson.status_code && responseJson.status_code >= 400)) {
    const errorMsg =
      responseJson.message ||
      (typeof responseJson.errors === "object"
        ? JSON.stringify(responseJson.errors)
        : "Failed to create order on Shiprocket");
    throw new Error(`Shiprocket order creation failed: ${errorMsg}`);
  }

  return responseJson as ShiprocketCreateOrderResponse;
}

/**
 * Assign AWB & Auto-Select Courier for a created shipment
 */
export async function assignShiprocketAwb(
  shipmentId: number,
  courierId?: number
): Promise<{
  awbCode: string;
  courierName: string;
  courierCompanyId: number;
}> {
  const token = await getShiprocketToken();

  const body: Record<string, unknown> = {
    shipment_id: shipmentId,
  };
  if (courierId) {
    body.courier_id = courierId;
  }

  const res = await fetch(`${SHIPROCKET_BASE_URL}/courier/assign/awb`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as ShiprocketAwbResponse;

  if (
    !res.ok ||
    json.awb_assign_status !== 1 ||
    !json.response?.data?.awb_code
  ) {
    throw new Error(
      json.message ||
        "Failed to assign AWB via Shiprocket. Please check wallet balance or courier availability."
    );
  }

  return {
    awbCode: json.response.data.awb_code,
    courierName: json.response.data.courier_name || "Shiprocket Courier",
    courierCompanyId: json.response.data.courier_company_id || 0,
  };
}

/**
 * Generate Shipping Label PDF for a shipment
 */
export async function generateShiprocketLabel(
  shipmentId: number
): Promise<string> {
  const token = await getShiprocketToken();

  const res = await fetch(`${SHIPROCKET_BASE_URL}/courier/generate/label`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: JSON.stringify({ shipment_id: [shipmentId] }),
  });

  const json = (await res.json()) as ShiprocketLabelResponse;
  if (!res.ok || json.label_created !== 1 || !json.label_url) {
    console.warn("Label generation notice:", json);
    return json.label_url || "";
  }

  return json.label_url;
}

/**
 * Request Courier Doorstep Pickup from Kolli Hills / Warehouse
 */
export async function requestShiprocketPickup(
  shipmentId: number,
  pickupDate?: string
): Promise<{ success: boolean; message?: string }> {
  const token = await getShiprocketToken();

  const body: Record<string, unknown> = {
    shipment_id: [shipmentId],
  };
  if (pickupDate) {
    body.pickup_date = [pickupDate];
  }

  const res = await fetch(`${SHIPROCKET_BASE_URL}/courier/generate/pickup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  return {
    success: res.ok,
    message: json.response?.pickup_status || json.message,
  };
}

/**
 * Live Tracking via Shiprocket API for an AWB Code
 */
export async function trackShiprocketAwb(awbCode: string) {
  const token = await getShiprocketToken();

  const res = await fetch(
    `${SHIPROCKET_BASE_URL}/courier/track/awb/${encodeURIComponent(awbCode)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    return {
      success: false,
      error: "Tracking details currently unavailable from Shiprocket.",
    };
  }

  const json = (await res.json()) as ShiprocketTrackingResponse;
  const track = json.tracking_data?.shipment_track?.[0];
  const activities = json.tracking_data?.shipment_track_activities || [];

  if (!track) {
    return {
      success: false,
      error: "No tracking records found for this AWB.",
    };
  }

  const checkpoints = activities.map((act) => ({
    date: act.date ? act.date.split(" ")[0] : "",
    time: act.date ? act.date.split(" ")[1] || "" : "",
    location: act.location || "In Transit",
    status: act.activity || act.status,
    isDelivered:
      (act.status || "").toLowerCase().includes("delivered") ||
      (act.activity || "").toLowerCase().includes("delivered"),
  }));

  const isDelivered =
    (track.current_status || "").toLowerCase().includes("delivered") ||
    checkpoints.some((c) => c.isDelivered);

  return {
    success: true,
    awb: awbCode,
    courier: track.courier_name || "Shiprocket Express",
    summary: {
      currentStatus: track.current_status,
      origin: track.origin,
      destination: track.destination,
      bookedDate: track.pickup_date || null,
      deliveredDate: track.delivered_date || null,
      edd: track.edd || null,
    },
    checkpoints,
    isDelivered,
  };
}

export interface CreateShiprocketReturnPayload {
  orderNumber: string;
  orderDate: Date;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerAddress2?: string;
  customerCity: string;
  customerState: string;
  customerPincode: string;
  warehouseName?: string;
  warehouseAddress?: string;
  warehouseCity?: string;
  warehouseState?: string;
  warehousePincode?: string;
  warehousePhone?: string;
  items: ShiprocketOrderItem[];
  subtotal: number;
  totalWeightKg: number;
}

/**
 * Create a Reverse / Return Pickup order on Shiprocket
 */
export async function createShiprocketReturnOrder(
  data: CreateShiprocketReturnPayload
): Promise<{
  order_id: number;
  shipment_id: number;
  status: string;
}> {
  const token = await getShiprocketToken();
  const { length, breadth, height } = estimateBoxDimensions(data.totalWeightKg);

  const formattedDate = data.orderDate
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  const names = data.customerName.trim().split(" ");
  const firstName = names[0] || "Customer";
  const lastName = names.slice(1).join(" ") || "Return";

  const payload = {
    order_id: `RET-${data.orderNumber}`,
    order_date: formattedDate,
    channel_id: "",
    pickup_customer_name: firstName,
    pickup_last_name: lastName,
    pickup_signature: "",
    pickup_address: data.customerAddress,
    pickup_address_2: data.customerAddress2 || "",
    pickup_city: data.customerCity,
    pickup_state: data.customerState,
    pickup_country: "India",
    pickup_pincode: data.customerPincode.replace(/\D/g, ""),
    pickup_email: "returns@kollimalaiarasan.com",
    pickup_phone: sanitizeIndianPhone(data.customerPhone),
    pickup_isd_code: "91",
    shipping_customer_name: data.warehouseName || "Kollimalai Arasan Warehouse",
    shipping_address:
      data.warehouseAddress ||
      "Kolli Hills Agro Hub, Main Road, Semmedu",
    shipping_city: data.warehouseCity || "Namakkal",
    shipping_state: data.warehouseState || "Tamil Nadu",
    shipping_country: "India",
    shipping_pincode: (
      data.warehousePincode ||
      process.env.SHIPROCKET_PICKUP_PINCODE ||
      "637411"
    ).replace(/\D/g, ""),
    shipping_email: "support@kollimalaiarasan.com",
    shipping_phone: sanitizeIndianPhone(
      data.warehousePhone || process.env.SUPPORT_PHONE || "8667380899"
    ),
    shipping_isd_code: "91",
    order_items: data.items.map((it) => ({
      name: it.name.slice(0, 50),
      sku: it.sku || `SKU-${it.name.slice(0, 10).toUpperCase()}`,
      units: it.units,
      selling_price: it.selling_price,
      discount: 0,
    })),
    payment_method: "Prepaid",
    total_discount: "0",
    sub_total: data.subtotal,
    length,
    breadth,
    height,
    weight: Math.max(0.1, Number(data.totalWeightKg.toFixed(3))),
  };

  const res = await fetch(`${SHIPROCKET_BASE_URL}/orders/create/return`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseJson = await res.json();
  if (!res.ok || (responseJson.status_code && responseJson.status_code >= 400)) {
    const errorMsg =
      responseJson.message ||
      (typeof responseJson.errors === "object"
        ? JSON.stringify(responseJson.errors)
        : "Failed to create return pickup order on Shiprocket");
    throw new Error(`Shiprocket return creation failed: ${errorMsg}`);
  }

  return responseJson;
}

