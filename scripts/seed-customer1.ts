import "dotenv/config";
import crypto from "crypto";
import bcrypt from "bcryptjs";
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
    database: url.pathname.replace(/^\//, ""),
    connectionLimit: 5,
  });
  return new PrismaClient({ adapter });
}

async function main() {
  const prisma = createClient();
  const customerRole = await prisma.role.findFirst({ where: { slug: "customer" } });
  if (!customerRole) {
    throw new Error("Customer role not found in database");
  }

  const passwordHash = await bcrypt.hash("customer123", 12);
  let user = await prisma.user.findFirst({ where: { email: "customer1@example.com" } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        uuid: crypto.randomUUID(),
        name: "Customer One",
        email: "customer1@example.com",
        password_hash: passwordHash,
        roleId: customerRole.id,
        status: "active",
        email_verified_at: new Date(),
      },
    });
    console.log("✓ Created customer1@example.com with ID:", user.id.toString(), "UUID:", user.uuid);

    // Create a default delivery address
    await prisma.customerAddress.create({
      data: {
        uuid: crypto.randomUUID(),
        userId: user.id,
        label: "Home",
        addressType: "shipping",
        full_name: "Customer One",
        phone: "9876543211",
        address_line1: "12, Gandhi Road, T. Nagar",
        address_line2: "Near Panagal Park",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "600017",
        country: "India",
        isDefault: true,
        status: true,
        is_active: true,
      },
    });
    console.log("✓ Created default delivery address in Chennai for customer1@example.com");
  } else {
    console.log("Customer customer1@example.com already exists:", user.id.toString());
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Error seeding customer1:", err);
  process.exit(1);
});
