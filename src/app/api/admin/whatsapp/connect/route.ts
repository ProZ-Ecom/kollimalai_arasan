import { NextResponse } from "next/server";
import { initWhatsAppClient, waitForQrCode, getWhatsAppStatus } from "@/lib/whatsapp/whatsapp-client";
import { apiSuccess } from "@/lib/api/api-response";

export async function POST() {
  try {
    const currentStatus = getWhatsAppStatus();
    // If already connected, return existing state immediately without touching or recreating the socket
    if (currentStatus.status === "CONNECTED") {
      return apiSuccess(currentStatus, "WhatsApp is already connected");
    }

    // Re-initialize socket with fresh session and await socket creation
    await initWhatsAppClient(true);

    // Wait up to 5 seconds for QR or connection to be generated
    const statusData = await waitForQrCode(5000);
    return apiSuccess(statusData, "WhatsApp initialization active");
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to start WhatsApp" },
      { status: 500 }
    );
  }
}
