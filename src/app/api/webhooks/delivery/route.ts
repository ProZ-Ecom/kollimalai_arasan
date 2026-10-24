import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  try {
    // 1. Optional Auth Token verification if configured in .env
    const expectedToken = process.env.SHIPROCKET_WEBHOOK_TOKEN;
    if (expectedToken) {
      const incomingKey =
        req.headers.get("x-api-key") ||
        req.headers.get("authorization") ||
        req.headers.get("x-auth-token") ||
        req.headers.get("token");

      if (
        incomingKey &&
        incomingKey !== expectedToken &&
        incomingKey !== `Bearer ${expectedToken}`
      ) {
        return NextResponse.json(
          { success: false, message: "Invalid webhook auth token" },
          { status: 401 }
        );
      }
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // 2. Respond HTTP 200 to Shiprocket Console "Test Webhook" ping
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

    // 3. Check if event belongs to a Reverse Return Pickup
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
        message: `Return Webhook processed for Return Request #${returnReq.id}`,
      });
    }

    // 4. Find standard forward shipment in database
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
      // Return 200 so Shiprocket marks webhook as successfully received
      return NextResponse.json({
        success: true,
        message: "Shipment not found locally, webhook acknowledged",
      });
    }

    const order = shipment.orders;
    const now = new Date();

    // Prevent overwriting manual admin terminal states
    if (order.order_status === "cancelled" || order.order_status === "returned") {
      return NextResponse.json({
        success: true,
        message: "Order has terminal status override, skipping status update",
      });
    }

    // 5. Process status updates
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
            payment_status: "paid",
            updatedAt: now,
          },
        }),
        db.order_status_history.create({
          data: {
            order_id: order.id,
            status: "delivered",
            note: `Auto-updated via Courier Webhook: Delivered to customer at ${location || "destination"}`,
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
            note: `Auto-updated via Courier: Out for delivery today at ${location || "local hub"}`,
          },
        }),
        db.shipment_tracking.create({
          data: {
            shipment_id: shipment.id,
            status: "Out for Delivery",
            location: location || "Destination Hub",
            note: activity || "Out for delivery with delivery agent",
          },
        }),
      ]);
    } else if (currentStatus.includes("RTO") || currentStatus === "RETURNED") {
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
            note: `Auto-updated via Courier Webhook: RTO / Returned undelivered (${location || activity || "Carrier return"})`,
          },
        }),
        db.shipment_tracking.create({
          data: {
            shipment_id: shipment.id,
            status: "RTO / Returned",
            location: location || "Hub",
            note: activity || "Package returned to warehouse",
          },
        }),
      ]);
    } else if (currentStatus === "IN_TRANSIT" || currentStatus === "PICKED_UP") {
      await db.shipments.update({
        where: { id: shipment.id },
        data: {
          status: "in_transit",
          updated_at: now,
        },
      });

      if (order.order_status === "packed" || order.order_status === "processing") {
        await db.order.update({
          where: { id: order.id },
          data: {
            order_status: "shipped",
            updatedAt: now,
          },
        });
      }

      await db.shipment_tracking.create({
        data: {
          shipment_id: shipment.id,
          status: currentStatus === "PICKED_UP" ? "Picked Up" : "In Transit",
          location: location || "Transit Hub",
          note: activity || `Shipment status: ${currentStatus}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Webhook processed successfully for Order #${order.orderNumber} (Status: ${currentStatus})`,
    });
  } catch (error: any) {
    console.error("Courier webhook processing error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Webhook error" },
      { status: 500 }
    );
  }
}

// Allow GET to verify the webhook in browser or curl
export async function GET() {
  return NextResponse.json({
    status: "active",
    service: "Shipment Delivery Webhook Handler",
    supportedEvents: ["DELIVERED", "OUT_FOR_DELIVERY", "IN_TRANSIT", "PICKED_UP", "RTO"],
  });
}
