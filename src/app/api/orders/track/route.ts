import { NextRequest, NextResponse } from "next/server";
import { fetchSTCourierTracking } from "@/features/orders/services/courier-tracking.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const awb = searchParams.get("awb")?.trim();
    const courier = (searchParams.get("courier") || "").toLowerCase().trim();

    if (!awb) {
      return NextResponse.json(
        { success: false, error: "AWB / Tracking number is required" },
        { status: 400 }
      );
    }

    // If MSS Courier, bypass ST Courier API and read internal tracking details updated by admin
    if (courier === "mss" || courier.includes("mettur")) {
      const { db } = await import("@/lib/db/prisma");
      const shipment = await db.shipments.findFirst({
        where: { tracking_number: awb, is_active: true },
        include: { orders: true, delivery_partners: true },
        orderBy: { id: "desc" },
      });

      const currentStatus = shipment?.orders?.order_status || shipment?.status || "shipped";
      const isDelivered = currentStatus === "delivered";

      return NextResponse.json(
        {
          success: true,
          awb,
          courier: "Mettur Super Services (MSS)",
          isMSS: true,
          summary: {
            currentStatus: currentStatus.replace(/_/g, " ").toUpperCase(),
            bookedDate: shipment?.created_at
              ? new Date(shipment.created_at).toLocaleDateString("en-IN")
              : null,
            deliveredDate: shipment?.delivered_at
              ? new Date(shipment.delivered_at).toLocaleDateString("en-IN")
              : null,
            destination: shipment?.delivery_notes || "Destination Office",
          },
          checkpoints: [
            {
              date: shipment?.created_at
                ? new Date(shipment.created_at).toLocaleDateString("en-IN")
                : "",
              time: shipment?.created_at
                ? new Date(shipment.created_at).toLocaleTimeString("en-IN")
                : "",
              location: "Kolli Hills Origin Hub",
              status: "Shipment Dispatched via Mettur Super Services",
              isDelivered: false,
            },
            ...(isDelivered
              ? [
                  {
                    date: shipment?.delivered_at
                      ? new Date(shipment.delivered_at).toLocaleDateString("en-IN")
                      : "",
                    time: shipment?.delivered_at
                      ? new Date(shipment.delivered_at).toLocaleTimeString("en-IN")
                      : "",
                    location: shipment?.delivery_notes || "Customer Destination",
                    status: "Delivered to Consignee",
                    isDelivered: true,
                  },
                ]
              : []),
          ],
        },
        { status: 200 }
      );
    }

    // Default to ST Courier tracking
    const result = await fetchSTCourierTracking(awb);

    // Hybrid JIT (Just-in-Time) auto-sync:
    // When live tracking succeeds, automatically synchronize DB order & shipment statuses if needed
    if (result.success) {
      try {
        const { syncOrderStatusFromTrackingResult } = await import(
          "@/features/orders/services/order-tracking-sync.service"
        );
        await syncOrderStatusFromTrackingResult(awb, result);
      } catch (syncErr) {
        console.error("JIT tracking auto-sync error:", syncErr);
      }
    }

    return NextResponse.json(result, {
      status: 200,
      headers: {
        // Cache for 60s on client to avoid unnecessary refetches
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error: any) {
    console.error("Live tracking API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch live tracking details",
      },
      { status: 500 }
    );
  }
}
