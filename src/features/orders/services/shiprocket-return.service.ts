import { db } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/api-error";
import {
  createShiprocketReturnOrder,
  assignShiprocketAwb,
  generateShiprocketLabel,
} from "@/lib/shiprocket";
import { userRepository } from "@/features/users/repositories/user.repository";
import { isProduction, isShiprocketMockFallbackAllowed } from "@/lib/env-config";

export async function createReturnPickupViaShiprocket(
  adminSessionUserId: string,
  returnRequestIdentifier: string
) {
  const adminUser = await userRepository.findById(adminSessionUserId);
  const adminId = adminUser?.internalId ?? null;

  const isNumeric = /^\d+$/.test(returnRequestIdentifier);
  const returnReq = await db.return_requests.findFirst({
    where: {
      is_active: true,
      OR: [
        { uuid: returnRequestIdentifier },
        ...(isNumeric ? [{ id: BigInt(returnRequestIdentifier) }] : []),
      ],
    },
    include: {
      orders: {
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
          user: true,
        },
      },
      return_items: true,
    },
  });

  if (!returnReq) {
    throw ApiError.notFound("Return request not found");
  }

  // Guard against duplicate booking
  if (returnReq.return_awb_code) {
    return {
      returnId: String(returnReq.id),
      orderNumber: returnReq.orders.orderNumber,
      returnAwb: returnReq.return_awb_code,
      courierName: returnReq.courier_partner_name || "Shiprocket Return",
      labelUrl: returnReq.return_label_url,
      alreadyBooked: true,
      message: `Return pickup was already generated with AWB ${returnReq.return_awb_code}`,
    };
  }

  const order = returnReq.orders;
  const customerAddress = order.address[0];
  if (!customerAddress) {
    throw ApiError.badRequest("Customer address not found for return pickup");
  }

  // Calculate items and total weight
  let totalWeightKg = 0;
  const items = order.items.map((it) => {
    const rawWeight = it.variant_unit_price?.weight_kg;
    const unitWeight = rawWeight ? Number(rawWeight) : 0.5;
    totalWeightKg += unitWeight * it.quantity;

    return {
      name: it.product_name_snapshot,
      sku: it.sku_snapshot || `SKU-${it.id}`,
      units: it.quantity,
      selling_price: Number(it.unit_price),
      discount: 0,
    };
  });

  if (totalWeightKg <= 0) totalWeightKg = 0.5;

  const customerName =
    customerAddress.full_name || order.user.name || "Customer";
  const customerPhone = customerAddress.phone || order.user.phone || "";

  // 1. Create return order on Shiprocket
  const isProd = isProduction();
  const allowMockFallback = isShiprocketMockFallbackAllowed();

  let returnOrder: { order_id: number; shipment_id: number; status: string };

  try {
    returnOrder = await createShiprocketReturnOrder({
      orderNumber: order.orderNumber,
      orderDate: returnReq.requested_at || new Date(),
      customerName,
      customerPhone,
      customerAddress: customerAddress.address_line1,
      customerAddress2: customerAddress.address_line2 || "",
      customerCity: customerAddress.city,
      customerState: customerAddress.state,
      customerPincode: customerAddress.pincode,
      items,
      subtotal: Number(order.subtotal),
      totalWeightKg,
    });
  } catch (err: any) {
    if (allowMockFallback) {
      console.warn(
        "[Development Simulation] Shiprocket return order creation failed; falling back to local simulated booking:",
        err.message
      );
      const simulatedId = Math.floor(1000000000 + Math.random() * 9000000000);
      returnOrder = {
        order_id: simulatedId,
        shipment_id: simulatedId,
        status: "NEW",
      };
    } else {
      // In production or when mock fallback is disabled: fail closed!
      throw ApiError.badRequest(
        `Failed to create reverse pickup order on Shiprocket: ${err.message}`
      );
    }
  }

  // 2. Assign Return AWB
  let returnAwb = "";
  let courierName = "";
  let labelUrl: string | null = null;

  try {
    const awbResult = await assignShiprocketAwb(returnOrder.shipment_id);
    returnAwb = awbResult.awbCode;
    courierName = awbResult.courierName;

    // 3. Generate Return Shipping Label
    try {
      labelUrl = await generateShiprocketLabel(returnOrder.shipment_id);
    } catch (err: any) {
      console.warn("Return shipping label notice:", err.message);
    }
  } catch (awbErr: any) {
    if (allowMockFallback) {
      console.warn(
        "[Development Simulation] Shiprocket AWB assignment failed; generating local mock return AWB:",
        awbErr.message
      );
      returnAwb = `TEST-RET-${Date.now().toString().slice(-8)}`;
      courierName = "Shiprocket Reverse (Local Mock)";
      labelUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
    } else {
      // In production: NEVER fabricate a mock AWB! Fail closed!
      throw ApiError.badRequest(
        `Shiprocket return order created (#${returnOrder.order_id}), but reverse AWB assignment failed: ${awbErr.message}`
      );
    }
  }

  // 4. Update return_requests in database
  const now = new Date();
  await db.$transaction([
    db.return_requests.update({
      where: { id: returnReq.id },
      data: {
        status: "approved",
        approved_at: now,
        return_awb_code: returnAwb,
        return_shipment_id: String(returnOrder.shipment_id),
        return_label_url: labelUrl,
        courier_partner_name: courierName,
        updated_at: now,
        updated_by: adminId,
      },
    }),
    db.order_status_history.create({
      data: {
        order_id: order.id,
        status: "returned",
        note: `Return pickup scheduled via Shiprocket (${courierName}) with AWB ${returnAwb}`,
        changed_by: adminId,
      },
    }),
  ]);

  return {
    returnId: String(returnReq.id),
    orderNumber: order.orderNumber,
    returnAwb,
    courierName,
    labelUrl,
    message: `Reverse pickup successfully scheduled with ${courierName}. Return AWB: ${returnAwb}`,
  };
}
