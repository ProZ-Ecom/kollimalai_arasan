import { db } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/api-error";
import {
  createShiprocketOrder,
  assignShiprocketAwb,
  generateShiprocketLabel,
  requestShiprocketPickup,
} from "@/lib/shiprocket";
import { userRepository } from "@/features/users/repositories/user.repository";

export interface ShipWithShiprocketOptions {
  notes?: string;
  pickupLocation?: string;
  courierId?: number;
}

export async function shipOrderViaShiprocket(
  adminSessionUserId: string,
  orderIdentifier: string,
  options: ShipWithShiprocketOptions = {}
) {
  const adminUser = await userRepository.findById(adminSessionUserId);
  const adminId = adminUser?.internalId ?? null;

  const isNumeric = /^\d+$/.test(orderIdentifier);
  const order = await db.order.findFirst({
    where: {
      is_active: true,
      OR: [
        { uuid: orderIdentifier },
        { orderNumber: orderIdentifier },
        ...(isNumeric ? [{ id: BigInt(orderIdentifier) }] : []),
      ],
    },
    include: {
      address: {
        where: { is_active: true },
        take: 1,
      },
      items: {
        where: { is_active: true },
        include: {
          variant_unit_price: true,
        },
      },
      payments: {
        where: { is_active: true },
        orderBy: { id: "desc" },
        take: 1,
      },
      shipments: {
        where: { is_active: true },
        orderBy: { id: "desc" },
        take: 1,
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  if (["cancelled", "delivered", "returned"].includes(order.order_status)) {
    throw ApiError.badRequest(
      `Cannot dispatch order with status '${order.order_status}'`
    );
  }

  // Guard against duplicate Shiprocket booking
  const activeShipment = order.shipments[0];
  if (activeShipment?.shiprocket_shipment_id && activeShipment?.tracking_number) {
    return {
      orderNumber: order.orderNumber,
      awbCode: activeShipment.tracking_number,
      courierName: activeShipment.courier_partner_name || "Shiprocket",
      labelUrl: activeShipment.label_url,
      shiprocketOrderId: activeShipment.shiprocket_order_id,
      shiprocketShipmentId: activeShipment.shiprocket_shipment_id,
      alreadyDispatched: true,
      message: `Order was already dispatched with AWB ${activeShipment.tracking_number}`,
    };
  }

  const shippingAddress = order.address[0];
  if (!shippingAddress) {
    throw ApiError.badRequest("Order does not have a valid delivery address");
  }

  // Calculate order items and total weight
  let totalWeightKg = 0;
  const shiprocketItems = order.items.map((item) => {
    const rawWeight = item.variant_unit_price?.weight_kg;
    const unitWeight = rawWeight ? Number(rawWeight) : 0.5;
    totalWeightKg += unitWeight * item.quantity;

    return {
      name: item.product_name_snapshot,
      sku: item.sku_snapshot || `SKU-${item.id}`,
      units: item.quantity,
      selling_price: Number(item.unit_price),
      discount: Number(item.discount_amount || 0),
    };
  });

  if (totalWeightKg <= 0) {
    totalWeightKg = 0.5; // Minimum fallback
  }

  const isCod =
    order.payment_status === "pending" ||
    (order.payments[0]?.gateway || "").toLowerCase().includes("cod");

  const customerName =
    shippingAddress.full_name || order.user.name || "Valued Customer";

  const customerPhone = shippingAddress.phone || order.user.phone || "";
  const customerEmail = order.user.email || "";

  // 1. Create order on Shiprocket
  const isTestMode = process.env.SHIPROCKET_TEST_MODE === "true";
  let shiprocketOrder: {
    order_id: number;
    shipment_id: number;
    status?: string;
    status_code?: number;
    awb_code?: string;
    courier_name?: string;
  };

  try {
    shiprocketOrder = await createShiprocketOrder({
      orderNumber: order.orderNumber,
      orderDate: order.placed_at || order.createdAt || new Date(),
      pickupLocation: options.pickupLocation,
      customerName,
      email: customerEmail,
      phone: customerPhone,
      addressLine1: shippingAddress.address_line1,
      addressLine2: shippingAddress.address_line2 || "",
      city: shippingAddress.city,
      state: shippingAddress.state,
      pincode: shippingAddress.pincode,
      country: shippingAddress.country || "India",
      items: shiprocketItems,
      paymentMethod: isCod ? "COD" : "Prepaid",
      subtotal: Number(order.subtotal),
      shippingCharge: Number(order.shipping_charge),
      discountAmount: Number(order.discountAmount),
      totalAmount: Number(order.totalAmount),
      totalWeightKg,
    });
  } catch (err: any) {
    if (isTestMode) {
      console.warn("Shiprocket sandbox fallback (test mode active):", err.message);
      const simulatedId = Math.floor(1000000000 + Math.random() * 9000000000);
      shiprocketOrder = {
        order_id: simulatedId,
        shipment_id: simulatedId,
        status: "NEW",
        status_code: 200,
        awb_code: `TEST-SR-${Date.now().toString().slice(-8)}`,
        courier_name: "Delhivery Surface (Sandbox)",
      };
    } else {
      throw err;
    }
  }

  // 2. Assign AWB & Auto-Select Courier
  let awbCode = shiprocketOrder.awb_code || "";
  let courierName = shiprocketOrder.courier_name || "";
  let labelUrl: string | null = null;

  if (isTestMode) {
    if (!awbCode) awbCode = `TEST-SR-${Date.now().toString().slice(-8)}`;
    if (!courierName) courierName = "Delhivery Surface (Sandbox)";
    labelUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
  } else if (!awbCode) {
    try {
      const awbResult = await assignShiprocketAwb(
        shiprocketOrder.shipment_id,
        options.courierId
      );
      awbCode = awbResult.awbCode;
      courierName = awbResult.courierName;
    } catch (awbErr: any) {
      // Find or use SHIPROCKET partner to link the shipment
      const shiprocketPartner = await db.delivery_partners.findFirst({
        where: {
          is_active: true,
          OR: [{ code: "SHIPROCKET" }, { courier_type: "shiprocket" }],
        },
      });

      const existingShipment = await db.shipments.findFirst({
        where: { order_id: order.id, is_active: true },
        orderBy: { id: "desc" },
      });

      if (existingShipment) {
        await db.shipments.update({
          where: { id: existingShipment.id },
          data: {
            delivery_partner_id: shiprocketPartner?.id || null,
            shiprocket_order_id: String(shiprocketOrder.order_id),
            shiprocket_shipment_id: String(shiprocketOrder.shipment_id),
            updated_at: new Date(),
          },
        });
      }

      throw ApiError.badRequest(
        `Order registered on Shiprocket (#${shiprocketOrder.order_id}), but AWB could not be generated: ${awbErr.message}`
      );
    }
  }

  // 3. Generate Shipping Label PDF (if not already set in test mode)
  if (!labelUrl) {
    try {
      labelUrl = await generateShiprocketLabel(shiprocketOrder.shipment_id);
    } catch (err) {
      console.warn("Shiprocket label generation delayed:", err);
    }
  }

  // 4. Request Pickup from Warehouse
  try {
    await requestShiprocketPickup(shiprocketOrder.shipment_id);
  } catch (err) {
    console.warn("Shiprocket pickup request notice:", err);
  }

  // 5. Find or use SHIPROCKET partner
  const shiprocketPartner = await db.delivery_partners.findFirst({
    where: {
      is_active: true,
      OR: [{ code: "SHIPROCKET" }, { courier_type: "shiprocket" }],
    },
  });

  // 6. Update database transactionally
  await db.$transaction(async (tx) => {
    const existingShipment = await tx.shipments.findFirst({
      where: {
        order_id: order.id,
        is_active: true,
      },
      orderBy: { id: "desc" },
    });

    let shipmentId: bigint;

    if (existingShipment) {
      shipmentId = existingShipment.id;
      await tx.shipments.update({
        where: { id: existingShipment.id },
        data: {
          delivery_partner_id: shiprocketPartner?.id || null,
          tracking_number: awbCode,
          label_url: labelUrl,
          shiprocket_order_id: String(shiprocketOrder.order_id),
          shiprocket_shipment_id: String(shiprocketOrder.shipment_id),
          courier_partner_name: courierName || "Shiprocket",
          status: "in_transit",
          assignment_status: "assigned",
          shipped_at: new Date(),
          delivery_notes: options.notes?.trim() || existingShipment.delivery_notes,
          updated_by: adminId,
          updated_at: new Date(),
        },
      });
    } else {
      const crypto = await import("crypto");
      const created = await tx.shipments.create({
        data: {
          uuid: crypto.randomUUID(),
          order_id: order.id,
          delivery_partner_id: shiprocketPartner?.id || null,
          tracking_number: awbCode,
          label_url: labelUrl,
          shiprocket_order_id: String(shiprocketOrder.order_id),
          shiprocket_shipment_id: String(shiprocketOrder.shipment_id),
          courier_partner_name: courierName || "Shiprocket",
          status: "in_transit",
          assignment_status: "assigned",
          shipped_at: new Date(),
          delivery_notes: options.notes?.trim() || null,
          created_by: adminId,
          updated_by: adminId,
        },
      });
      shipmentId = created.id;
    }

    // Update order status to shipped if not already
    if (order.order_status !== "shipped" && order.order_status !== "delivered") {
      await tx.order.update({
        where: { id: order.id },
        data: {
          order_status: "shipped",
          updated_by: adminId,
          updatedAt: new Date(),
        },
      });

      // Audit status history
      await tx.order_status_history.create({
        data: {
          order_id: order.id,
          status: "shipped",
          note: `Dispatched via Shiprocket (${courierName}) with AWB ${awbCode}`,
          changed_by: adminId,
        },
      });
    }

    // Add initial tracking checkpoint
    await tx.shipment_tracking.create({
      data: {
        shipment_id: shipmentId,
        status: "AWB Assigned",
        location: "Kolli Hills Warehouse",
        note: `Assigned to ${courierName}. Pickup requested.`,
        created_by: adminId,
      },
    });
  });

  return {
    orderNumber: order.orderNumber,
    awbCode,
    courierName,
    labelUrl,
    shiprocketOrderId: String(shiprocketOrder.order_id),
    shiprocketShipmentId: String(shiprocketOrder.shipment_id),
    message: `Order successfully booked with ${courierName}. AWB: ${awbCode}`,
  };
}
