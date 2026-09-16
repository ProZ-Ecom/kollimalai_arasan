import { NextResponse } from "next/server";
import { getWhatsAppStatus } from "@/lib/whatsapp/whatsapp-client";
import { apiSuccess } from "@/lib/api/api-response";

export async function GET() {
  try {
    const statusData = getWhatsAppStatus();
    return apiSuccess(statusData, "WhatsApp status fetched successfully");
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to fetch status" },
      { status: 500 }
    );
  }
}
