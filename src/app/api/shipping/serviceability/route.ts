import { NextRequest, NextResponse } from "next/server";
import { checkShiprocketServiceability } from "@/lib/shiprocket";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pincode = searchParams.get("pincode")?.trim();
    const weight = searchParams.get("weight");
    const cod = searchParams.get("cod") === "1" || searchParams.get("cod") === "true";

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid 6-digit Indian PIN code." },
        { status: 400 }
      );
    }

    const result = await checkShiprocketServiceability({
      deliveryPostcode: pincode,
      weightKg: weight ? parseFloat(weight) : 0.5,
      isCod: cod,
    });

    return NextResponse.json(
      {
        success: true,
        pincode,
        ...result,
      },
      {
        status: 200,
        headers: {
          // Cache serviceability result for 1 hour
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  } catch (error: any) {
    console.error("Shipping serviceability check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to check PIN code delivery serviceability",
      },
      { status: 500 }
    );
  }
}
