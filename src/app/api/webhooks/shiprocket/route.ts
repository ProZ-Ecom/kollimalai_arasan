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
    // 1. Verify Webhook Secret Token (Production Safety Requirement)
    const expectedToken = process.env.SHIPROCKET_WEBHOOK_TOKEN;
    const isDev = process.env.NODE_ENV === "development";
    if (expectedToken) {
      const incomingKey =
        req.headers.get("x-api-key") ||
        req.headers.get("authorization") ||
        req.headers.get("x-auth-token") ||
        req.headers.get("token");

      const isKeyValid =
        incomingKey === expectedToken ||
        incomingKey === `Bearer ${expectedToken}`;

      // In production, strictly reject if token is missing or invalid.
      // In development, reject if an invalid token is explicitly supplied, but allow unauthenticated local testing.
      if (!isKeyValid) {
        if (!isDev || incomingKey) {
          return NextResponse.json(
            { success: false, message: "Invalid or missing webhook authentication token" },
            { status: 401 }
          );
        }
      }
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // 2. Extract and verify webhook payload identifiers
    const awb = body.awb || body.awb_code;
    const location = body.location || body.current_status_location || "";
    const activity = body.activity || body.current_status_activity || "";

    if (!awb && !body.order_id && !body.shipment_id) {
      return NextResponse.json({
        success: true,
        message: "Webhook endpoint reachable and ready for shipment tracking updates",
      });
    }

    // 3. Normalize status from numeric IDs and strings (handling spaces and underscores)
    const rawStatus = String(body.current_status || body.status || "").trim().toUpperCase();
    const rawStatusId = Number(body.current_status_id ?? body.status_id ?? body.shipment_status_id ?? NaN);

    let normalizedStatus:
      | "PICKED_UP"
      | "IN_TRANSIT"
      | "OUT_FOR_DELIVERY"
      | "DELIVERED"
      | "RTO"
      | "CANCELLED"
      | "UNKNOWN" = "UNKNOWN";
    let statusDisplay = rawStatus.replace(/_/g, " ");

    if (rawStatusId === 7 || rawStatus === "DELIVERED") {
      normalizedStatus = "DELIVERED";
      statusDisplay = "Delivered";
    } else if (
      rawStatusId === 17 ||
      rawStatusId === 39 ||
      rawStatus === "OUT_FOR_DELIVERY" ||
      rawStatus === "OUT FOR DELIVERY"
    ) {
      normalizedStatus = "OUT_FOR_DELIVERY";
      statusDisplay = "Out for Delivery";
    } else if (
      rawStatusId === 42 ||
      rawStatus === "PICKED_UP" ||
      rawStatus === "PICKED UP"
    ) {
      normalizedStatus = "PICKED_UP";
      statusDisplay = "Picked Up";
    } else if (
      rawStatusId === 18 ||
      rawStatusId === 38 ||
      rawStatusId === 19 ||
      rawStatusId === 6 ||
      rawStatus === "IN_TRANSIT" ||
      rawStatus === "IN TRANSIT" ||
      rawStatus === "SHIPPED"
    ) {
      normalizedStatus = "IN_TRANSIT";
      statusDisplay = "In Transit";
    } else if (
      rawStatusId === 9 ||
      rawStatusId === 10 ||
      rawStatus.includes("RTO") ||
      rawStatus === "RETURNED"
    ) {
      normalizedStatus = "RTO";
      statusDisplay = "Returned / RTO";
    } else if (rawStatusId === 8 || rawStatus === "CANCELLED" || rawStatus === "CANCELED") {
      normalizedStatus = "CANCELLED";
      statusDisplay = "Cancelled";
    }

    if (normalizedStatus === "UNKNOWN") {
      return NextResponse.json({
        success: true,
        message: `Webhook acknowledged (Status '${rawStatus || rawStatusId}' requires no system update)`,
      });
    }

    // 4. Check if event belongs to a Reverse Return Pickup
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
      if (normalizedStatus === "PICKED_UP" || normalizedStatus === "IN_TRANSIT") {
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

    // 5. Find standard forward shipment in database
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
        orders: {
          include: {
            payments: {
              where: { is_active: true },
              include: { payment_methods: true },
              orderBy: { id: "desc" },
              take: 1,
            },
          },
        },
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

    // Check if duplicate tracking checkpoint already exists
    const existingCheckpoint = await db.shipment_tracking.findFirst({
      where: {
        shipment_id: shipment.id,
        is_active: true,
        status: statusDisplay,
        ...(location ? { location } : {}),
      },
      orderBy: { id: "desc" },
    });

    // 6. Process status updates with state downgrade protection
    if (normalizedStatus === "DELIVERED") {
      const isAlreadyDelivered = order.order_status === "delivered";

      // COD payment rule check:
      // Only mark paid if already paid, or if COD order where courier collects payment on delivery.
      const latestPayment = order.payments?.[0];
      const isCodOrder = Boolean(
        latestPayment?.gateway?.toUpperCase() === "COD" ||
        latestPayment?.payment_methods?.code?.toUpperCase() === "COD" ||
        (order.notes && order.notes.toLowerCase().includes("cod"))
      );
      const newPaymentStatus = order.payment_status === "paid" ? "paid" : isCodOrder ? "paid" : order.payment_status;

      await db.$transaction(async (tx) => {
        await tx.shipments.update({
          where: { id: shipment.id },
          data: {
            status: "delivered",
            delivered_at: shipment.delivered_at || now,
            updated_at: now,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            order_status: "delivered",
            payment_status: newPaymentStatus,
            updatedAt: now,
          },
        });

        if (!isAlreadyDelivered) {
          await tx.order_status_history.create({
            data: {
              order_id: order.id,
              status: "delivered",
              note: `Auto-updated via Shiprocket Webhook: Delivered to customer at ${location || "destination"}`,
              is_active: true,
            },
          });

          // Commit inventory on delivery (only on first transition to delivered)
          const orderItems = await tx.orderItem.findMany({
            where: { orderId: order.id, is_active: true },
            select: { variantUnitPriceId: true, quantity: true },
          });

          for (const item of orderItems) {
            if (!item.variantUnitPriceId) continue;
            const vupId = BigInt(item.variantUnitPriceId);
            const inv = await tx.inventory.findFirst({
              where: { variantUnitPriceId: vupId, is_active: true },
            });
            if (!inv) continue;
            const reserved = Math.max(0, Number(inv.quantity_reserved) - item.quantity);
            await tx.inventory.update({
              where: { id: BigInt(inv.id) },
              data: { quantity_reserved: reserved },
            });
            await tx.inventoryTransaction.create({
              data: {
                variant_unit_price_id: vupId,
                type: "out" as any,
                quantity: item.quantity,
                note: `SALE: order delivered — auto-synced via Shiprocket (AWB: ${awb || shipment.tracking_number})`,
              },
            });
          }
        }

        if (!existingCheckpoint) {
          await tx.shipment_tracking.create({
            data: {
              shipment_id: shipment.id,
              status: statusDisplay,
              location: location || "Customer Address",
              note: activity || "Shipment successfully delivered to consignee",
              is_active: true,
            },
          });
        }
      });
    } else if (normalizedStatus === "OUT_FOR_DELIVERY") {
      // Do not downgrade if shipment is already marked delivered
      const canUpdateShipment = shipment.status !== "delivered";
      const canUpdateOrder = order.order_status !== "delivered";

      await db.$transaction(async (tx) => {
        if (canUpdateShipment) {
          await tx.shipments.update({
            where: { id: shipment.id },
            data: {
              status: "out_for_delivery",
              updated_at: now,
            },
          });
        }

        if (canUpdateOrder && order.order_status !== "out_for_delivery") {
          await tx.order.update({
            where: { id: order.id },
            data: {
              order_status: "out_for_delivery",
              updatedAt: now,
            },
          });

          await tx.order_status_history.create({
            data: {
              order_id: order.id,
              status: "out_for_delivery",
              note: `Auto-updated via Shiprocket: Out for delivery today at ${location || "local hub"}`,
              is_active: true,
            },
          });
        }

        if (!existingCheckpoint) {
          await tx.shipment_tracking.create({
            data: {
              shipment_id: shipment.id,
              status: statusDisplay,
              location: location || "Local Delivery Hub",
              note: activity || "Package is out for delivery today",
              is_active: true,
            },
          });
        }
      });
    } else if (normalizedStatus === "RTO") {
      await db.$transaction(async (tx) => {
        await tx.shipments.update({
          where: { id: shipment.id },
          data: {
            status: "failed",
            updated_at: now,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            order_status: "returned",
            updatedAt: now,
          },
        });

        await tx.order_status_history.create({
          data: {
            order_id: order.id,
            status: "returned",
            note: `Shiprocket Webhook: RTO initiated (${activity || "Return to origin"})`,
            is_active: true,
          },
        });

        if (!existingCheckpoint) {
          await tx.shipment_tracking.create({
            data: {
              shipment_id: shipment.id,
              status: statusDisplay,
              location: location || "Hub",
              note: activity || "Package in return to origin transit",
              is_active: true,
            },
          });
        }
      });
    } else if (normalizedStatus === "PICKED_UP" || normalizedStatus === "IN_TRANSIT") {
      // Do not downgrade if shipment is already out_for_delivery or delivered
      const canUpdateShipment = shipment.status !== "delivered" && shipment.status !== "out_for_delivery";
      const canUpdateOrder = order.order_status !== "delivered" && order.order_status !== "out_for_delivery";

      await db.$transaction(async (tx) => {
        if (canUpdateShipment) {
          await tx.shipments.update({
            where: { id: shipment.id },
            data: {
              status: "in_transit",
              shipped_at: shipment.shipped_at || now,
              updated_at: now,
            },
          });
        }

        if (canUpdateOrder && order.order_status !== "shipped") {
          await tx.order.update({
            where: { id: order.id },
            data: {
              order_status: "shipped",
              updatedAt: now,
            },
          });

          await tx.order_status_history.create({
            data: {
              order_id: order.id,
              status: "shipped",
              note: `Auto-updated via Shiprocket: ${statusDisplay} at ${location || "transit hub"}`,
              is_active: true,
            },
          });
        }

        if (!existingCheckpoint) {
          await tx.shipment_tracking.create({
            data: {
              shipment_id: shipment.id,
              status: statusDisplay,
              location: location || "Transit Hub",
              note: activity || "Package in transit with courier partner",
              is_active: true,
            },
          });
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Shiprocket webhook processed for AWB ${awb || order.orderNumber} (Status: ${statusDisplay})`,
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
