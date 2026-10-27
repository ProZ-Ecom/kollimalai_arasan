import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Shiprocket webhook endpoint is active and listening",
  });
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // Verify webhook payload
    const awb = body.awb || body.awb_code;
    const currentStatus = (body.current_status || body.status || "").toUpperCase();
    const location = body.location || body.current_status_location || "";
    const activity = body.activity || body.current_status_activity || currentStatus;

    if (!awb && !body.order_id && !body.shipment_id) {
      return NextResponse.json({
        success: true,
        message: "Webhook endpoint reachable and ready for shipment tracking updates",
      });
    }

    // 1. Check if event belongs to a Reverse Return Pickup
    const returnReq = await db.return_requests.findFirst({
      where: {
        is_active: true,
        OR: [
          ...(awb ? [{ return_awb_code: String(awb) }] : []),
          ...(body.shipment_id ? [{ return_shipment_id: String(body.shipment_id) }] : []),
        ],
      },
    });

    if (returnReq) {
      const now = new Date();
      if (currentStatus === "PICKED_UP" || currentStatus === "IN_TRANSIT") {
        await db.return_requests.update({
          where: { id: returnReq.id },
          data: { status: "picked_up", updated_at: now },
        });
      }
      return NextResponse.json({
        success: true,
        message: `Shiprocket Return Webhook processed for Return Request #${returnReq.id}`,
      });
    }

    // 2. Find standard shipment in database
    const shipment = await db.shipments.findFirst({
      where: {
        is_active: true,
        OR: [
          ...(awb ? [{ tracking_number: String(awb) }] : []),
          ...(body.shipment_id ? [{ shiprocket_shipment_id: String(body.shipment_id) }] : []),
          ...(body.order_id ? [{ orders: { orderNumber: String(body.order_id) } }] : []),
        ],
      },
      include: {
        orders: true,
      },
      orderBy: { id: "desc" },
    });

    if (!shipment || !shipment.orders) {
      // Return 200 to acknowledge receipt even if order not found locally
      return NextResponse.json({
        success: true,
        message: "Shipment not found locally, webhook acknowledged",
      });
    }

    const order = shipment.orders;
    const now = new Date();

    // Prevent overwriting manual admin cancellations / returns
    if (order.order_status === "cancelled" || order.order_status === "returned") {
      return NextResponse.json({
        success: true,
        message: "Order has terminal status override, skipping status update",
      });
    }

    // Process status updates
    if (currentStatus === "DELIVERED") {
      await db.$transaction([
        db.shipments.update({
          where: { id: shipment.id },
          data: {
            status: "delivered",
            delivered_at: now,
            updated_at: now,
          },
        }),
        db.order.update({
          where: { id: order.id },
          data: {
            order_status: "delivered",
            payment_status: "paid", // If COD, courier collects money upon delivery
            updatedAt: now,
          },
        }),
        db.order_status_history.create({
          data: {
            order_id: order.id,
            status: "delivered",
            note: `Auto-updated via Shiprocket Webhook: Delivered to customer at ${location || "destination"}`,
          },
        }),
        db.shipment_tracking.create({
          data: {
            shipment_id: shipment.id,
            status: "Delivered",
            location: location || "Customer Address",
            note: activity || "Shipment successfully delivered",
          },
        }),
      ]);
    } else if (
      currentStatus === "OUT_FOR_DELIVERY" ||
      currentStatus === "OUT FOR DELIVERY"
    ) {
      await db.$transaction([
        db.shipments.update({
          where: { id: shipment.id },
          data: {
            status: "out_for_delivery",
            updated_at: now,
          },
        }),
        db.order.update({
          where: { id: order.id },
          data: {
            order_status: "out_for_delivery",
            updatedAt: now,
          },
        }),
        db.order_status_history.create({
          data: {
            order_id: order.id,
            status: "out_for_delivery",
            note: `Auto-updated via Shiprocket: Out for delivery today at ${location || "local hub"}`,
          },
        }),
        db.shipment_tracking.create({
          data: {
            shipment_id: shipment.id,
            status: "Out for Delivery",
            location: location || "Local Delivery Hub",
            note: activity || "Package is out for delivery today",
          },
        }),
      ]);
    } else if (
      currentStatus === "RTO_INITIATED" ||
      currentStatus === "RTO_DELIVERED" ||
      currentStatus === "RETURNED"
    ) {
      await db.$transaction([
        db.shipments.update({
          where: { id: shipment.id },
          data: {
            status: "failed",
            updated_at: now,
          },
        }),
        db.order.update({
          where: { id: order.id },
          data: {
            order_status: "returned",
            updatedAt: now,
          },
        }),
        db.order_status_history.create({
          data: {
            order_id: order.id,
            status: "returned",
            note: `Shiprocket Webhook: RTO initiated (${activity})`,
          },
        }),
      ]);
    } else if (
      currentStatus === "PICKED_UP" ||
      currentStatus === "IN_TRANSIT" ||
      currentStatus === "SHIPPED"
    ) {
      await db.$transaction([
        db.shipments.update({
          where: { id: shipment.id },
          data: {
            status: "in_transit",
            shipped_at: shipment.shipped_at || now,
            updated_at: now,
          },
        }),
        ...(order.order_status !== "shipped" && order.order_status !== "delivered"
          ? [
              db.order.update({
                where: { id: order.id },
                data: {
                  order_status: "shipped",
                  updatedAt: now,
                },
              }),
            ]
          : []),
        db.shipment_tracking.create({
          data: {
            shipment_id: shipment.id,
            status: currentStatus.replace(/_/g, " "),
            location: location || "Transit Hub",
            note: activity || "Package in transit",
          },
        }),
      ]);
    }

    return NextResponse.json({
      success: true,
      message: `Shiprocket webhook processed for AWB ${awb || order.orderNumber}`,
    });
  } catch (error: any) {
    console.error("Shiprocket webhook error:", error);
    // Return 200 to prevent webhook retries while logging the error
    return NextResponse.json(
      { success: false, error: error.message || "Webhook handling failed" },
      { status: 200 }
    );
  }
}
