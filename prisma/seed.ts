import "dotenv/config";
import crypto from "crypto";
import { PrismaClient, product_units_type } from "../src/generated/prisma/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

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

async function main() {
  console.log("Seeding clean deployment database for Kollimalai Arasan...\n");

  const adminPassword = await bcrypt.hash("admin123", 12);
  const customerPassword = await bcrypt.hash("customer123", 12);

  // 1. Roles
  const getOrCreateRole = async (name: string, slug: string, description: string) => {
    let role = await prisma.role.findFirst({ where: { slug } });
    if (!role) {
      role = await prisma.role.create({
        data: { name, slug, description },
      });
    }
    return role;
  };

  const adminRole = await getOrCreateRole("ADMIN", "admin", "Administrator with full access");
  const staffRole = await getOrCreateRole("STAFF", "staff", "Staff member with limited access");
  const customerRole = await getOrCreateRole("CUSTOMER", "customer", "Regular customer");

  console.log("✓ Roles verified (ADMIN, STAFF, CUSTOMER)");

  // 2. Permissions & Admin Role Permissions
  const permissions = [
    { name: "PRODUCT_VIEW", slug: "product-view", module: "PRODUCT" },
    { name: "PRODUCT_CREATE", slug: "product-create", module: "PRODUCT" },
    { name: "PRODUCT_UPDATE", slug: "product-update", module: "PRODUCT" },
    { name: "PRODUCT_DELETE", slug: "product-delete", module: "PRODUCT" },
    { name: "CATEGORY_VIEW", slug: "category-view", module: "CATEGORY" },
    { name: "CATEGORY_CREATE", slug: "category-create", module: "CATEGORY" },
    { name: "CATEGORY_UPDATE", slug: "category-update", module: "CATEGORY" },
    { name: "CATEGORY_DELETE", slug: "category-delete", module: "CATEGORY" },
    { name: "ORDER_VIEW", slug: "order-view", module: "ORDER" },
    { name: "ORDER_UPDATE", slug: "order-update", module: "ORDER" },
    { name: "USER_VIEW", slug: "user-view", module: "USER" },
    { name: "USER_UPDATE", slug: "user-update", module: "USER" },
  ];

  for (const perm of permissions) {
    let created = await prisma.permission.findFirst({ where: { slug: perm.slug } });
    if (!created) {
      created = await prisma.permission.create({ data: perm });
    }
    const existingRp = await prisma.rolePermission.findFirst({
      where: { roleId: adminRole.id, permissionId: created.id },
    });
    if (!existingRp) {
      await prisma.rolePermission.create({
        data: { roleId: adminRole.id, permissionId: created.id },
      });
    }
  }

  console.log("✓ Permissions created and assigned to Admin role");

  // 3. Admin User
  let adminUser = await prisma.user.findFirst({ where: { email: "admin@kollimalaiarasan.com" } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        uuid: crypto.randomUUID(),
        name: "Admin",
        email: "admin@kollimalaiarasan.com",
        password_hash: adminPassword,
        role: { connect: { id: adminRole.id } },
        status: "active",
        email_verified_at: new Date(),
      },
    });
    console.log("✓ Created Admin user: admin@kollimalaiarasan.com");
  } else {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        uuid: adminUser.uuid || crypto.randomUUID(),
        password_hash: adminPassword,
        status: "active",
      },
    });
    console.log("✓ Verified Admin user: admin@kollimalaiarasan.com");
  }

  // 4. Customer User
  let customerUser = await prisma.user.findFirst({ where: { email: "customer@kollimalaiarasan.com" } });
  if (!customerUser) {
    customerUser = await prisma.user.create({
      data: {
        uuid: crypto.randomUUID(),
        name: "Customer",
        email: "customer@kollimalaiarasan.com",
        password_hash: customerPassword,
        role: { connect: { id: customerRole.id } },
        status: "active",
        email_verified_at: new Date(),
      },
    });
    console.log("✓ Created Customer user: customer@kollimalaiarasan.com");
  } else {
    await prisma.user.update({
      where: { id: customerUser.id },
      data: {
        uuid: customerUser.uuid || crypto.randomUUID(),
        password_hash: customerPassword,
        status: "active",
      },
    });
    console.log("✓ Verified Customer user: customer@kollimalaiarasan.com");
  }

  // 5. Default Brand
  const brand = await prisma.productBrand.upsert({
    where: { slug: "kollimalai-arasan" },
    update: {
      name: "Kollimalai Arasan",
      status: true,
      isActive: true,
    },
    create: {
      uuid: crypto.randomUUID(),
      name: "Kollimalai Arasan",
      slug: "kollimalai-arasan",
      description: "Authentic, traditional organic snacks, spices, oils, and heritage foods from Kolli Hills.",
      status: true,
      isActive: true,
    },
  });
  console.log(`✓ Brand verified: "${brand.name}"`);

  // 6. Standard Measurement Units
  const unitsToSeed = [
    { code: "g", name: "Gram", type: product_units_type.weight, factor: 0.001, sort: 1 },
    { code: "kg", name: "Kilogram", type: product_units_type.weight, factor: 1.0, sort: 2 },
    { code: "ml", name: "Millilitre", type: product_units_type.volume, factor: 0.001, sort: 3 },
    { code: "L", name: "Litre", type: product_units_type.volume, factor: 1.0, sort: 4 },
    { code: "pcs", name: "Piece", type: product_units_type.count, factor: 1.0, sort: 5 },
  ];

  for (const u of unitsToSeed) {
    await prisma.product_units.upsert({
      where: { code: u.code },
      update: { name: u.name, type: u.type, is_active: true, status: true },
      create: {
        uuid: crypto.randomUUID(),
        name: u.name,
        code: u.code,
        type: u.type,
        conversion_factor: u.factor,
        sort_order: u.sort,
        is_active: true,
        status: true,
      },
    });
  }
  console.log("✓ Standard units verified (g, kg, ml, L, pcs)");

  // 7. Banner Positions
  const defaultBannerPositions = [
    { name: "Home Hero Banner", slug: "home-hero", page: "home" },
    { name: "Home Offer Banner", slug: "home-offer", page: "home" },
    { name: "Home Popup Offer", slug: "home-popup-offer", page: "home" },
    { name: "Home Reels", slug: "home-reels", page: "home" },
  ];

  for (const position of defaultBannerPositions) {
    const existing = await prisma.banner_positions.findFirst({
      where: { slug: position.slug },
    });
    if (!existing) {
      await prisma.banner_positions.create({
        data: {
          uuid: crypto.randomUUID(),
          name: position.name,
          slug: position.slug,
          page: position.page,
          created_by: adminUser.id,
          updated_by: adminUser.id,
        },
      });
    }
  }
  console.log("✓ Banner positions verified (home-hero, home-offer, home-popup-offer, home-reels)");

  console.log("\n=========================================");
  console.log("🎉 Clean Deployment Database Ready!");
  console.log("=========================================");
  console.log("Admin User    : admin@kollimalaiarasan.com / admin123");
  console.log("Customer User : customer@kollimalaiarasan.com / customer123");
  console.log("=========================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
