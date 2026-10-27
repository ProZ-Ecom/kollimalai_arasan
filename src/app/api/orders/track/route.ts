import { NextRequest, NextResponse } from "next/server";
import { fetchSTCourierTracking } from "@/features/orders/services/courier-tracking.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const awb = searchParams.get("awb")?.trim();
    const courier = (searchParams.get("courier") || "").toLowerCase().trim();

    const orderNumber = searchParams.get("orderNumber")?.trim();
    const shipmentId = searchParams.get("shipmentId")?.trim();

    if (!awb && !orderNumber && !shipmentId) {
      return NextResponse.json(
        { success: false, error: "AWB / Tracking number or Order number is required" },
        { status: 400 }
      );
    }

    const effectiveAwb = awb || "";

    // If MSS Courier, bypass ST Courier API and read internal tracking details updated by admin
    if (courier === "mss" || courier.includes("mettur")) {
      const { db } = await import("@/lib/db/prisma");
      const shipment = await db.shipments.findFirst({
        where: { tracking_number: effectiveAwb, is_active: true },
        include: { orders: true, delivery_partners: true },
        orderBy: { id: "desc" },
      });

      const currentStatus = shipment?.orders?.order_status || shipment?.status || "shipped";
      const isDelivered = currentStatus === "delivered";

      return NextResponse.json(
        {
          success: true,
          awb: effectiveAwb,
          courier: "Mettur Super Services (MSS)",
          isMSS: true,
          summary: {
            currentStatus: currentStatus.replace(/_/g, " ").toUpperCase(),
            bookingDate: shipment?.created_at
              ? new Date(shipment.created_at).toLocaleDateString("en-IN")
              : null,
            deliveryDate: shipment?.delivered_at
              ? new Date(shipment.delivered_at).toLocaleDateString("en-IN")
              : null,
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

    // Query DB shipment to detect if Shiprocket or retrieve linked Shiprocket IDs
    const { db } = await import("@/lib/db/prisma");
    const shipment = await db.shipments.findFirst({
      where: {
        is_active: true,
        OR: [
          ...(effectiveAwb
            ? [
                { tracking_number: effectiveAwb },
                { shiprocket_shipment_id: effectiveAwb },
                { shiprocket_order_id: effectiveAwb },
              ]
            : []),
          ...(orderNumber ? [{ orders: { orderNumber } }] : []),
          ...(shipmentId && /^\d+$/.test(shipmentId)
            ? [{ id: BigInt(shipmentId) }]
            : []),
        ],
      },
      include: { orders: true, delivery_partners: true },
      orderBy: { id: "desc" },
    });

    const isShiprocket =
      courier === "shiprocket" ||
      courier.includes("shiprocket") ||
      effectiveAwb.startsWith("TEST-SR") ||
      effectiveAwb.startsWith("SR-") ||
      Boolean(shipment?.shiprocket_shipment_id) ||
      Boolean(shipment?.shiprocket_order_id) ||
      shipment?.delivery_partners?.code === "SHIPROCKET" ||
      shipment?.delivery_partners?.courier_type === "shiprocket";

    // If Shiprocket, call Shiprocket Sandbox & Production Shipment APIs (/v1/external/shipments)
    if (isShiprocket) {
      const { getShiprocketShipmentTracking } = await import("@/lib/shiprocket");
      const result = await getShiprocketShipmentTracking({
        awb: effectiveAwb || shipment?.tracking_number || undefined,
        shipmentId:
          shipment?.shiprocket_shipment_id ||
          (effectiveAwb && /^\d+$/.test(effectiveAwb) ? effectiveAwb : undefined),
        orderId: shipment?.shiprocket_order_id || undefined,
        orderNumber: orderNumber || shipment?.orders?.orderNumber || undefined,
        courierPartnerName: shipment?.courier_partner_name || undefined,
      });

      // Safe Development-Only Simulation Check
      // Strictly disabled unless BOTH conditions are true:
      const isSimulationEnabled =
        process.env.NODE_ENV === "development" &&
        process.env.SHIPROCKET_LOCAL_TRACKING_SIMULATION === "true";

      if (isSimulationEnabled && shipment) {
        // Retrieve local database tracking checkpoints
        const localCheckpoints = await db.shipment_tracking.findMany({
          where: {
            shipment_id: shipment.id,
            is_active: true,
          },
          orderBy: { id: "desc" },
        });

        if (localCheckpoints.length > 0) {
          const STATUS_RANK: Record<string, number> = {
            "CONFIRMED": 1,
            "PENDING": 1,
            "ORDER CONFIRMED (PENDING PICKUP)": 1,
            "AWB ASSIGNED": 1,
            "PICKED UP": 2,
            "PICKED_UP": 2,
            "SHIPPED": 2,
            "IN TRANSIT": 3,
            "IN_TRANSIT": 3,
            "OUT FOR DELIVERY": 4,
            "OUT_FOR_DELIVERY": 4,
            "DELIVERED": 5,
            "RTO": 6,
            "RETURNED": 6,
            "CANCELLED": 6,
          };

          const getRank = (st?: string | null): number => {
            if (!st) return 0;
            const clean = st.trim().toUpperCase();
            if (STATUS_RANK[clean]) return STATUS_RANK[clean];
            if (clean.includes("DELIVER")) return 5;
            if (clean.includes("OUT") && clean.includes("DELIV")) return 4;
            if (clean.includes("TRANSIT")) return 3;
            if (clean.includes("PICKED") || clean.includes("SHIPP")) return 2;
            return 1;
          };

          const existingCheckpoints = Array.isArray(result.checkpoints) ? [...result.checkpoints] : [];
          const newSimulatedCheckpoints: Array<{
            date: string;
            time?: string;
            location: string;
            status: string;
            isDelivered?: boolean;
          }> = [];

          for (const lcp of localCheckpoints) {
            const lDate = lcp.tracked_at || lcp.created_at;
            const d = new Date(lDate);
            const dateStr = !isNaN(d.getTime())
              ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
              : "";
            const timeStr = !isNaN(d.getTime())
              ? d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
              : "";

            const stName = (lcp.status || "").trim();
            const isDelivered = stName.toLowerCase().includes("delivered");

            // Deduplication: Avoid duplicate entries if status already exists on this date
            const alreadyPresent = existingCheckpoints.some((ec: any) => {
              const ecStatus = (ec.status || "").toUpperCase();
              const target = stName.toUpperCase();
              return ecStatus === target || (ecStatus.includes(target) && ec.date === dateStr);
            });

            if (!alreadyPresent) {
              newSimulatedCheckpoints.push({
                date: dateStr,
                time: timeStr,
                location: lcp.location || "Transit Hub",
                status: lcp.note && !lcp.note.toLowerCase().includes(stName.toLowerCase())
                  ? `${stName}: ${lcp.note}`
                  : (lcp.note || stName),
                isDelivered,
              });
            }
          }

          result.checkpoints = [...newSimulatedCheckpoints, ...existingCheckpoints];

          // Determine whether local simulated status is more advanced than remote sandbox status
          const remoteRank = getRank(result.summary?.currentStatus);
          const localShipmentRank = getRank(shipment.status);
          const localOrderRank = getRank(shipment.orders?.order_status);
          const localLatestCpRank = getRank(localCheckpoints[0]?.status);

          const maxLocalRank = Math.max(localShipmentRank, localOrderRank, localLatestCpRank);

          if (maxLocalRank > remoteRank) {
            let simulatedDisplay = "IN TRANSIT";
            if (maxLocalRank >= 5) {
              simulatedDisplay = "DELIVERED";
              result.isDelivered = true;
              if (result.summary) {
                const deliveryDateStr =
                  shipment.delivered_at
                    ? new Date(shipment.delivered_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                    : (newSimulatedCheckpoints.find((c) => c.isDelivered)?.date || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }));
                result.summary.deliveryDate = deliveryDateStr;
                result.summary.deliveredDate = deliveryDateStr;
              }
            } else if (maxLocalRank === 4) {
              simulatedDisplay = "OUT FOR DELIVERY";
            } else if (maxLocalRank === 3) {
              simulatedDisplay = "IN TRANSIT";
            } else if (maxLocalRank === 2) {
              const firstStatus = (localCheckpoints[0]?.status || "").toUpperCase();
              simulatedDisplay = firstStatus.includes("PICKED") ? "PICKED UP" : "SHIPPED";
            }

            if (result.summary) {
              result.summary.currentStatus = simulatedDisplay;
            }
          }
        }

        return NextResponse.json(result, {
          status: 200,
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
      }

      return NextResponse.json(result, {
        status: 200,
        headers: { "Cache-Control": "private, max-age=30" },
      });
    }

    // Default to ST Courier tracking
    const result = await fetchSTCourierTracking(effectiveAwb);

    // Hybrid JIT (Just-in-Time) auto-sync:
    // When live tracking succeeds, automatically synchronize DB order & shipment statuses if needed
    if (result.success) {
      try {
        const { syncOrderStatusFromTrackingResult } = await import(
          "@/features/orders/services/order-tracking-sync.service"
        );
        await syncOrderStatusFromTrackingResult(effectiveAwb, result);
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
