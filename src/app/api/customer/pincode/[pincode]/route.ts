import { NextRequest, NextResponse } from "next/server";

interface IndiaPostOffice {
  Name: string;
  Description: string | null;
  BranchType: string;
  DeliveryStatus: string;
  Circle: string;
  District: string;
  Division: string;
  Region: string;
  Block: string;
  State: string;
  Country: string;
  Pincode: string;
}

interface IndiaPostResponseItem {
  Message: string;
  Status: "Success" | "Error";
  PostOffice: IndiaPostOffice[] | null;
}

export async function GET(
  _request: NextRequest,
  routeContext: { params: Promise<{ pincode: string }> }
) {
  try {
    const { pincode } = await routeContext.params;
    const cleanPincode = (pincode || "").trim().replace(/\D/g, "");

    if (cleanPincode.length !== 6 || cleanPincode.startsWith("0")) {
      return NextResponse.json(
        {
          success: false,
          message: "PIN code must be a valid 6-digit Indian postal code.",
        },
        { status: 400 }
      );
    }

    // Call India Post public API with 6 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPincode}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 86400 }, // Cache for 24 hours in Next.js
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `India Post API returned HTTP status ${res.status}`,
        },
        { status: 502 }
      );
    }

    const data: IndiaPostResponseItem[] = await res.json();
    const result = data?.[0];

    if (!result || result.Status !== "Success" || !result.PostOffice || result.PostOffice.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid PIN code. No postal records found for this PIN code in India Post database.",
        },
        { status: 404 }
      );
    }

    const firstPO = result.PostOffice[0];
    const district = firstPO.District || firstPO.Block || "";
    const state = firstPO.State || "";
    const country = firstPO.Country || "India";

    // Deduplicate post office / locality names
    const uniquePostOffices = Array.from(
      new Map(
        result.PostOffice.map((po) => [
          po.Name,
          {
            name: po.Name,
            block: po.Block,
            branchType: po.BranchType,
            deliveryStatus: po.DeliveryStatus,
          },
        ])
      ).values()
    );

    const areas = uniquePostOffices.map((po) => po.name);

    return NextResponse.json(
      {
        success: true,
        pincode: cleanPincode,
        district,
        city: district,
        state,
        country,
        postOffices: uniquePostOffices,
        areas,
        totalFound: result.PostOffice.length,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
        },
      }
    );
  } catch (error: any) {
    const isTimeout = error.name === "AbortError";
    return NextResponse.json(
      {
        success: false,
        message: isTimeout
          ? "Postal service lookup timed out. Please try again."
          : (error.message || "Failed to lookup PIN code"),
      },
      { status: 500 }
    );
  }
}
