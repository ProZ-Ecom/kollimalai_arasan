import { NextResponse } from "next/server";
import { disconnectWhatsAppSession } from "@/lib/whatsapp/whatsapp-client";
import { apiSuccess } from "@/lib/api/api-response";

export async function POST() {
  try {
    const result = await disconnectWhatsAppSession();
    return apiSuccess(result, "WhatsApp session disconnected successfully");
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to disconnect session" },
      { status: 500 }
    );
  }
}
