export interface PostOfficeInfo {
  name: string;
  block: string;
  branchType: string;
  deliveryStatus: string;
}

export interface PincodeLookupSuccess {
  valid: true;
  pincode: string;
  district: string;
  city: string;
  state: string;
  country: string;
  postOffices: PostOfficeInfo[];
  areas: string[];
}

export interface PincodeLookupError {
  valid: false;
  error: string;
}

export type PincodeLookupResult = PincodeLookupSuccess | PincodeLookupError;

/**
 * Validates and looks up India Post PIN code details.
 * Tries internal customer API route first with automatic fallback to direct public India Post API.
 */
export async function lookupPostalPincode(pincode: string): Promise<PincodeLookupResult> {
  const cleanCode = (pincode || "").trim().replace(/\D/g, "");

  if (cleanCode.length !== 6 || cleanCode.startsWith("0")) {
    return {
      valid: false,
      error: "PIN code must be a valid 6-digit Indian postal code.",
    };
  }

  // 1. Try internal customer proxy route first
  try {
    const res = await fetch(`/api/customer/pincode/${cleanCode}`, {
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        return {
          valid: true,
          pincode: cleanCode,
          district: data.district || data.city || "",
          city: data.city || data.district || "",
          state: data.state || "",
          country: data.country || "India",
          postOffices: data.postOffices || [],
          areas: data.areas || [],
        };
      } else {
        return {
          valid: false,
          error: data.message || "Invalid PIN code. No records found in India Post database.",
        };
      }
    } else if (res.status === 404) {
      const data = await res.json().catch(() => ({}));
      return {
        valid: false,
        error: data.message || "Invalid PIN code. No records found in India Post database.",
      };
    }
  } catch {
    // If internal route failed (e.g. network glitch), continue to direct public API fallback
  }

  // 2. Direct fallback to https://api.postalpincode.in/pincode/{cleanCode}
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanCode}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        valid: false,
        error: "Unable to verify PIN code with India Post at this moment.",
      };
    }

    const data = await res.json();
    const firstResult = data?.[0];

    if (
      !firstResult ||
      firstResult.Status !== "Success" ||
      !firstResult.PostOffice ||
      firstResult.PostOffice.length === 0
    ) {
      return {
        valid: false,
        error: "Invalid PIN code. No records found in India Post database.",
      };
    }

    const firstPO = firstResult.PostOffice[0];
    const district = firstPO.District || firstPO.Block || "";
    const state = firstPO.State || "";
    const country = firstPO.Country || "India";

    const poMap = new Map<string, PostOfficeInfo>();
    for (const po of firstResult.PostOffice) {
      if (po && po.Name && !poMap.has(po.Name)) {
        poMap.set(po.Name, {
          name: po.Name,
          block: po.Block || "",
          branchType: po.BranchType || "",
          deliveryStatus: po.DeliveryStatus || "",
        });
      }
    }
    const uniquePostOffices: PostOfficeInfo[] = Array.from(poMap.values());

    return {
      valid: true,
      pincode: cleanCode,
      district,
      city: district,
      state,
      country,
      postOffices: uniquePostOffices,
      areas: uniquePostOffices.map((po) => po.name),
    };
  } catch (err: any) {
    const isTimeout = err?.name === "AbortError";
    return {
      valid: false,
      error: isTimeout
        ? "PIN code verification timed out. Please check your connection."
        : "Failed to connect to India Post postal service.",
    };
  }
}
