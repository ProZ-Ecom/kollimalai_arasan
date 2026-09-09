import "dotenv/config";
import crypto from "crypto";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

function createClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  const url = new URL(databaseUrl);
  const adapter = new PrismaMariaDb({
    host: url.hostname === "localhost" ? "127.0.0.1" : url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit: 5,
    allowPublicKeyRetrieval: true,
  });
  return new PrismaClient({ adapter });
}

const prisma = createClient();

const STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
] as const;

async function main() {
  console.log("🚀 Starting test orders generation for all statuses...");

  // 1. Find or pick users
  const users = await prisma.user.findMany({
    where: { is_active: true },
    take: 5,
  });

  if (users.length === 0) {
    console.error("❌ No users found in database!");
    return;
  }

  console.log(`Found ${users.length} user(s). Generating test orders...`);

  // 2. Find product variants
  const variants = await prisma.productVariant.findMany({
    where: { isActive: true },
    include: { product: true },
    take: 10,
  });

  if (variants.length === 0) {
    console.error("❌ No product variants found in database!");
    return;
  }

  console.log(`Found ${variants.length} variant(s).`);

  for (const user of users) {
    console.log(`\n📦 Generating orders for user: ${user.name} (${user.email || user.phone || user.id})`);

    // Ensure customer address exists
    let address = await prisma.customerAddress.findFirst({
      where: { userId: user.id, is_active: true },
    });

    if (!address) {
      address = await prisma.customerAddress.create({
        data: {
          uuid: crypto.randomUUID(),
          userId: user.id,
          addressType: "shipping",
          full_name: user.name || "Valued Customer",
          phone: user.phone || "9876543210",
          address_line1: "124, Temple Street, South Gate",
          address_line2: "Near Meenakshi Amman Temple",
          city: "Madurai",
          state: "Tamil Nadu",
          pincode: "625001",
          country: "India",
          isDefault: true,
          is_active: true,
          created_by: user.id,
          updated_by: user.id,
        },
      });
    }

    for (let i = 0; i < STATUSES.length; i++) {
      const status = STATUSES[i];
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, "");
      const orderNumber = `ORD-${datePart}-${randomSuffix}`;

      // Pick 1-2 random variants
      const sampleVariant = variants[i % variants.length];
      const secondVariant = variants[(i + 1) % variants.length];

      const price1 = Number(sampleVariant.sale_price || sampleVariant.base_price || 120);
      const qty1 = (i % 3) + 1;
      const total1 = price1 * qty1;

      const hasSecond = i % 2 === 0;
      const price2 = hasSecond ? Number(secondVariant.sale_price || secondVariant.base_price || 150) : 0;
      const qty2 = hasSecond ? 1 : 0;
      const total2 = price2 * qty2;

      const subtotal = total1 + total2;
      const shippingCharge = subtotal > 500 ? 0 : 40;
      const totalAmount = subtotal + shippingCharge;

      const orderDaysAgo = (STATUSES.length - i) * 2;
      const placedAt = new Date(Date.now() - orderDaysAgo * 24 * 60 * 60 * 1000);

      const order = await prisma.order.create({
        data: {
          uuid: crypto.randomUUID(),
          orderNumber,
          userId: user.id,
          order_status: status as any,
          payment_status: status === "cancelled" ? "refunded" : status === "pending" ? "pending" : "paid",
          subtotal,
          discountAmount: 0,
          taxAmount: 0,
          shipping_charge: shippingCharge,
          totalAmount,
          notes: `Test order with status: ${status}`,
          placed_at: placedAt,
          createdAt: placedAt,
          is_active: true,
          created_by: user.id,
          updated_by: user.id,
        },
      });

      // Add order address
      await prisma.orderAddress.createMany({
        data: [
          {
            uuid: crypto.randomUUID(),
            orderId: order.id,
            type: "shipping",
            full_name: address.full_name,
            phone: address.phone,
            address_line1: address.address_line1,
            address_line2: address.address_line2,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            country: address.country || "India",
            is_active: true,
            created_by: user.id,
            updated_by: user.id,
          },
          {
            uuid: crypto.randomUUID(),
            orderId: order.id,
            type: "billing",
            full_name: address.full_name,
            phone: address.phone,
            address_line1: address.address_line1,
            address_line2: address.address_line2,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            country: address.country || "India",
            is_active: true,
            created_by: user.id,
            updated_by: user.id,
          },
        ],
      });

      // Add items
      const itemsData = [
        {
          uuid: crypto.randomUUID(),
          orderId: order.id,
          productId: sampleVariant.productId,
          variantId: sampleVariant.id,
          product_name_snapshot: sampleVariant.product.name,
          variant_snapshot: sampleVariant.variant_name,
          sku_snapshot: sampleVariant.sku,
          quantity: qty1,
          unit_price: price1,
          tax_amount: 0,
          total_price: total1,
          is_active: true,
          created_by: user.id,
          updated_by: user.id,
        },
      ];

      if (hasSecond) {
        itemsData.push({
          uuid: crypto.randomUUID(),
          orderId: order.id,
          productId: secondVariant.productId,
          variantId: secondVariant.id,
          product_name_snapshot: secondVariant.product.name,
          variant_snapshot: secondVariant.variant_name,
          sku_snapshot: secondVariant.sku,
          quantity: qty2,
          unit_price: price2,
          tax_amount: 0,
          total_price: total2,
          is_active: true,
          created_by: user.id,
          updated_by: user.id,
        });
      }

      await prisma.orderItem.createMany({
        data: itemsData,
      });

      // Add status history
      await prisma.order_status_history.create({
        data: {
          order_id: order.id,
          status,
          note: `Order status set to ${status}`,
          changed_by: user.id,
          created_at: placedAt,
          is_active: true,
          created_by: user.id,
          updated_by: user.id,
        },
      });

      console.log(`  ✓ Created [${status.toUpperCase()}] order: ${orderNumber} (₹${totalAmount})`);
    }
  }

  console.log("\n✅ Test orders generated successfully for all statuses!");
}

main()
  .catch((e) => {
    console.error("❌ Error generating test orders:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
