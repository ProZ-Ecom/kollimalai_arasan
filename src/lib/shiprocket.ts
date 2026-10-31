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

export interface ShiprocketShipmentListItem {
  id: number;
  order_id: number;
  awb: string;
  status: string;
  created_at: string;
  channel_id?: number;
  channel_name?: string;
  base_channel_code?: string;
  payment_method?: string;
  products?: Array<{
    name: string;
    sku: string;
    quantity: number;
  }>;
  charges?: Record<string, any>;
  [key: string]: any;
}

export interface ShiprocketShipmentDetailResponse {
  data?: {
    id: number;
    order_id: number;
    channel_id?: number;
    company_id?: number;
    status: number | string;
    courier?: string | null;
    sr_courier_id?: number | null;
    awb?: string | null;
    awb_assign_date?: string | null;
    pickup_generated_date?: string | null;
    pickup_token_number?: string | null;
    weight?: string | number;
    dimensions?: string;
    quantity?: number;
    cost?: string | number;
    tax?: string | number;
    total?: string | number;
    shipping_address?: {
      city?: string;
      state?: string;
      address?: string;
      address_2?: string | null;
      country?: string;
      pincode?: string;
      company_name?: string | null;
    };
    customer_details?: {
      first_name?: string;
      last_name?: string;
      phone?: string;
      psid?: string;
    };
    shipped_date?: string | null;
    delivered_date?: string | null;
    returned_date?: string | null;
    label_url?: string | null;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  };
}

// In-memory token cache to prevent spamming Shiprocket's login endpoint
let cachedToken: string | null = null;
let cachedEmail: string | null = null;
let cachedIsSandbox: boolean | null = null;
let tokenExpiresAt: number = 0;

function cleanBaseUrl(rawUrl: string): string {
  return rawUrl.trim().replace(/\/+$/, "");
}

export function isShiprocketSandbox(): boolean {
  syncShiprocketEnv();
  return process.env.SHIPROCKET_TEST_MODE === "true";
}

export function getShiprocketBaseUrl(): string {
  syncShiprocketEnv();

  const isSandbox = isShiprocketSandbox();

  if (isSandbox) {
    const sandboxUrl = process.env.SHIPROCKET_SANDBOX_BASE_URL;
    if (!sandboxUrl) {
      throw new Error("SHIPROCKET_SANDBOX_BASE_URL is not configured in .env");
    }
    return cleanBaseUrl(sandboxUrl);
  }

  const officialUrl = process.env.SHIPROCKET_OFFICIAL_BASE_URL;
  if (!officialUrl) {
    throw new Error("SHIPROCKET_OFFICIAL_BASE_URL is not configured in .env");
  }
  return cleanBaseUrl(officialUrl);
}

export function getShiprocketPortalUrl(): string {
  syncShiprocketEnv();
  const isSandbox = isShiprocketSandbox();
  if (isSandbox) {
    return process.env.SHIPROCKET_SANDBOX_PORTAL_URL || "https://sandbox.shiprocket.in";
  }
  return process.env.SHIPROCKET_OFFICIAL_TRACKING_URL || "https://shiprocket.co/tracking";
}

export function getShiprocketHeaders(token?: string): Record<string, string> {
  const isSandbox = isShiprocketSandbox();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (isSandbox) {
    headers.Origin = "https://sandbox.shiprocket.in";
    headers.Referer = "https://sandbox.shiprocket.in/";
    headers["User-Agent"] =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
  }
  return headers;
}

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
  const isSandbox = isShiprocketSandbox();

  if (!email || !password) {
    throw new Error(
      "Shiprocket credentials not configured. Please set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in .env"
    );
  }

  const now = Date.now();
  if (cachedToken && cachedEmail === email && cachedIsSandbox === isSandbox && tokenExpiresAt > now) {
    return cachedToken;
  }

  const baseUrl = getShiprocketBaseUrl();
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: getShiprocketHeaders(),
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    cachedToken = null;
    cachedEmail = null;
    cachedIsSandbox = null;
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
  cachedIsSandbox = isSandbox;
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

  const baseUrl = getShiprocketBaseUrl();
  const url = `${baseUrl}/courier/serviceability?pickup_postcode=${encodeURIComponent(
    pickup
  )}&delivery_postcode=${encodeURIComponent(
    delivery
  )}&weight=${weight}&cod=${cod}`;

  const res = await fetch(url, {
    method: "GET",
    headers: getShiprocketHeaders(token),
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

  const baseUrl = getShiprocketBaseUrl();
  const res = await fetch(`${baseUrl}/orders/create/adhoc`, {
    method: "POST",
    headers: getShiprocketHeaders(token),
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

  const baseUrl = getShiprocketBaseUrl();
  const res = await fetch(`${baseUrl}/courier/assign/awb`, {
    method: "POST",
    headers: getShiprocketHeaders(token),
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

  const baseUrl = getShiprocketBaseUrl();
  const res = await fetch(`${baseUrl}/courier/generate/label`, {
    method: "POST",
    headers: getShiprocketHeaders(token),
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

  const baseUrl = getShiprocketBaseUrl();
  const res = await fetch(`${baseUrl}/courier/generate/pickup`, {
    method: "POST",
    headers: getShiprocketHeaders(token),
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

  const baseUrl = getShiprocketBaseUrl();
  const res = await fetch(
    `${baseUrl}/courier/track/awb/${encodeURIComponent(awbCode)}`,
    {
      method: "GET",
      headers: getShiprocketHeaders(token),
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
      awb: awbCode,
      currentStatus: track.current_status,
      origin: track.origin,
      destination: track.destination,
      bookingDate: track.pickup_date || null,
      deliveryDate: track.delivered_date || null,
      bookedDate: track.pickup_date || null,
      deliveredDate: track.delivered_date || null,
      edd: track.edd || null,
    },
    checkpoints,
    isDelivered,
  };
}

/**
 * Fetch list of shipments from Shiprocket Sandbox / Production API
 * Calls: GET /v1/external/shipments
 */
export async function getShiprocketShipments(params?: {
  page?: number;
  per_page?: number;
  filter_by?: string;
}): Promise<{ data: ShiprocketShipmentListItem[] }> {
  const token = await getShiprocketToken();
  const baseUrl = getShiprocketBaseUrl();
  const url = new URL(`${baseUrl}/shipments`);
  if (params?.page) url.searchParams.set("page", String(params.page));
  if (params?.per_page) url.searchParams.set("per_page", String(params.per_page));
  if (params?.filter_by) url.searchParams.set("filter_by", params.filter_by);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: getShiprocketHeaders(token),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to fetch Shiprocket shipments:", res.status, errorText);
    throw new Error(`Shiprocket shipments fetch failed (${res.status}): ${errorText}`);
  }

  const json = (await res.json()) as { data: ShiprocketShipmentListItem[] };
  return json;
}

/**
 * Fetch detailed shipment record by shipment_id from Shiprocket Sandbox / Production API
 * Calls: GET /v1/external/shipments/{shipment_id}
 */
export async function getShiprocketShipmentById(
  shipmentId: number | string
): Promise<ShiprocketShipmentDetailResponse> {
  const token = await getShiprocketToken();
  const baseUrl = getShiprocketBaseUrl();

  const res = await fetch(`${baseUrl}/shipments/${encodeURIComponent(shipmentId)}`, {
    method: "GET",
    headers: getShiprocketHeaders(token),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Failed to fetch Shiprocket shipment #${shipmentId}:`, res.status, errorText);
    throw new Error(`Shiprocket shipment fetch failed (${res.status}): ${errorText}`);
  }

  const json = (await res.json()) as ShiprocketShipmentDetailResponse;
  return json;
}

/**
 * Maps numeric or string Shiprocket status codes to user-friendly status labels
 */
export function getShiprocketStatusLabel(
  statusCode: number | string | undefined,
  fallbackText?: string
): string {
  const code = Number(statusCode);
  switch (code) {
    case 11:
      return "ORDER CONFIRMED (PENDING PICKUP)";
    case 42:
      return "PICKED UP";
    case 19:
      return "OUT FOR PICKUP";
    case 18:
      return "IN TRANSIT";
    case 38:
      return "REACHED DESTINATION HUB";
    case 17:
    case 39:
      return "OUT FOR DELIVERY";
    case 6:
      return "SHIPPED";
    case 7:
      return "DELIVERED";
    case 8:
      return "CANCELLED";
    case 9:
      return "RTO INITIATED";
    case 10:
      return "RTO DELIVERED";
    case 13:
      return "PICKUP RESCHEDULED";
    case 21:
      return "UNDELIVERED";
    default:
      if (typeof statusCode === "string" && isNaN(Number(statusCode))) {
        return statusCode.replace(/_/g, " ").toUpperCase();
      }
      return (fallbackText || "IN TRANSIT").replace(/_/g, " ").toUpperCase();
  }
}

/**
 * Retrieve tracking / shipment lifecycle details directly from Shiprocket Sandbox & Production APIs.
 * Pulls real shipment details from the Sandbox Shipment API (/v1/external/shipments and /shipments/{id})
 * and constructs live checkpoints and status summary.
 */
export async function getShiprocketShipmentTracking(options: {
  awb?: string;
  shipmentId?: string | number;
  orderId?: string | number;
  orderNumber?: string;
  courierPartnerName?: string;
}) {
  const cleanAwb = options.awb?.trim() || "";
  let targetShipmentId = options.shipmentId ? String(options.shipmentId).trim() : "";
  let targetOrderId = options.orderId ? String(options.orderId).trim() : "";

  // 1. If we have a real carrier AWB (not TEST-SR) and not sandbox test mode, try live AWB tracking endpoint
  const isSandbox = isShiprocketSandbox();
  if (cleanAwb && !cleanAwb.startsWith("TEST-SR") && !isSandbox) {
    try {
      const liveTracking = await trackShiprocketAwb(cleanAwb);
      if (liveTracking.success && liveTracking.checkpoints && liveTracking.checkpoints.length > 0) {
        return liveTracking;
      }
    } catch {
      // Fallback to shipments API below
    }
  }

  // 2. Fetch list of shipments from sandbox API (/v1/external/shipments)
  let shipmentsList: ShiprocketShipmentListItem[] = [];
  try {
    const listRes = await getShiprocketShipments({ per_page: 50 });
    shipmentsList = listRes.data || [];
  } catch (err: any) {
    console.warn("Could not list Shiprocket shipments from sandbox API:", err.message);
  }

  // Find matching shipment from the shipments list
  let matchedListItem: ShiprocketShipmentListItem | undefined;
  if (targetShipmentId) {
    matchedListItem = shipmentsList.find((s) => String(s.id) === targetShipmentId);
  }
  if (!matchedListItem && targetOrderId) {
    matchedListItem = shipmentsList.find((s) => String(s.order_id) === targetOrderId);
  }
  if (!matchedListItem && cleanAwb) {
    matchedListItem = shipmentsList.find(
      (s) => s.awb === cleanAwb || String(s.id) === cleanAwb || String(s.order_id) === cleanAwb
    );
  }
  if (!matchedListItem && shipmentsList.length > 0) {
    // If not directly matched and we're looking up a test AWB, match the most recent shipment in sandbox
    if (cleanAwb.startsWith("TEST-SR") || cleanAwb.startsWith("SR-")) {
      matchedListItem = shipmentsList[0];
    }
  }

  // Resolved shipment ID
  const resolvedShipmentId = targetShipmentId || (matchedListItem ? String(matchedListItem.id) : "");

  // 3. Fetch detailed shipment record from /v1/external/shipments/{id}
  let shipmentDetails: ShiprocketShipmentDetailResponse["data"] | undefined;
  if (resolvedShipmentId) {
    try {
      const detailRes = await getShiprocketShipmentById(resolvedShipmentId);
      shipmentDetails = detailRes.data;
    } catch (err: any) {
      console.warn(`Could not fetch details for shipment #${resolvedShipmentId}:`, err.message);
    }
  }

  if (!shipmentDetails && !matchedListItem) {
    return {
      success: false,
      awb: cleanAwb,
      courier: options.courierPartnerName || "Shiprocket Express (Sandbox)",
      checkpoints: [],
      error: `Shipment details unavailable on Shiprocket Sandbox (${cleanAwb || options.orderNumber || "No ID"})`,
      officialUrl: getShiprocketPortalUrl(),
    };
  }

  // 4. Construct live TrackingResult based on sandbox shipment data
  const sData = shipmentDetails || {
    id: matchedListItem!.id,
    order_id: matchedListItem!.order_id,
    status: matchedListItem!.status,
    created_at: matchedListItem!.created_at,
    shipping_address: undefined,
  };

  const statusLabel = getShiprocketStatusLabel(
    sData.status,
    typeof sData.status === "string" ? sData.status : matchedListItem?.status
  );

  const statusCode = Number(sData.status);
  const isDelivered = statusCode === 7 || Boolean(sData.delivered_date);

  // Parse dates safely
  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return { date: "", time: "" };
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        const parts = dateStr.split(" ");
        if (parts.length >= 4) {
          return { date: parts.slice(0, 3).join(" "), time: parts.slice(3).join(" ") };
        }
        return { date: dateStr, time: "" };
      }
      return {
        date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };
    } catch {
      return { date: dateStr || "", time: "" };
    }
  };

  const createdDT = formatDateTime(sData.created_at);
  const updatedDT = formatDateTime(sData.updated_at);
  const shippedDT = formatDateTime(sData.shipped_date);
  const deliveredDT = formatDateTime(sData.delivered_date);

  const destCity = sData.shipping_address?.city || "Destination Hub";
  const destState = sData.shipping_address?.state || "";
  const destPincode = sData.shipping_address?.pincode || "";
  const destFormatted = [destCity, destState, destPincode ? `(${destPincode})` : ""]
    .filter(Boolean)
    .join(", ");

  // Build real checkpoints from sandbox lifecycle (ordered newest first)
  const checkpoints: Array<{
    date: string;
    time?: string;
    location: string;
    status: string;
    isDelivered?: boolean;
  }> = [];

  // Checkpoint 4: Delivered
  if (isDelivered) {
    checkpoints.push({
      date: deliveredDT.date || updatedDT.date || createdDT.date,
      time: deliveredDT.time || updatedDT.time || "",
      location: destFormatted || "Customer Destination",
      status: "Delivered to Consignee (Shiprocket Sandbox)",
      isDelivered: true,
    });
  }

  // Checkpoint 3: Out for Delivery
  if (statusCode === 17 || statusCode === 39) {
    checkpoints.push({
      date: updatedDT.date || createdDT.date,
      time: updatedDT.time || "",
      location: `${destCity} Local Hub`,
      status: "Out for Delivery to Consignee",
      isDelivered: false,
    });
  }

  // Checkpoint 2: Shipped / In Transit
  if (
    [6, 17, 18, 38, 39, 7].includes(statusCode) ||
    sData.shipped_date ||
    (sData.updated_at && sData.updated_at !== sData.created_at)
  ) {
    checkpoints.push({
      date: shippedDT.date || updatedDT.date || createdDT.date,
      time: shippedDT.time || updatedDT.time || "",
      location: `${destCity} Transit Hub`,
      status: `Shipment In Transit (${statusLabel})`,
      isDelivered: false,
    });
  }

  // Checkpoint 1: Initial creation in sandbox
  checkpoints.push({
    date: createdDT.date,
    time: createdDT.time,
    location: "Kolli Hills Agro Hub (637411)",
    status: `Shipment Registered in Shiprocket Sandbox (#${sData.id})`,
    isDelivered: false,
  });

  const courierName =
    sData.courier ||
    options.courierPartnerName ||
    "Shiprocket Express (Sandbox)";

  return {
    success: true,
    awb: sData.awb || cleanAwb || `SR-${sData.id}`,
    courier: courierName,
    isShiprocket: true,
    shiprocketShipmentId: sData.id,
    shiprocketOrderId: sData.order_id,
    summary: {
      awb: sData.awb || cleanAwb || `SR-${sData.id}`,
      currentStatus: statusLabel,
      origin: "Kolli Hills Hub (637411)",
      destination: destFormatted || "Customer Destination",
      consignment: `SR-SHP-${sData.id}`,
      bookingDate: createdDT.date || null,
      deliveryDate: isDelivered ? (deliveredDT.date || updatedDT.date) : null,
      bookedDate: createdDT.date || null,
      deliveredDate: isDelivered ? (deliveredDT.date || updatedDT.date) : null,
      edd: "2 - 3 business days",
    },
    checkpoints,
    isDelivered,
    officialUrl: getShiprocketPortalUrl(),
    shipmentDetails: {
      id: sData.id,
      order_id: sData.order_id,
      status: sData.status,
      weight: sData.weight,
      dimensions: sData.dimensions,
      total: sData.total,
      products: matchedListItem?.products,
      customer: sData.customer_details,
      shipping_address: sData.shipping_address,
      created_at: sData.created_at,
      updated_at: sData.updated_at,
    },
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

  const baseUrl = getShiprocketBaseUrl();
  const res = await fetch(`${baseUrl}/orders/create/return`, {
    method: "POST",
    headers: getShiprocketHeaders(token),
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

