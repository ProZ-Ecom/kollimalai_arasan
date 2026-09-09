import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const url = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: url.hostname === "localhost" ? "127.0.0.1" : url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  connectionLimit: 5,
  allowPublicKeyRetrieval: true,
});
const prisma = new PrismaClient({ adapter });

async function check() {
  const uuid = "30016d86-7840-4c02-9a77-022daa3ff0e8";
  console.log("--- Checking Variant ---");
  const variant = await prisma.variant.findFirst({ where: { uuid } });
  console.log("Variant:", variant ? { id: variant.id.toString(), uuid: variant.uuid, name: variant.name } : null);

  console.log("--- Checking VariantUnitPrice ---");
  const unitPrice = await prisma.variantUnitPrice.findFirst({ where: { uuid } });
  console.log("UnitPrice:", unitPrice ? { id: unitPrice.id.toString(), uuid: unitPrice.uuid, variant_id: unitPrice.variant_id.toString() } : null);

  console.log("--- Checking Wishlist Items with this UUID ---");
  const wishItems = await prisma.wishlist.findMany({
    where: {
      OR: [
        { uuid },
        { variant: { uuid } },
        { variant_unit_prices: { uuid } }
      ]
    },
    include: {
      variant: true,
      variant_unit_prices: true
    }
  });
  console.log("Wishlist items found:", wishItems.map(w => ({
    id: w.id.toString(),
    uuid: w.uuid,
    user_id: w.user_id.toString(),
    is_active: w.is_active,
    variant_id: w.variant_id.toString(),
    variant_unit_price_id: w.variant_unit_price_id.toString(),
    variant_uuid: w.variant?.uuid,
    unit_price_uuid: w.variant_unit_prices?.uuid
  })));

  await prisma.$disconnect();
}

check().catch(console.error);
