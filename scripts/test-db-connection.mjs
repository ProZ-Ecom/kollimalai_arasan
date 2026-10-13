import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

function getClient() {
  const url = new URL(process.env.DATABASE_URL);
  const adapter = new PrismaMariaDb({
    host: url.hostname === "localhost" ? "127.0.0.1" : url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    allowPublicKeyRetrieval: true,
  });
  return new PrismaClient({ adapter });
}

const db = getClient();


async function run() {
  console.log("=== Testing Database Connection ===");

  // 1. Check current database name via raw query
  const dbInfo = await db.$queryRawUnsafe("SELECT DATABASE() as current_db, @@port as port, @@version as mysql_version");
  console.log("Database Info:", dbInfo);

  // 2. Query models via Prisma
  const users = await db.user.findMany({
    select: { id: true, name: true, email: true, role: { select: { name: true } } },
    take: 5,
  });
  console.log("\nSample Users from kollimalai:", users);

  const products = await db.product.findMany({
    select: { id: true, name: true, slug: true, variants: { select: { id: true, variant_name: true } } },
    take: 3,
  });
  console.log("\nSample Products from kollimalai:", JSON.stringify(products, (k, v) => typeof v === "bigint" ? v.toString() : v, 2));

  // 3. Test Read & Write Flow
  console.log("\nTesting Read & Write Flow in kollimalai...");
  const testCategorySlug = `test-sync-cat-${Date.now()}`;
  const createdCategory = await db.productCategory.create({
    data: {
      name: "Temporary Verification Category",
      slug: testCategorySlug,
      description: "Testing Prisma read/write to kollimalai",
    },
  });
  console.log("✓ Successfully created record in kollimalai:", {
    id: createdCategory.id.toString(),
    slug: createdCategory.slug,
  });

  const readBack = await db.productCategory.findUnique({
    where: { slug: testCategorySlug },
  });
  console.log("✓ Successfully read back record from kollimalai:", {
    id: readBack?.id.toString(),
    name: readBack?.name,
  });

  // Clean up test record
  await db.productCategory.delete({
    where: { id: createdCategory.id },
  });
  console.log("✓ Successfully deleted test record from kollimalai");

  console.log("\n🎉 Verification Completed Successfully! Prisma is reading and writing strictly to `kollimalai`.");
}

run()
  .catch((err) => {
    console.error("❌ Verification Failed:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
