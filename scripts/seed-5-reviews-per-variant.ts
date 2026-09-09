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
    database: url.pathname.slice(1),
    connectionLimit: 5,
    allowPublicKeyRetrieval: true,
  });
  return new PrismaClient({ adapter });
}

const prisma = createClient();

const REVIEWERS = [
  { name: "Suresh Ramanathan", email: "suresh.ramanathan@example.com", city: "Chennai" },
  { name: "Ananya Ramesh", email: "ananya.ramesh@example.com", city: "Coimbatore" },
  { name: "Meenakshi Sundaram", email: "meenakshi.sundaram@example.com", city: "Madurai" },
  { name: "Karthik Subramanian", email: "karthik.subramanian@example.com", city: "Bengaluru" },
  { name: "Priya Venkatesh", email: "priya.venkatesh@example.com", city: "Chennai" },
  { name: "Murali Krishnan", email: "murali.krishnan@example.com", city: "Mumbai" },
  { name: "Kavitha Balaji", email: "kavitha.balaji@example.com", city: "Bangalore" },
  { name: "Siddharth Rao", email: "siddharth.rao@example.com", city: "Hyderabad" },
  { name: "Dr. Arvind Swaminathan", email: "arvind.swaminathan@example.com", city: "Tiruchirappalli" },
  { name: "Deepa Rajesh", email: "deepa.rajesh@example.com", city: "Salem" },
  { name: "Lakshmi Narayanan", email: "lakshmi.narayanan@example.com", city: "Tirunelveli" },
  { name: "Vigneshwaran K.", email: "vigneshwaran.k@example.com", city: "Erode" },
  { name: "Gayathri Shankaran", email: "gayathri.s@example.com", city: "Thanjavur" },
  { name: "Ramesh Babu", email: "ramesh.babu@example.com", city: "Vellore" },
  { name: "Nandhini Parthasarathy", email: "nandhini.p@example.com", city: "Chennai" },
];

const REVIEW_TEMPLATES = [
  {
    rating: 5,
    title: "Crispy, fresh, and authentically traditional!",
    comment: (variant: string) =>
      `This ${variant} has the exact homemade crunch and aroma our grandmother used to make. Perfectly balanced salt and spices, zero oily aftertaste. Outstanding quality!`,
  },
  {
    rating: 5,
    title: "Best evening tea-time snack",
    comment: (variant: string) =>
      `The aroma when opening the pouch is simply divine. Pairs phenomenally with hot South Indian filter coffee. The entire packet was finished within 10 minutes!`,
  },
  {
    rating: 4,
    title: "Delicious flavor & generous crunch",
    comment: (variant: string) =>
      `Very tasty ${variant} with a satisfying crisp texture. Spicing is flavorful without being overwhelming. Perfect for snacking while working.`,
  },
  {
    rating: 5,
    title: "Superb packaging and fresh aroma",
    comment: (variant: string) =>
      `Arrived in sturdy, tamper-evident food-grade pouches with zero transit breakage. The freshness was locked in completely. Highly recommend!`,
  },
  {
    rating: 5,
    title: "Authentic festival favorite!",
    comment: (variant: string) =>
      `Brought this ${variant} for our family gathering and everyone from grandparents to toddlers praised the melt-in-mouth crispness. Will definitely reorder the 500g pack!`,
  },
  {
    rating: 5,
    title: "Unmatched South Indian authenticity",
    comment: (variant: string) =>
      `Living away from native Tamil Nadu, finding authentic snacks like this ${variant} is a blessing. Fresh ingredients and pure flavor. 10/10!`,
  },
  {
    rating: 4,
    title: "Great taste and healthy crunch",
    comment: (variant: string) =>
      `Really enjoyed the flavor profile of this ${variant}. Not greasy at all, very clean oil used. A great guilt-free munching option.`,
  },
  {
    rating: 5,
    title: "Pure ghee aroma & superb finish",
    comment: (variant: string) =>
      `Every bite is crunchy, aromatic, and rich. You can clearly tell premium grade ingredients are used. Exceeded all our expectations!`,
  },
];

async function main() {
  console.log("=========================================");
  console.log("SEEDING 5 REVIEWS FOR EACH VARIANT (162x5)");
  console.log("=========================================\n");

  // 1. Get or create Customer role
  let customerRole = await prisma.role.findFirst({ where: { slug: "customer" } });
  if (!customerRole) {
    customerRole = await prisma.role.create({
      data: { name: "CUSTOMER", slug: "customer", description: "Customer role" },
    });
  }

  // 2. Ensure customer user accounts exist
  const dummyPassword = await bcrypt.hash("customer123", 10);
  const createdUsers: any[] = [];

  for (const r of REVIEWERS) {
    let user = await prisma.user.findFirst({ where: { email: r.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          uuid: crypto.randomUUID(),
          name: r.name,
          email: r.email,
          password_hash: dummyPassword,
          roleId: customerRole.id,
          status: "active",
          email_verified_at: new Date(),
        },
      });
    }
    createdUsers.push(user);
  }
  console.log(`✓ Ensured ${createdUsers.length} active customer profiles for reviews.`);

  // 3. Clear existing reviews
  await prisma.$executeRawUnsafe("DELETE FROM `review_images`;");
  await prisma.$executeRawUnsafe("DELETE FROM `reviews`;");
  console.log("✓ Cleared previous reviews table.\n");

  // 4. Fetch all active variants with their product and unit prices
  const variants = await prisma.productVariant.findMany({
    where: { isActive: true, deleted_at: null },
    include: {
      product: { select: { id: true, name: true } },
      variant_unit_prices: {
        where: { isActive: true, deleted_at: null },
        orderBy: { unit_value: "asc" },
      },
    },
  });

  console.log(`Found ${variants.length} variants across all products.`);

  let totalReviewsCreated = 0;

  for (let vIdx = 0; vIdx < variants.length; vIdx++) {
    const variant = variants[vIdx];
    const unitPrices = variant.variant_unit_prices;
    if (!unitPrices || unitPrices.length === 0) {
      console.warn(`! Skipping variant ${variant.variant_name} (no unit prices found)`);
      continue;
    }

    // Generate exactly 5 reviews for this variant
    for (let r = 0; r < 5; r++) {
      // Pick reviewer rotating through user list
      const user = createdUsers[(vIdx * 5 + r) % createdUsers.length];

      // Pick template
      const template = REVIEW_TEMPLATES[(vIdx * 5 + r) % REVIEW_TEMPLATES.length];

      // Alternate unit price: 200g (index 0) or 500g (index 1 if available)
      const selectedUnit = unitPrices.length > 1 && r % 2 === 1 ? unitPrices[1] : unitPrices[0];

      // Slight date spread (within last 30 days)
      const daysAgo = (r * 5 + (vIdx % 10)) % 30;
      const reviewDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      await prisma.review.create({
        data: {
          uuid: crypto.randomUUID(),
          productId: variant.productId,
          variant_unit_price_id: selectedUnit.id,
          userId: user.id,
          rating: template.rating,
          title: template.title,
          comment: template.comment(variant.variant_name),
          isApproved: true,
          is_active: true,
          createdAt: reviewDate,
          updatedAt: reviewDate,
        },
      });

      totalReviewsCreated++;
    }

    if ((vIdx + 1) % 27 === 0 || vIdx === variants.length - 1) {
      console.log(`✓ Seeded reviews for ${vIdx + 1}/${variants.length} variants (${totalReviewsCreated} reviews total)...`);
    }
  }

  console.log("\n=========================================");
  console.log("REVIEWS SEEDED SUCCESSFULLY!");
  console.log("=========================================");
  console.log(`📦 Variants Processed: ${variants.length}`);
  console.log(`⭐ Reviews Created:    ${totalReviewsCreated} (5 per variant)`);
  console.log("=========================================\n");
}

main()
  .catch((e) => {
    console.error("Error seeding reviews:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
