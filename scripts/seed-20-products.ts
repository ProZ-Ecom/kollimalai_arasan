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

async function main() {
  console.log("-----------------------------------------");
  console.log("1. CLEARING ENTIRE DATABASE FOR FRESH STORE");
  console.log("-----------------------------------------");

  await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0;");

  const tablesToClear = [
    "return_items",
    "return_requests",
    "shipments",
    "reviews",
    "review_images",
    "order_items",
    "order_addresses",
    "order_status_history",
    "payments",
    "payment_transactions",
    "orders",
    "cart_items",
    "carts",
    "wishlist_items",
    "inventories",
    "inventory_transactions",
    "variant_price_history",
    "variant_unit_prices",
    "product_variant_images",
    "product_variants",
    "product_images",
    "product_tag_maps",
    "combo_product_items",
    "offer_products",
    "products",
    "product_category_images",
    "product_categories",
    "produt_brand_images",
    "product_brands",
    "product_units",
    "customer_addresses",
  ];

  for (const table of tablesToClear) {
    try {
      if (table === "product_units") {
        await prisma.$executeRawUnsafe("UPDATE `product_units` SET `base_unit_id` = NULL;");
      }
      await prisma.$executeRawUnsafe(`DELETE FROM \`${table}\`;`);
      console.log(`✓ Cleared table: ${table}`);
    } catch (e: any) {
      console.warn(`! Warning on clearing ${table}: ${e.message}`);
    }
  }

  await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1;");
  console.log("Database cleared successfully.\n");

  console.log("-----------------------------------------");
  console.log("2. SEEDING ROLES & USERS");
  console.log("-----------------------------------------");

  const adminPassword = await bcrypt.hash("admin123", 12);
  const customerPassword = await bcrypt.hash("customer123", 12);

  // Helper to upsert role
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
  await getOrCreateRole("STAFF", "staff", "Staff member");
  const customerRole = await getOrCreateRole("CUSTOMER", "customer", "Regular customer");

  let adminUser = await prisma.user.findFirst({ where: { email: "admin@rithusnacks.com" } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        uuid: crypto.randomUUID(),
        name: "Admin",
        email: "admin@rithusnacks.com",
        password_hash: adminPassword,
        roleId: adminRole.id,
        status: "active",
        email_verified_at: new Date(),
      },
    });
  }

  let customerUser = await prisma.user.findFirst({ where: { email: "customer@example.com" } });
  if (!customerUser) {
    customerUser = await prisma.user.create({
      data: {
        uuid: crypto.randomUUID(),
        name: "John Customer",
        email: "customer@example.com",
        password_hash: customerPassword,
        roleId: customerRole.id,
        status: "active",
        email_verified_at: new Date(),
      },
    });
  }
  console.log(`✓ Admin User: admin@rithusnacks.com`);
  console.log(`✓ Customer User: customer@example.com / customer123 (UUID: ${customerUser.uuid})\n`);

  console.log("-----------------------------------------");
  console.log("3. SEEDING CUSTOMER ADDRESS");
  console.log("-----------------------------------------");

  await prisma.customerAddress.create({
    data: {
      uuid: crypto.randomUUID(),
      userId: customerUser.id,
      label: "Home",
      addressType: "shipping",
      full_name: "John Customer",
      phone: "9876543210",
      address_line1: "Flat 4B, Meenakshi Towers, 2nd Main Road",
      address_line2: "Anna Nagar East",
      landmark: "Opposite Tower Park",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600040",
      country: "India",
      isDefault: true,
      status: true,
      is_active: true,
    },
  });
  console.log(`✓ Created default delivery address in Chennai for John Customer\n`);

  console.log("-----------------------------------------");
  console.log("4. SEEDING UNITS & BRAND");
  console.log("-----------------------------------------");

  const gramUnit = await prisma.product_units.create({
    data: {
      uuid: crypto.randomUUID(),
      name: "Gram",
      code: "g",
      type: "weight",
      conversion_factor: 0.001,
      is_active: true,
      status: true,
    },
  });

  const kgUnit = await prisma.product_units.create({
    data: {
      uuid: crypto.randomUUID(),
      name: "Kilogram",
      code: "kg",
      type: "weight",
      conversion_factor: 1.0,
      is_active: true,
      status: true,
    },
  });

  const brand = await prisma.productBrand.create({
    data: {
      uuid: crypto.randomUUID(),
      name: "Rithu Snacks",
      slug: "rithu-snacks",
      description: "Authentic, handcrafted South Indian traditional snacks and sweets made with pure cold-pressed oils and pure desi ghee.",
      isActive: true,
      status: true,
    },
  });
  console.log(`✓ Units: Gram (g), Kilogram (kg)`);
  console.log(`✓ Brand: Rithu Snacks\n`);

  console.log("-----------------------------------------");
  console.log("5. SEEDING 5 CATEGORIES");
  console.log("-----------------------------------------");

  const categoryDefs = [
    {
      name: "Traditional Murukku",
      slug: "traditional-murukku",
      description: "Handcrafted, crispy, golden-fried South Indian traditional murukku varieties made with pure rice and urad dal flour.",
    },
    {
      name: "Crispy Chips",
      slug: "crispy-chips",
      description: "Authentic Kerala Nendran banana chips, tapioca crisps, and seasonal jackfruit chips fried in pure coconut oil.",
    },
    {
      name: "Authentic Mixtures",
      slug: "authentic-mixtures",
      description: "Savory Madras mixtures, boondi, and spiced snacks packed with roasted cashews, peanuts, and aromatic curry leaves.",
    },
    {
      name: "South Indian Sweets",
      slug: "south-indian-sweets",
      description: "Decadent pure ghee Mysore Pak, traditional Tirunelveli Halwa, Athirasam, and mouthwatering South Indian sweet treats.",
    },
    {
      name: "Pakoda & Savories",
      slug: "pakoda-savories",
      description: "Crunchy tea-time cashew pakodas, ribbon sev, spicy omapodi, and evening munchies.",
    },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoryDefs) {
    const created = await prisma.productCategory.create({
      data: {
        uuid: crypto.randomUUID(),
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        isActive: true,
        status: true,
      },
    });
    categories[cat.slug] = created;
    console.log(`✓ Category: ${cat.name} (${cat.slug})`);
  }

  console.log("\n-----------------------------------------");
  console.log("6. SEEDING 20 PRODUCTS WITH VARIANTS & INVENTORY");
  console.log("-----------------------------------------");

  const productList = [
    // --- Category 1: Traditional Murukku ---
    {
      name: "Kai Murukku (Handcrafted)",
      slug: "kai-murukku-handcrafted",
      categorySlug: "traditional-murukku",
      description: "Traditional handmade twist murukku crafted with freshly ground raw rice and aromatic cumin, delivering an irresistible crunch.",
      packSizes: [
        { unitId: gramUnit.id, value: 200, price: 120, sku: "KM-200G", isDefault: true },
        { unitId: gramUnit.id, value: 500, price: 280, sku: "KM-500G", isDefault: false },
      ],
    },
    {
      name: "Butter Murukku (Vennai Murukku)",
      slug: "butter-murukku-vennai",
      categorySlug: "traditional-murukku",
      description: "Melt-in-your-mouth tender murukku infused with fresh country butter and white sesame seeds.",
      packSizes: [
        { unitId: gramUnit.id, value: 200, price: 110, sku: "BM-200G", isDefault: true },
        { unitId: gramUnit.id, value: 500, price: 260, sku: "BM-500G", isDefault: false },
      ],
    },
    {
      name: "Ring Murukku (Chegodilu)",
      slug: "ring-murukku-chegodilu",
      categorySlug: "traditional-murukku",
      description: "Crunchy circular bite-sized rings spiced with ajwain, sesame, and mild red chili powder.",
      packSizes: [
        { unitId: gramUnit.id, value: 200, price: 100, sku: "RM-200G", isDefault: true },
        { unitId: gramUnit.id, value: 500, price: 240, sku: "RM-500G", isDefault: false },
      ],
    },
    {
      name: "Thenkuzhal Murukku",
      slug: "thenkuzhal-murukku-classic",
      categorySlug: "traditional-murukku",
      description: "Classic South Indian festival favorite prepared from rice and urad dal with a signature light and airy texture.",
      packSizes: [
        { unitId: gramUnit.id, value: 250, price: 130, sku: "TM-250G", isDefault: true },
        { unitId: gramUnit.id, value: 500, price: 250, sku: "TM-500G", isDefault: false },
      ],
    },

    // --- Category 2: Crispy Chips ---
    {
      name: "Kerala Banana Chips (Yellow Nendran)",
      slug: "kerala-banana-chips-yellow",
      categorySlug: "crispy-chips",
      description: "Authentic thin-sliced prime Nendran bananas slow-fried to perfection in 100% cold-pressed pure coconut oil.",
      packSizes: [
        { unitId: gramUnit.id, value: 200, price: 140, sku: "KBC-200G", isDefault: true },
        { unitId: gramUnit.id, value: 500, price: 330, sku: "KBC-500G", isDefault: false },
      ],
    },
    {
      name: "Pepper Banana Chips (Black Pepper Spicy)",
      slug: "pepper-banana-chips-spicy",
      categorySlug: "crispy-chips",
      description: "Crispy Nendran banana chips generously coated with freshly crushed Malabar black pepper and rock salt.",
      packSizes: [
        { unitId: gramUnit.id, value: 200, price: 150, sku: "PBC-200G", isDefault: true },
        { unitId: gramUnit.id, value: 500, price: 350, sku: "PBC-500G", isDefault: false },
      ],
    },
    {
      name: "Jackfruit Chips (Chakka Varuthathu)",
      slug: "jackfruit-chips-chakka",
      categorySlug: "crispy-chips",
      description: "Exotic seasonal Kerala jackfruit slices fried crisp in pure coconut oil with a natural sweet aroma and savory bite.",
      packSizes: [
        { unitId: gramUnit.id, value: 200, price: 180, sku: "JC-200G", isDefault: true },
        { unitId: gramUnit.id, value: 500, price: 420, sku: "JC-500G", isDefault: false },
      ],
    },
    {
      name: "Tapioca Chips (Spiced Cassava)",
      slug: "tapioca-chips-spiced",
      categorySlug: "crispy-chips",
      description: "Thin wafer-sliced fresh tapioca roots deep-fried and seasoned with fiery red chili, asafoetida, and sea salt.",
      packSizes: [
        { unitId: gramUnit.id, value: 200, price: 110, sku: "TC-200G", isDefault: true },
        { unitId: gramUnit.id, value: 500, price: 260, sku: "TC-500G", isDefault: false },
      ],
    },

    // --- Category 3: Authentic Mixtures ---
    {
      name: "Madras Special Mixture",
      slug: "madras-special-mixture",
      categorySlug: "authentic-mixtures",
      description: "The crown jewel of South Indian tea-time savories, loaded with crunchy omapodi, boondi, fried cashews, and curry leaves.",
      packSizes: [
        { unitId: gramUnit.id, value: 250, price: 135, sku: "MSM-250G", isDefault: true },
        { unitId: gramUnit.id, value: 500, price: 260, sku: "MSM-500G", isDefault: false },
      ],
    },
    {
      name: "Spicy Cornflakes Mixture",
      slug: "spicy-cornflakes-mixture",
      categorySlug: "authentic-mixtures",
      description: "Crisp roasted cornflakes blended with spicy boondi, fried peanuts, raisins, and a zesty chatpata masala.",
      packSizes: [
        { unitId: gramUnit.id, value: 200, price: 120, sku: "SCM-200G", isDefault: true },
        { unitId: gramUnit.id, value: 500, price: 280, sku: "SCM-500G", isDefault: false },
      ],
    },
    {
      name: "Garlic Kara Boondi",
      slug: "garlic-kara-boondi",
      categorySlug: "authentic-mixtures",
      description: "Crispy chickpea flour pearls tossed with crushed garlic pods, golden peanuts, and fragrant fried curry leaves.",
      packSizes: [
        { unitId: gramUnit.id, value: 200, price: 105, sku: "GKB-200G", isDefault: true },
        { unitId: gramUnit.id, value: 500, price: 245, sku: "GKB-500G", isDefault: false },
      ],
    },
    {
      name: "Bombay Special Mixture",
      slug: "bombay-special-mixture",
      categorySlug: "authentic-mixtures",
      description: "A rich, flavorful blend of spiced sev, lentils, roasted chana dal, and sweet raisins.",
      packSizes: [
        { unitId: gramUnit.id, value: 250, price: 125, sku: "BSM-250G", isDefault: true },
        { unitId: gramUnit.id, value: 500, price: 240, sku: "BSM-500G", isDefault: false },
      ],
    },

    // --- Category 4: South Indian Sweets ---
    {
      name: "Tirunelveli Ghee Halwa",
      slug: "tirunelveli-ghee-halwa",
      categorySlug: "south-indian-sweets",
      description: "Legendary dark amber wheat milk halwa simmered with copious pure desi ghee and roasted cashew nuts.",
      packSizes: [
        { unitId: gramUnit.id, value: 250, price: 190, sku: "TGH-250G", isDefault: true },
        { unitId: gramUnit.id, value: 500, price: 360, sku: "TGH-500G", isDefault: false },
      ],
    },
    {
      name: "Traditional Nei Mysore Pak",
      slug: "traditional-nei-mysore-pak",
      categorySlug: "south-indian-sweets",
      description: "Silky, melt-in-the-mouth gram flour fudge enriched with generous amounts of pure aromatic ghee.",
      packSizes: [
        { unitId: gramUnit.id, value: 250, price: 210, sku: "NMP-250G", isDefault: true },
        { unitId: gramUnit.id, value: 500, price: 400, sku: "NMP-500G", isDefault: false },
      ],
    },
    {
      name: "Athirasam (Traditional Jaggery Delicacy)",
      slug: "athirasam-jaggery-sweet",
      categorySlug: "south-indian-sweets",
      description: "Heritage South Indian sweet made from aged fermented rice dough and country jaggery, cardamom, and sesame.",
      packSizes: [
        { unitId: gramUnit.id, value: 250, price: 150, sku: "ATH-250G", isDefault: true },
        { unitId: gramUnit.id, value: 500, price: 290, sku: "ATH-500G", isDefault: false },
      ],
    },
    {
      name: "Pure Ghee Rava Laddu",
      slug: "pure-ghee-rava-laddu",
      categorySlug: "south-indian-sweets",
      description: "Roasted semolina spheres infused with cardamom, plump golden raisins, and roasted cashews bound in pure desi ghee.",
      packSizes: [
        { unitId: gramUnit.id, value: 250, price: 160, sku: "RL-250G", isDefault: true },
        { unitId: gramUnit.id, value: 500, price: 310, sku: "RL-500G", isDefault: false },
      ],
    },

    // --- Category 5: Pakoda & Savories ---
    {
      name: "Cashew Pakoda (Mundhiri Pakoda)",
      slug: "cashew-pakoda-mundhiri",
      categorySlug: "pakoda-savories",
      description: "Crispy, savory tea-time pakoda studded with whole premium cashews, green chilies, and curry leaves.",
      packSizes: [
        { unitId: gramUnit.id, value: 200, price: 195, sku: "CP-200G", isDefault: true },
        { unitId: gramUnit.id, value: 500, price: 460, sku: "CP-500G", isDefault: false },
      ],
    },
    {
      name: "Ribbon Pakoda (Ola Pakoda)",
      slug: "ribbon-pakoda-ola",
      categorySlug: "pakoda-savories",
      description: "Delicately crisp ribbon-shaped strands seasoned with red chili, cumin, and fragrant garlic.",
      packSizes: [
        { unitId: gramUnit.id, value: 200, price: 110, sku: "RP-200G", isDefault: true },
        { unitId: gramUnit.id, value: 500, price: 250, sku: "RP-500G", isDefault: false },
      ],
    },
    {
      name: "Crispy Omapodi (Ajwain Sev)",
      slug: "crispy-omapodi-ajwain-sev",
      categorySlug: "pakoda-savories",
      description: "Fine, delicate golden sev flavored with natural digestive omam (ajwain seeds) and roasted curry leaves.",
      packSizes: [
        { unitId: gramUnit.id, value: 200, price: 100, sku: "OP-200G", isDefault: true },
        { unitId: gramUnit.id, value: 500, price: 235, sku: "OP-500G", isDefault: false },
      ],
    },
    {
      name: "Masala Peanut Sev",
      slug: "masala-peanut-sev",
      categorySlug: "pakoda-savories",
      description: "Crunchy besan-coated spiced peanuts blended with crunchy garlic sev for the ultimate snack craving.",
      packSizes: [
        { unitId: gramUnit.id, value: 200, price: 115, sku: "MPS-200G", isDefault: true },
        { unitId: gramUnit.id, value: 500, price: 260, sku: "MPS-500G", isDefault: false },
      ],
    },
  ];

  let totalProducts = 0;
  let totalUnitPrices = 0;

  for (const item of productList) {
    const category = categories[item.categorySlug];
    const defaultPack = item.packSizes.find((p) => p.isDefault) ?? item.packSizes[0];

    // 1. Create Product
    const product = await prisma.product.create({
      data: {
        uuid: crypto.randomUUID(),
        name: item.name,
        slug: item.slug,
        sku: defaultPack.sku,
        base_price: defaultPack.price,
        categoryId: category.id,
        brandId: brand.id,
        isActive: true,
        status: true,
      },
    });

    // 2. Create Product Variant via raw SQL
    const variantUuid = crypto.randomUUID();
    const variantSku = `VAR-${defaultPack.sku}`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO \`product_variants\` (
        \`uuid\`, \`product_id\`, \`variant_name\`, \`sku\`, \`slug\`, \`unit_value\`, \`unit_id\`,
        \`base_price\`, \`sale_price\`, \`is_default\`, \`is_active\`, \`out_of_stock\`,
        \`created_at\`, \`updated_at\`, \`short_description\`, \`description\`, \`veg_type\`, \`is_featured\`
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, 1, 1, 0,
        NOW(), NOW(), ?, ?, 'veg', 0
      )`,
      variantUuid,
      product.id,
      "Standard Pack",
      variantSku,
      `${item.slug}-standard`,
      defaultPack.value,
      defaultPack.unitId,
      defaultPack.price,
      defaultPack.price,
      item.description.slice(0, 150),
      item.description
    );

    const variant = await prisma.productVariant.findFirstOrThrow({
      where: { uuid: variantUuid },
    });

    // 3. Create Variant Unit Prices & Inventories
    for (const pack of item.packSizes) {
      const unitPrice = await prisma.variantUnitPrice.create({
        data: {
          uuid: crypto.randomUUID(),
          variant_id: variant.id,
          unit_id: pack.unitId,
          unit_value: pack.value,
          sku: pack.sku,
          base_price: pack.price,
          is_default: pack.isDefault,
          isActive: true,
        },
      });

      // 4. Create or update Inventory record (100 units available)
      await prisma.$executeRawUnsafe(
        `INSERT INTO \`inventories\` (
          \`variant_id\`, \`variant_unit_price_id\`, \`quantity_available\`, \`quantity_reserved\`, \`reorder_level\`, \`is_active\`, \`created_at\`, \`updated_at\`
        ) VALUES (?, ?, 100, 0, 10, 1, NOW(), NOW())
        ON DUPLICATE KEY UPDATE \`quantity_available\` = 100, \`is_active\` = 1`,
        variant.id,
        unitPrice.id
      );

      totalUnitPrices++;
    }

    totalProducts++;
    console.log(`✓ Product #${totalProducts}: ${item.name} (${item.packSizes.length} pack sizes, In Stock)`);
  }

  console.log("\n=========================================");
  console.log(`SUCCESSFULLY SEEDED:`);
  console.log(`- Categories: 5`);
  console.log(`- Products: ${totalProducts}`);
  console.log(`- Variant Unit Prices: ${totalUnitPrices}`);
  console.log(`- Inventory items created: ${totalUnitPrices} (all 100 in stock)`);
  console.log(`- Customer User: customer@example.com / customer123`);
  console.log(`- Customer Address: Chennai, Tamil Nadu 600040`);
  console.log("=========================================\n");
}

main()
  .catch((e) => {
    console.error("FATAL ERROR IN SEED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
