const mariadb = require("mariadb");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
require("dotenv").config();

async function main() {
  console.log("============================================================");
  console.log("🚀 Starting Kollimalai Arasan Real Dashboard Data Seeder");
  console.log("============================================================\n");

  const url = new URL(process.env.DATABASE_URL);
  const host = url.hostname === "localhost" ? "127.0.0.1" : url.hostname;
  const conn = await mariadb.createConnection({
    host,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    allowPublicKeyRetrieval: true,
  });

  try {
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");

    // 1. Clean up invalid / test junk products and variants
    console.log("1. Cleaning up test junk and restoring legitimate catalog...");
    await conn.query("DELETE FROM products WHERE id IN (13, 14) OR name IN ('fdgdfg', 'fdghdfg')");
    await conn.query("DELETE FROM variant_unit_prices WHERE id = 49 OR sku = 'jh,gh'");
    await conn.query("DELETE FROM product_variants WHERE id = 25 OR variant_name = 'gfd'");

    // Restore all legitimate products, categories, variants, and packs
    await conn.query("UPDATE product_categories SET deleted_at = NULL, is_active = 1");
    await conn.query("UPDATE products SET deleted_at = NULL, is_active = 1 WHERE id BETWEEN 1 AND 12");
    await conn.query("UPDATE product_variants SET deleted_at = NULL, is_active = 1 WHERE id BETWEEN 1 AND 24");
    await conn.query("UPDATE variant_unit_prices SET deleted_at = NULL, is_active = 1 WHERE id BETWEEN 1 AND 48");
    console.log("   ✓ Restored all 12 authentic Kolli Hills products, 24 variants, and 48 pack sizes to active status!");

    // 2. Fetch admin user and customer role
    const roles = await conn.query("SELECT id, name FROM roles");
    const adminRole = roles.find((r) => r.name === "ADMIN");
    const customerRole = roles.find((r) => r.name === "CUSTOMER");
    if (!adminRole || !customerRole) {
      throw new Error("ADMIN and CUSTOMER roles must exist");
    }

    const adminUsers = await conn.query("SELECT id FROM users WHERE role_id = ?", [adminRole.id]);
    const adminId = adminUsers.length > 0 ? adminUsers[0].id : 3n;

    // 3. Ensure Payment Methods
    console.log("\n2. Verifying Payment Methods...");
    const existingPms = await conn.query("SELECT id, code FROM payment_methods");
    let razorpayPm = existingPms.find((p) => p.code === "RAZORPAY");
    if (!razorpayPm) {
      const pmRes = await conn.query(
        "INSERT INTO payment_methods (name, code, is_active, created_at, updated_at) VALUES ('Razorpay Online Payment', 'RAZORPAY', 1, NOW(), NOW())"
      );
      razorpayPm = { id: pmRes.insertId, code: "RAZORPAY" };
    }
    let codPm = existingPms.find((p) => p.code === "COD");
    if (!codPm) {
      const pmRes = await conn.query(
        "INSERT INTO payment_methods (name, code, is_active, created_at, updated_at) VALUES ('Cash On Delivery', 'COD', 1, NOW(), NOW())"
      );
      codPm = { id: pmRes.insertId, code: "COD" };
    }
    console.log("   ✓ Payment methods ready: RAZORPAY (ID: " + razorpayPm.id + "), COD (ID: " + codPm.id + ")");

    // 4. Seed Product Images for catalog
    console.log("\n3. Ensuring Product & Category Images...");
    const products = await conn.query("SELECT id, name, slug, category_id FROM products WHERE deleted_at IS NULL ORDER BY id ASC");
    for (const prod of products) {
      const existingImg = await conn.query("SELECT id FROM product_images WHERE product_id = ?", [prod.id]);
      if (existingImg.length === 0) {
        await conn.query(
          "INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order, created_at, updated_at, is_active, created_by) VALUES (?, '/images/kolli_spices_hero.jpg', ?, 1, 0, NOW(), NOW(), 1, ?)",
          [prod.id, prod.name, adminId]
        );
      }
    }
    console.log("   ✓ Product images verified for " + products.length + " products");

    const categories = await conn.query("SELECT id, name FROM product_categories WHERE deleted_at IS NULL");
    for (const cat of categories) {
      const existingCatImg = await conn.query("SELECT id FROM product_category_images WHERE category_id = ?", [cat.id]);
      if (existingCatImg.length === 0) {
        await conn.query(
          "INSERT INTO product_category_images (uuid, category_id, image_url, alt_text, sort_order, created_at, updated_at, status, is_active, created_by) VALUES (UUID(), ?, '/images/kolli_spices_hero.jpg', ?, 0, NOW(), NOW(), 1, 1, ?)",
          [cat.id, cat.name, adminId]
        );
      }
    }
    console.log("   ✓ Category images verified for " + categories.length + " categories");

    // 5. Seed Delivery Partners & Delivery Slots
    console.log("\n4. Seeding Delivery Partners & Slots...");
    const partners = [
      { name: "Delhivery Logistics", code: "DELHIVERY", phone: "+91 1800 102 3456" },
      { name: "ST Courier (South Express)", code: "ST_COURIER", phone: "+91 44 2233 4455" },
      { name: "India Post Speed Post", code: "INDIA_POST", phone: "+91 1800 266 6868" },
      { name: "DTDC Express", code: "DTDC", phone: "+91 80 2536 5555" },
    ];
    for (const p of partners) {
      const ex = await conn.query("SELECT id FROM delivery_partners WHERE code = ?", [p.code]);
      if (ex.length === 0) {
        await conn.query(
          "INSERT INTO delivery_partners (name, code, contact_number, is_active, created_at, updated_at, created_by) VALUES (?, ?, ?, 1, NOW(), NOW(), ?)",
          [p.name, p.code, p.phone, adminId]
        );
      }
    }
    console.log("   ✓ 4 Delivery partners verified");

    // Delivery slots
    const today = new Date();
    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      const slotDate = new Date(today);
      slotDate.setDate(today.getDate() + dayOffset);
      const dateStr = slotDate.toISOString().slice(0, 10);
      const exSlot = await conn.query("SELECT id FROM delivery_slots WHERE slot_date = ?", [dateStr]);
      if (exSlot.length === 0) {
        // Morning Slot
        await conn.query(
          "INSERT INTO delivery_slots (uuid, slot_date, start_time, end_time, max_orders, booked_orders, is_active, created_at, updated_at, created_by) VALUES (UUID(), ?, '09:00:00', '13:00:00', 30, 0, 1, NOW(), NOW(), ?)",
          [dateStr, adminId]
        );
        // Evening Slot
        await conn.query(
          "INSERT INTO delivery_slots (uuid, slot_date, start_time, end_time, max_orders, booked_orders, is_active, created_at, updated_at, created_by) VALUES (UUID(), ?, '14:00:00', '18:00:00', 30, 0, 1, NOW(), NOW(), ?)",
          [dateStr, adminId]
        );
      }
    }
    console.log("   ✓ Delivery slots generated for next 5 days");

    // 6. Seed Coupons
    console.log("\n5. Seeding Real Promotional Coupons...");
    const couponsData = [
      { code: "KOLLI10", type: "percentage", value: 10.0, min: 499.0, max: 150.0, limit: 1000 },
      { code: "WELCOME50", type: "flat", value: 50.0, min: 299.0, max: 50.0, limit: 500 },
      { code: "ORGANIC100", type: "flat", value: 100.0, min: 999.0, max: 100.0, limit: 300 },
      { code: "HERITAGE15", type: "percentage", value: 15.0, min: 799.0, max: 200.0, limit: 250 },
    ];
    for (const c of couponsData) {
      const ex = await conn.query("SELECT id FROM coupons WHERE code = ?", [c.code]);
      if (ex.length === 0) {
        await conn.query(
          "INSERT INTO coupons (uuid, code, type, value, min_order_amount, max_discount_amount, usage_limit, usage_limit_per_user, is_active, created_at, updated_at, created_by) VALUES (UUID(), ?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW(), ?)",
          [c.code, c.type, c.value, c.min, c.max, c.limit, adminId]
        );
      }
    }
    const allCoupons = await conn.query("SELECT id, code, type, value, min_order_amount, max_discount_amount FROM coupons");
    console.log("   ✓ Coupons verified (" + allCoupons.length + " active coupons)");

    // 7. Seed Real Customer Users & Profiles
    console.log("\n6. Seeding Authentic Customers...");
    const customerPasswordHash = await bcrypt.hash("customer123", 10);
    const CUSTOMER_LIST = [
      { name: "Senthil Kumar", email: "senthil.kumar@gmail.com", phone: "+919840123456", gender: "male", city: "Chennai", pincode: "600028", address: "42/3, RK Salai, Mylapore" },
      { name: "Meenakshi Sundaram", email: "meenakshi.s@gmail.com", phone: "+919840234567", gender: "female", city: "Madurai", pincode: "625001", address: "15, West Veli Street" },
      { name: "Karthik Rajan", email: "karthik.rajan@outlook.com", phone: "+919840345678", gender: "male", city: "Coimbatore", pincode: "641001", address: "78, Crosscut Road, Gandhipuram" },
      { name: "Priya Natarajan", email: "priya.natarajan@yahoo.com", phone: "+919840456789", gender: "female", city: "Salem", pincode: "636001", address: "12A, Meyyanur Main Road" },
      { name: "Vigneshwaran S", email: "vignesh.s@gmail.com", phone: "+919840567890", gender: "male", city: "Namakkal", pincode: "637001", address: "24, Mohanur Road" },
      { name: "Ananya Sharma", email: "ananya.sharma@gmail.com", phone: "+919840678901", gender: "female", city: "Bengaluru", pincode: "560001", address: "55, 100ft Road, Indiranagar" },
      { name: "Rajesh Kannan", email: "rajesh.kannan@rediffmail.com", phone: "+919840789012", gender: "male", city: "Tiruchirappalli", pincode: "620001", address: "33, Salai Road, Thillai Nagar" },
      { name: "Deepa Lakshmi", email: "deepa.lakshmi@gmail.com", phone: "+919840890123", gender: "female", city: "Erode", pincode: "638001", address: "89, Brough Road" },
      { name: "Suresh Babu", email: "suresh.babu@gmail.com", phone: "+919840901234", gender: "male", city: "Vellore", pincode: "632001", address: "10, Katpadi Road" },
      { name: "Divya Bharathi", email: "divya.bharathi@gmail.com", phone: "+919841012345", gender: "female", city: "Thanjavur", pincode: "613001", address: "4/1, South Rampart" },
    ];

    const customerUserIds = [];
    for (const cust of CUSTOMER_LIST) {
      let user = await conn.query("SELECT id FROM users WHERE email = ?", [cust.email]);
      let uId;
      if (user.length === 0) {
        const uRes = await conn.query(
          "INSERT INTO users (uuid, name, email, phone, password_hash, role_id, status, email_verified_at, phone_verified_at, created_at, updated_at) VALUES (UUID(), ?, ?, ?, ?, ?, 'active', NOW(), NOW(), NOW(), NOW())",
          [cust.name, cust.email, cust.phone, customerPasswordHash, customerRole.id]
        );
        uId = uRes.insertId;
      } else {
        uId = user[0].id;
        await conn.query("UPDATE users SET phone = ?, status = 'active' WHERE id = ?", [cust.phone, uId]);
      }
      customerUserIds.push({ id: uId, ...cust });

      // Profile
      const prof = await conn.query("SELECT id FROM customer_profiles WHERE user_id = ?", [uId]);
      if (prof.length === 0) {
        const refCode = "REF" + crypto.randomBytes(4).toString("hex").toUpperCase();
        await conn.query(
          "INSERT INTO customer_profiles (uuid, user_id, name, email, phone, gender, referral_code, is_active, status, created_at, updated_at) VALUES (UUID(), ?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())",
          [uId, cust.name, cust.email, cust.phone, cust.gender, refCode]
        );
      }

      // Address
      const addr = await conn.query("SELECT id FROM customer_addresses WHERE user_id = ?", [uId]);
      if (addr.length === 0) {
        await conn.query(
          "INSERT INTO customer_addresses (uuid, user_id, label, address_type, full_name, phone, address_line1, city, state, pincode, country, is_default, status, is_active, created_at, updated_at) VALUES (UUID(), ?, 'Home', 'shipping', ?, ?, ?, ?, 'Tamil Nadu', ?, 'India', 1, 1, 1, NOW(), NOW())",
          [uId, cust.name, cust.phone, cust.address, cust.city, cust.pincode]
        );
      }

      // Wallet
      const wal = await conn.query("SELECT id FROM wallets WHERE user_id = ?", [uId]);
      if (wal.length === 0) {
        const initialBal = (Math.floor(Math.random() * 5) + 1) * 50; // 50, 100, 150...
        await conn.query(
          "INSERT INTO wallets (user_id, balance, created_at, updated_at, is_active) VALUES (?, ?, NOW(), NOW(), 1)",
          [uId, initialBal]
        );
      }
    }
    console.log("   ✓ Verified " + customerUserIds.length + " real customer accounts with profiles, addresses, and wallets");

    // 8. Seed Complete Inventory across ALL 48 Variant Unit Prices
    console.log("\n7. Seeding Complete Inventory for ALL Variant Unit Prices...");
    const vups = await conn.query(`
      SELECT vup.id, vup.sku, vup.base_price, vup.unit_value, pv.id as variant_id, pv.variant_name, p.id as product_id, p.name as product_name
      FROM variant_unit_prices vup
      JOIN product_variants pv ON vup.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE p.deleted_at IS NULL AND vup.deleted_at IS NULL
      ORDER BY p.id, pv.id, vup.id
    `);

    console.log("   Found " + vups.length + " active variant unit price records.");
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let healthyCount = 0;

    for (let i = 0; i < vups.length; i++) {
      const vup = vups[i];
      let qty = 45;
      let reorder = 10;
      let wh = "Kolli Main Warehouse - Rack A" + ((i % 6) + 1);

      // Distribute realistic inventory variations:
      // 2 items Out of Stock (0 units)
      if (i === 12 || i === 28) {
        qty = 0;
        reorder = 10;
        outOfStockCount++;
      }
      // 6 items Low Stock (2-4 units with reorder_level 10)
      else if (i === 3 || i === 7 || i === 19 || i === 25 || i === 34 || i === 42) {
        qty = (i % 3) + 2; // 2, 3, or 4
        reorder = 10;
        lowStockCount++;
      }
      // Healthy stock (30 - 150)
      else {
        qty = 35 + ((i * 7) % 90);
        reorder = 8;
        healthyCount++;
      }

      const existingInv = await conn.query("SELECT id FROM inventories WHERE variant_unit_price_id = ?", [vup.id]);
      let invId;
      if (existingInv.length === 0) {
        const invRes = await conn.query(
          "INSERT INTO inventories (variant_unit_price_id, quantity_available, quantity_reserved, reorder_level, warehouse_location, is_active, created_at, updated_at, created_by) VALUES (?, ?, 0, ?, ?, 1, NOW(), NOW(), ?)",
          [vup.id, qty, reorder, wh, adminId]
        );
        invId = invRes.insertId;
      } else {
        invId = existingInv[0].id;
        await conn.query(
          "UPDATE inventories SET quantity_available = ?, reorder_level = ?, warehouse_location = ?, is_active = 1, updated_at = NOW() WHERE id = ?",
          [qty, reorder, wh, invId]
        );
      }

      // Add initial stock-in transaction if none exists
      const existingTx = await conn.query("SELECT id FROM inventory_transactions WHERE variant_unit_price_id = ?", [vup.id]);
      if (existingTx.length === 0) {
        await conn.query(
          "INSERT INTO inventory_transactions (variant_unit_price_id, type, quantity, reference_type, note, created_at, updated_at, is_active, created_by) VALUES (?, 'in', ?, 'INITIAL_BATCH', 'Initial seasonal harvest stock received from Semmedu farmer collective', NOW(), NOW(), 1, ?)",
          [vup.id, qty + 20, adminId]
        );
      }
    }
    console.log("   ✓ Inventory updated: " + healthyCount + " healthy, " + lowStockCount + " low stock, " + outOfStockCount + " out of stock");

    // 9. Seed Multi-Period Orders (Current Month, Today, Past 7 Days, and Previous Month)
    console.log("\n8. Seeding Realistic Multi-Period Orders...");

    // Clean any prior partial demo orders starting with ORD-20260
    await conn.query("DELETE FROM orders WHERE order_number LIKE 'ORD-202609%' OR order_number LIKE 'ORD-202608%'");

    const orderPlans = [
      // TODAY's Orders (Sept 25, 2026) - 2 orders
      {
        date: new Date(2026, 8, 25, 8, 30, 0),
        status: "processing",
        paymentStatus: "paid",
        customerIdx: 0,
        couponIdx: 0, // KOLLI10
        itemIndices: [0, 6], // Black Pepper, Honey
        quantities: [2, 1],
      },
      {
        date: new Date(2026, 8, 25, 10, 15, 0),
        status: "pending",
        paymentStatus: "pending",
        customerIdx: 1,
        couponIdx: null,
        itemIndices: [14, 20], // Cardamom, Mappillai Samba Rice
        quantities: [1, 2],
      },

      // PAST 7 DAYS (Sept 18 - Sept 24, 2026) - 8 orders
      {
        date: new Date(2026, 8, 24, 15, 20, 0),
        status: "packed",
        paymentStatus: "paid",
        customerIdx: 2,
        couponIdx: null,
        itemIndices: [6, 8], // Honey, Cloves
        quantities: [1, 1],
      },
      {
        date: new Date(2026, 8, 24, 11, 40, 0),
        status: "out_for_delivery",
        paymentStatus: "paid",
        customerIdx: 3,
        couponIdx: 1, // WELCOME50
        itemIndices: [2, 10], // Long Pepper, Turmeric
        quantities: [2, 1],
      },
      {
        date: new Date(2026, 8, 23, 16, 10, 0),
        status: "shipped",
        paymentStatus: "paid",
        customerIdx: 4,
        couponIdx: null,
        itemIndices: [20, 24], // Rice, Garam Masala
        quantities: [1, 2],
      },
      {
        date: new Date(2026, 8, 22, 14, 5, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 5,
        couponIdx: 2, // ORGANIC100
        itemIndices: [6, 14, 20], // Honey, Cardamom, Rice
        quantities: [2, 1, 1],
      },
      {
        date: new Date(2026, 8, 21, 17, 30, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 6,
        couponIdx: null,
        itemIndices: [0, 4], // Black pepper, Long pepper
        quantities: [1, 1],
      },
      {
        date: new Date(2026, 8, 20, 10, 0, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 7,
        couponIdx: null,
        itemIndices: [10, 12], // Turmeric, Dry Ginger
        quantities: [2, 2],
      },
      {
        date: new Date(2026, 8, 19, 13, 45, 0),
        status: "cancelled",
        paymentStatus: "failed",
        customerIdx: 8,
        couponIdx: null,
        itemIndices: [6], // Honey
        quantities: [1],
        notes: "Customer cancelled due to incorrect delivery address selection",
      },
      {
        date: new Date(2026, 8, 18, 18, 15, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 9,
        couponIdx: 3, // HERITAGE15
        itemIndices: [20, 22], // Mappillai samba, Kaikuthal rice
        quantities: [2, 2],
      },

      // EARLIER THIS MONTH (Sept 1 - Sept 17, 2026) - 18 orders
      {
        date: new Date(2026, 8, 17, 12, 10, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 0,
        couponIdx: null,
        itemIndices: [0, 6, 24],
        quantities: [1, 1, 1],
      },
      {
        date: new Date(2026, 8, 16, 15, 40, 0),
        status: "returned",
        paymentStatus: "refunded",
        customerIdx: 1,
        couponIdx: null,
        itemIndices: [14], // Cardamom
        quantities: [1],
        notes: "Customer requested return due to order duplication. Full refund processed.",
      },
      {
        date: new Date(2026, 8, 15, 11, 25, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 2,
        couponIdx: 0,
        itemIndices: [6, 20],
        quantities: [1, 2],
      },
      {
        date: new Date(2026, 8, 14, 16, 50, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 3,
        couponIdx: null,
        itemIndices: [10, 26],
        quantities: [3, 2],
      },
      {
        date: new Date(2026, 8, 13, 9, 15, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 4,
        couponIdx: 1,
        itemIndices: [0, 8],
        quantities: [2, 1],
      },
      {
        date: new Date(2026, 8, 12, 14, 30, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 5,
        couponIdx: null,
        itemIndices: [20, 22],
        quantities: [1, 1],
      },
      {
        date: new Date(2026, 8, 11, 17, 20, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 6,
        couponIdx: 2,
        itemIndices: [6, 14],
        quantities: [2, 1],
      },
      {
        date: new Date(2026, 8, 10, 10, 45, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 7,
        couponIdx: null,
        itemIndices: [2, 16],
        quantities: [1, 1],
      },
      {
        date: new Date(2026, 8, 9, 13, 10, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 8,
        couponIdx: null,
        itemIndices: [0, 6],
        quantities: [2, 1],
      },
      {
        date: new Date(2026, 8, 8, 16, 25, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 9,
        couponIdx: 3,
        itemIndices: [20, 24],
        quantities: [2, 2],
      },
      {
        date: new Date(2026, 8, 7, 11, 5, 0),
        status: "confirmed",
        paymentStatus: "paid",
        customerIdx: 0,
        couponIdx: null,
        itemIndices: [6, 10],
        quantities: [1, 1],
      },
      {
        date: new Date(2026, 8, 6, 15, 35, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 1,
        couponIdx: 0,
        itemIndices: [14, 20],
        quantities: [1, 1],
      },
      {
        date: new Date(2026, 8, 5, 12, 50, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 2,
        couponIdx: null,
        itemIndices: [0, 2, 4],
        quantities: [1, 1, 1],
      },
      {
        date: new Date(2026, 8, 4, 9, 40, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 3,
        couponIdx: 1,
        itemIndices: [6],
        quantities: [2],
      },
      {
        date: new Date(2026, 8, 3, 14, 15, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 4,
        couponIdx: null,
        itemIndices: [20, 22],
        quantities: [1, 1],
      },
      {
        date: new Date(2026, 8, 2, 17, 0, 0),
        status: "cancelled",
        paymentStatus: "failed",
        customerIdx: 5,
        couponIdx: null,
        itemIndices: [14],
        quantities: [1],
        notes: "Payment failed at gateway and timed out",
      },
      {
        date: new Date(2026, 8, 1, 11, 30, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 6,
        couponIdx: 2,
        itemIndices: [0, 6, 20],
        quantities: [1, 1, 1],
      },
      {
        date: new Date(2026, 8, 1, 16, 45, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 7,
        couponIdx: null,
        itemIndices: [10, 24],
        quantities: [2, 1],
      },

      // PREVIOUS MONTH (August 2026) - 8 orders for month-over-month trend analytics
      {
        date: new Date(2026, 7, 28, 14, 0, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 0,
        couponIdx: null,
        itemIndices: [6, 20],
        quantities: [1, 1],
      },
      {
        date: new Date(2026, 7, 24, 11, 20, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 1,
        couponIdx: 0,
        itemIndices: [0, 14],
        quantities: [2, 1],
      },
      {
        date: new Date(2026, 7, 20, 16, 30, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 2,
        couponIdx: null,
        itemIndices: [20, 22],
        quantities: [1, 2],
      },
      {
        date: new Date(2026, 7, 16, 10, 15, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 3,
        couponIdx: 1,
        itemIndices: [6, 10],
        quantities: [1, 2],
      },
      {
        date: new Date(2026, 7, 12, 13, 50, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 4,
        couponIdx: null,
        itemIndices: [0, 6],
        quantities: [1, 1],
      },
      {
        date: new Date(2026, 7, 9, 15, 10, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 5,
        couponIdx: 2,
        itemIndices: [20],
        quantities: [3],
      },
      {
        date: new Date(2026, 7, 5, 11, 40, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 6,
        couponIdx: null,
        itemIndices: [14, 24],
        quantities: [1, 2],
      },
      {
        date: new Date(2026, 7, 2, 17, 25, 0),
        status: "delivered",
        paymentStatus: "paid",
        customerIdx: 7,
        couponIdx: null,
        itemIndices: [0, 2, 10],
        quantities: [1, 1, 1],
      },
    ];

    let orderSeq = 100;
    for (const plan of orderPlans) {
      orderSeq++;
      const cust = customerUserIds[plan.customerIdx % customerUserIds.length];
      const orderDate = plan.date;
      const dateStr = orderDate.toISOString().slice(0, 10).replace(/-/g, "");
      const orderNumber = "ORD-" + dateStr + "-K" + String(orderSeq).padStart(4, "0");

      // Calculate items and subtotal
      let subtotal = 0;
      const orderItemsToInsert = [];

      for (let j = 0; j < plan.itemIndices.length; j++) {
        const vupIdx = plan.itemIndices[j] % vups.length;
        const vup = vups[vupIdx];
        const qty = plan.quantities[j] || 1;
        const price = Number(vup.base_price);
        const itemTotal = price * qty;
        subtotal += itemTotal;

        orderItemsToInsert.push({
          productId: vup.product_id,
          variantId: vup.variant_id,
          variantUnitPriceId: vup.id,
          productName: vup.product_name,
          variantName: vup.variant_name,
          sku: vup.sku,
          quantity: qty,
          unitPrice: price,
          totalPrice: itemTotal,
        });
      }

      // Discount calculation
      let discountAmount = 0;
      let couponId = null;
      if (plan.couponIdx !== null && allCoupons[plan.couponIdx]) {
        const c = allCoupons[plan.couponIdx];
        if (subtotal >= Number(c.min_order_amount)) {
          couponId = c.id;
          if (c.type === "percentage") {
            discountAmount = Math.min(
              (subtotal * Number(c.value)) / 100,
              Number(c.max_discount_amount)
            );
          } else {
            discountAmount = Math.min(Number(c.value), subtotal);
          }
        }
      }
      discountAmount = Math.round(discountAmount * 100) / 100;

      // Shipping charge
      const shippingCharge = subtotal >= 500 ? 0.0 : 49.0;
      const taxAmount = 0.0;
      const totalAmount = Math.max(0, subtotal - discountAmount + shippingCharge + taxAmount);

      // Insert Order
      const orderResult = await conn.query(
        `INSERT INTO orders (
          uuid, order_number, user_id, coupon_id, order_status, payment_status,
          subtotal, discount_amount, tax_amount, shipping_charge, total_amount,
          notes, placed_at, created_at, updated_at, is_active, created_by, updated_by
        ) VALUES (
          UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?
        )`,
        [
          orderNumber,
          cust.id,
          couponId,
          plan.status,
          plan.paymentStatus,
          subtotal.toFixed(2),
          discountAmount.toFixed(2),
          taxAmount.toFixed(2),
          shippingCharge.toFixed(2),
          totalAmount.toFixed(2),
          plan.notes || null,
          orderDate,
          orderDate,
          orderDate,
          cust.id,
          cust.id,
        ]
      );

      const orderId = orderResult.insertId;

      // Insert Order Items
      for (const item of orderItemsToInsert) {
        await conn.query(
          `INSERT INTO order_items (
            uuid, order_id, product_id, variant_id, variant_unit_price_id,
            product_name_snapshot, variant_snapshot, sku_snapshot,
            quantity, unit_price, discount_amount, tax_amount, total_price,
            created_at, updated_at, is_active, created_by, updated_by
          ) VALUES (
            UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, 0.00, ?, ?, ?, 1, ?, ?
          )`,
          [
            orderId,
            item.productId,
            item.variantId,
            item.variantUnitPriceId,
            item.productName,
            item.variantName,
            item.sku,
            item.quantity,
            item.unitPrice.toFixed(2),
            item.totalPrice.toFixed(2),
            orderDate,
            orderDate,
            cust.id,
            cust.id,
          ]
        );
      }

      // Insert Shipping and Billing Addresses
      await conn.query(
        `INSERT INTO order_addresses (
          uuid, order_id, type, full_name, phone, address_line1,
          city, state, pincode, country, created_at, updated_at, is_active, created_by, updated_by
        ) VALUES (
          UUID(), ?, 'shipping', ?, ?, ?, ?, 'Tamil Nadu', ?, 'India', ?, ?, 1, ?, ?
        )`,
        [orderId, cust.name, cust.phone, cust.address, cust.city, cust.pincode, orderDate, orderDate, cust.id, cust.id]
      );
      await conn.query(
        `INSERT INTO order_addresses (
          uuid, order_id, type, full_name, phone, address_line1,
          city, state, pincode, country, created_at, updated_at, is_active, created_by, updated_by
        ) VALUES (
          UUID(), ?, 'billing', ?, ?, ?, ?, 'Tamil Nadu', ?, 'India', ?, ?, 1, ?, ?
        )`,
        [orderId, cust.name, cust.phone, cust.address, cust.city, cust.pincode, orderDate, orderDate, cust.id, cust.id]
      );

      // Insert Payment
      const isCod = plan.paymentStatus === "pending" && plan.status === "pending";
      const pmId = isCod ? codPm.id : razorpayPm.id;
      const payStatus = plan.paymentStatus === "paid" ? "success" : plan.paymentStatus === "refunded" ? "refunded" : "pending";
      const payGateway = isCod ? "COD" : "RAZORPAY";
      const payOrderId = "order_" + crypto.randomBytes(7).toString("hex");
      const payPaymentId = payStatus === "success" || payStatus === "refunded" ? "pay_" + crypto.randomBytes(7).toString("hex") : null;

      const payRes = await conn.query(
        `INSERT INTO payments (
          order_id, payment_method_id, amount, currency, status, gateway, gateway_order_id, gateway_payment_id,
          created_at, updated_at, is_active, created_by, updated_by
        ) VALUES (
          ?, ?, ?, 'INR', ?, ?, ?, ?, ?, ?, 1, ?, ?
        )`,
        [orderId, pmId, totalAmount.toFixed(2), payStatus, payGateway, payOrderId, payPaymentId, orderDate, orderDate, cust.id, cust.id]
      );
      const paymentId = payRes.insertId;

      // Payment transaction
      await conn.query(
        `INSERT INTO payment_transactions (
          payment_id, transaction_type, amount, status, created_at, updated_at, is_active, created_by
        ) VALUES (?, 'charge', ?, ?, ?, ?, 1, ?)`,
        [paymentId, totalAmount.toFixed(2), payStatus, orderDate, orderDate, cust.id]
      );

      // If returned, insert refund record
      if (plan.status === "returned") {
        await conn.query(
          `INSERT INTO refunds (
            payment_id, order_id, amount, reason, status, processed_at, created_at, updated_at, is_active, created_by
          ) VALUES (?, ?, ?, 'Order returned by customer; quality verified; refunded to original source', 'completed', ?, ?, ?, 1, ?)`,
          [paymentId, orderId, totalAmount.toFixed(2), orderDate, orderDate, orderDate, adminId]
        );
      }

      // Order status history timeline
      const statusTransitions = [];
      statusTransitions.push({ status: "pending", note: "Order placed by customer", time: orderDate });
      if (["confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "returned"].includes(plan.status)) {
        statusTransitions.push({ status: "confirmed", note: "Payment verified and order confirmed", time: new Date(orderDate.getTime() + 15 * 60 * 1000) });
      }
      if (["processing", "packed", "shipped", "out_for_delivery", "delivered", "returned"].includes(plan.status)) {
        statusTransitions.push({ status: "processing", note: "Order sent to warehouse packing bay", time: new Date(orderDate.getTime() + 45 * 60 * 1000) });
      }
      if (["packed", "shipped", "out_for_delivery", "delivered", "returned"].includes(plan.status)) {
        statusTransitions.push({ status: "packed", note: "Items packed securely with tamper-proof packaging", time: new Date(orderDate.getTime() + 90 * 60 * 1000) });
      }
      if (["shipped", "out_for_delivery", "delivered", "returned"].includes(plan.status)) {
        statusTransitions.push({ status: "shipped", note: "Handed over to DTDC Express courier. AWB #KA" + orderSeq + "IN", time: new Date(orderDate.getTime() + 180 * 60 * 1000) });
      }
      if (["out_for_delivery", "delivered", "returned"].includes(plan.status)) {
        statusTransitions.push({ status: "out_for_delivery", note: "Courier executive out for final mile delivery", time: new Date(orderDate.getTime() + 360 * 60 * 1000) });
      }
      if (plan.status === "delivered" || plan.status === "returned") {
        statusTransitions.push({ status: "delivered", note: "Successfully delivered to recipient", time: new Date(orderDate.getTime() + 480 * 60 * 1000) });
      }
      if (plan.status === "returned") {
        statusTransitions.push({ status: "returned", note: "Customer return request verified and accepted", time: new Date(orderDate.getTime() + 1440 * 60 * 1000) });
      }
      if (plan.status === "cancelled") {
        statusTransitions.push({ status: "cancelled", note: plan.notes || "Order cancelled", time: new Date(orderDate.getTime() + 20 * 60 * 1000) });
      }

      for (const st of statusTransitions) {
        await conn.query(
          `INSERT INTO order_status_history (
            order_id, status, note, changed_by, created_at, updated_at, is_active, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
          [orderId, st.status, st.note, adminId, st.time, st.time, adminId]
        );
      }
    }
    console.log("   ✓ Successfully seeded " + orderPlans.length + " orders across today, past 7 days, this month, and last month!");

    // 10. Seed Customer Reviews
    console.log("\n9. Seeding Authentic Product Reviews...");
    const reviewsData = [
      {
        prodIdx: 0,
        rating: 5,
        title: "Pungent, authentic and aromatic!",
        comment: "The whole black pepper from Kolli Hills has an aroma that regular market pepper completely lacks. Excellent heat and freshness!",
        approved: 1,
      },
      {
        prodIdx: 6,
        rating: 5,
        title: "Pure Raw Forest Honey!",
        comment: "You can taste the wild floral nectar in this honey. Thick texture and natural crystallization. My family takes it daily with warm water.",
        approved: 1,
      },
      {
        prodIdx: 2,
        rating: 5,
        title: "High quality cardamom pods",
        comment: "Very fragrant cardamom pods, full of seeds. Adds amazing aroma to morning chai and payasam.",
        approved: 1,
      },
      {
        prodIdx: 8,
        rating: 5,
        title: "Real traditional Mappillai Samba rice",
        comment: "Rich in fiber and iron. Traditional taste after cooking. Highly recommended for diabetes management and overall stamina.",
        approved: 1,
      },
      {
        prodIdx: 4,
        rating: 4,
        title: "High Curcumin Turmeric",
        comment: "Bright natural golden yellow color and earthiness. Definitely organic without artificial polishing.",
        approved: 1,
      },
      {
        prodIdx: 10,
        rating: 5,
        title: "Authentic Kolli Garam Masala",
        comment: "Freshly roasted spice aroma. You only need a pinch to bring curries to life.",
        approved: 1,
      },
      {
        prodIdx: 11,
        rating: 4,
        title: "Authentic rasam powder",
        comment: "Tastes like traditional grandmother's recipe. Great pepper-cumin balance.",
        approved: 1,
      },
      {
        prodIdx: 1,
        rating: 4,
        title: "Great for cough and cold (Thippili)",
        comment: "Long pepper is very effective when boiled with milk for seasonal colds. Authentic Kolli Hills produce.",
        approved: 1,
      },
      {
        prodIdx: 9,
        rating: 5,
        title: "Wholesome Kaikuthal hand-pounded rice",
        comment: "Unpolished, healthy, and easy to digest. Very pleased with the packaging.",
        approved: 1,
      },
      {
        prodIdx: 7,
        rating: 4,
        title: "Sweet woody cinnamon",
        comment: "True Ceylon/Kolli style cinnamon quills, delicate and sweet fragrance unlike cassia.",
        approved: 0, // Pending review for admin to approve!
      },
      {
        prodIdx: 5,
        rating: 3,
        title: "Good sukku powder",
        comment: "A little fine ground for my liking, but flavor is strong and pungent.",
        approved: 0, // Pending review for admin to approve!
      },
    ];

    for (let r = 0; r < reviewsData.length; r++) {
      const rev = reviewsData[r];
      const prod = products[rev.prodIdx % products.length];
      const cust = customerUserIds[r % customerUserIds.length];
      const exRev = await conn.query("SELECT id FROM reviews WHERE product_id = ? AND user_id = ?", [prod.id, cust.id]);
      if (exRev.length === 0) {
        await conn.query(
          `INSERT INTO reviews (
            uuid, product_id, user_id, rating, title, comment, is_approved, is_active, created_at, updated_at, created_by
          ) VALUES (
            UUID(), ?, ?, ?, ?, ?, ?, 1, NOW(), NOW(), ?
          )`,
          [prod.id, cust.id, rev.rating, rev.title, rev.comment, rev.approved, cust.id]
        );
      }
    }
    console.log("   ✓ Verified " + reviewsData.length + " customer reviews (including pending approvals for testing)");

    // 11. Seed Banners
    console.log("\n10. Seeding Marketing Banners...");
    const bannerPositions = await conn.query("SELECT id, slug FROM banner_positions");
    const heroPos = bannerPositions.find((bp) => bp.slug === "home-hero") || bannerPositions[0];
    const offerPos = bannerPositions.find((bp) => bp.slug === "home-offer") || bannerPositions[0];
    const popupPos = bannerPositions.find((bp) => bp.slug === "home-popup-offer") || bannerPositions[0];

    const bannersToSeed = [
      {
        posId: heroPos.id,
        title: "Pure High-Altitude Spices & Raw Honey from Kolli Hills",
        image: "/images/kolli_spices_hero.jpg",
        link: "/products",
        order: 1,
      },
      {
        posId: offerPos.id,
        title: "Festival Heritage Special - Flat 15% Off on Native Rice & Spices",
        image: "/images/kolli_spices_story.jpg",
        link: "/products?category=native-rice-varieties",
        order: 2,
      },
      {
        posId: popupPos.id,
        title: "First Order Gift: Use Code WELCOME50 for Flat ₹50 OFF",
        image: "/images/kolli_spices_founder.jpg",
        link: "/products",
        order: 3,
      },
    ];

    for (const b of bannersToSeed) {
      const ex = await conn.query("SELECT id FROM banners WHERE title = ?", [b.title]);
      if (ex.length === 0) {
        await conn.query(
          `INSERT INTO banners (
            uuid, banner_position_id, title, image_url, link_url, media_type, sort_order, is_active, created_at, updated_at, created_by
          ) VALUES (
            UUID(), ?, ?, ?, ?, 'image', ?, 1, NOW(), NOW(), ?
          )`,
          [b.posId, b.title, b.image, b.link, b.order, adminId]
        );
      }
    }
    console.log("   ✓ Marketing banners verified");

    // 12. Seed Bulk Order Enquiries
    console.log("\n11. Seeding Bulk Order Enquiries...");
    const bulkEnquiries = [
      {
        name: "Arunachalam S",
        email: "arun.organics@gmail.com",
        phone: "+91 98412 87654",
        company: "Nature's Basket Organic Store, Bengaluru",
        interest: "Kolli Hills Wild Forest Honey & Black Pepper",
        qty: 50,
        message: "Looking for wholesale supply of 50kg wild forest honey in 500g glass jars and 25kg black pepper whole on monthly contract basis.",
        status: "new",
      },
      {
        name: "Sundararaman G",
        email: "sundar.catering@yahoo.com",
        phone: "+91 94432 12345",
        company: "Kaveri Grand Traditional Caterers, Chennai",
        interest: "Mappillai Samba Rice & Kaikuthal Rice",
        qty: 200,
        message: "Requirement for 200kg Mappillai Samba raw rice and 100kg Kaikuthal rice for upcoming traditional wedding banquet in November.",
        status: "contacted",
      },
      {
        name: "Dr. K. Jayaraman",
        email: "jayaraman.ayur@gmail.com",
        phone: "+91 97890 54321",
        company: "Siddha & Herbal Wellness Foundation, Madurai",
        interest: "Long Pepper (Thippili) & Sukku",
        qty: 75,
        message: "Need bulk dried Thippili and Dry Ginger with high alkaloid content for herbal formulation manufacturing.",
        status: "closed",
      },
    ];

    for (const be of bulkEnquiries) {
      const ex = await conn.query("SELECT id FROM bulk_order_enquiries WHERE email = ? AND company_name = ?", [be.email, be.company]);
      if (ex.length === 0) {
        await conn.query(
          `INSERT INTO bulk_order_enquiries (
            uuid, name, email, phone, company_name, product_interest, quantity, message, status, created_at, updated_at, is_active, created_by
          ) VALUES (
            UUID(), ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 1, ?
          )`,
          [be.name, be.email, be.phone, be.company, be.interest, be.qty, be.message, be.status, adminId]
        );
      }
    }
    console.log("   ✓ Bulk order enquiries verified (new, contacted, closed)");

    // 13. Seed Blogs & Categories
    console.log("\n12. Seeding Heritage Blogs & Articles...");
    const blogCats = [
      { name: "Kolli Hills Heritage", slug: "kolli-hills-heritage" },
      { name: "Health & Nutrition", slug: "health-nutrition" },
      { name: "Traditional Farming", slug: "traditional-farming" },
    ];
    const catIdMap = {};
    for (const bc of blogCats) {
      let ex = await conn.query("SELECT id FROM blog_categories WHERE slug = ?", [bc.slug]);
      if (ex.length === 0) {
        const r = await conn.query(
          "INSERT INTO blog_categories (uuid, name, slug, created_at, updated_at, is_active, created_by) VALUES (UUID(), ?, ?, NOW(), NOW(), 1, ?)",
          [bc.name, bc.slug, adminId]
        );
        catIdMap[bc.slug] = r.insertId;
      } else {
        catIdMap[bc.slug] = ex[0].id;
      }
    }

    const blogs = [
      {
        catSlug: "kolli-hills-heritage",
        title: "Why High-Altitude Kolli Hills Spices Possess Exceptional Potency",
        slug: "why-kolli-hills-spices-possess-exceptional-potency",
        image: "/images/kolli_spices_story.jpg",
        content: "<p>Perched between 1,000 to 1,300 meters above sea level in the Eastern Ghats of Tamil Nadu, the Kolli Hills (Kollimalai) are renowned for pristine red soil, cool mist, and untouched medicinal biodiversity. The black pepper, cardamom, and wild honey harvested by tribal families here contain elevated essential oil percentages and bioactive curcuminoid contents rarely found in commercial lowland cultivars.</p>",
      },
      {
        catSlug: "health-nutrition",
        title: "Rediscovering Mappillai Samba: The Ancient Rice of Vitality & Strength",
        slug: "rediscovering-mappillai-samba-ancient-rice",
        image: "/images/kolli_spices_hero.jpg",
        content: "<p>Mappillai Samba ('Bridegroom Rice') is an indigenous Tamil rice variety historically given to newlywed grooms for sustained physical stamina and vitality. Rich in dietary fiber, low glycemic index carbohydrates, and zinc, this ancient grain helps regulate blood glucose while providing wholesome nutritional nourishment.</p>",
      },
      {
        catSlug: "traditional-farming",
        title: "Tribal Wild Honey Harvesting in the Virgin Forests of Kolli Hills",
        slug: "tribal-wild-honey-harvesting-kolli-hills",
        image: "/images/kolli_spices_founder.jpg",
        content: "<p>Unlike commercial apiary bee farming where sugar syrups are fed to bees, Kollimalai wild honey is gathered from natural cliff rocks and tall forest canopies by indigenous Malayali tribal clans. It carries the therapeutic essence of hundreds of wild medicinal forest flowers and herbs.</p>",
      },
    ];

    for (const b of blogs) {
      const ex = await conn.query("SELECT id FROM blogs WHERE slug = ?", [b.slug]);
      if (ex.length === 0) {
        const cId = catIdMap[b.catSlug];
        await conn.query(
          `INSERT INTO blogs (
            uuid, blog_category_id, title, slug, content, featured_image, author_id, is_published, published_at, created_at, updated_at, is_active, created_by
          ) VALUES (
            UUID(), ?, ?, ?, ?, ?, ?, 1, NOW(), NOW(), NOW(), 1, ?
          )`,
          [cId, b.title, b.slug, b.content, b.image, adminId, adminId]
        );
      }
    }
    console.log("   ✓ Blogs and blog categories verified");

    // 14. Seed Store Settings
    console.log("\n13. Ensuring Store Settings in settings table...");
    const defaultSettings = [
      { key: "site_name", value: "Kollimalai Arasan - Traditional Organic Foods", type: "string" },
      { key: "support_email", value: "support@kollimalaiarasan.com", type: "string" },
      { key: "support_phone", value: "+91 74181 88950", type: "string" },
      { key: "free_shipping_threshold", value: "500", type: "number" },
      { key: "standard_shipping_charge", value: "49", type: "number" },
      { key: "currency_symbol", value: "₹", type: "string" },
      { key: "currency_code", value: "INR", type: "string" },
      { key: "enable_cod", value: "true", type: "boolean" },
      { key: "enable_online_payment", value: "true", type: "boolean" },
      { key: "address", value: "18/41, MGR Nagar, Semmedu Post, Kolli Hills, Namakkal District, Tamil Nadu 637411", type: "string" },
    ];
    for (const s of defaultSettings) {
      const ex = await conn.query("SELECT id FROM settings WHERE key_name = ?", [s.key]);
      if (ex.length === 0) {
        await conn.query(
          "INSERT INTO settings (key_name, value, type, created_at, updated_at, is_active, created_by) VALUES (?, ?, ?, NOW(), NOW(), 1, ?)",
          [s.key, s.value, s.type, adminId]
        );
      }
    }
    console.log("   ✓ Store settings verified");

    await conn.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("\n============================================================");
    console.log("🎉 SEEDING COMPLETED SUCCESSFULLY!");
    console.log("============================================================");

    // Final Counts
    const counts = await Promise.all([
      conn.query("SELECT COUNT(*) as cnt FROM users WHERE role_id = (SELECT id FROM roles WHERE name='CUSTOMER')"),
      conn.query("SELECT COUNT(*) as cnt FROM products WHERE deleted_at IS NULL"),
      conn.query("SELECT COUNT(*) as cnt FROM inventories WHERE is_active = 1"),
      conn.query("SELECT COUNT(*) as cnt FROM inventories WHERE is_active = 1 AND quantity_available <= reorder_level"),
      conn.query("SELECT COUNT(*) as cnt FROM orders"),
      conn.query("SELECT COUNT(*) as cnt FROM order_items"),
      conn.query("SELECT COUNT(*) as cnt FROM coupons"),
      conn.query("SELECT COUNT(*) as cnt FROM reviews"),
      conn.query("SELECT COUNT(*) as cnt FROM banners"),
      conn.query("SELECT COUNT(*) as cnt FROM bulk_order_enquiries"),
      conn.query("SELECT COUNT(*) as cnt FROM blogs"),
    ]);

    console.log("📊 Final Database Summary:");
    console.log("   - Customers          : " + counts[0][0].cnt);
    console.log("   - Active Products    : " + counts[1][0].cnt);
    console.log("   - Inventory Records  : " + counts[2][0].cnt + " (Total Variant Packs)");
    console.log("   - Low/Out of Stock   : " + counts[3][0].cnt + " (Alert triggers active)");
    console.log("   - Total Orders       : " + counts[4][0].cnt);
    console.log("   - Total Order Items  : " + counts[5][0].cnt);
    console.log("   - Active Coupons     : " + counts[6][0].cnt);
    console.log("   - Reviews            : " + counts[7][0].cnt);
    console.log("   - Banners            : " + counts[8][0].cnt);
    console.log("   - Bulk Enquiries     : " + counts[9][0].cnt);
    console.log("   - Blog Articles      : " + counts[10][0].cnt);
    console.log("============================================================\n");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("❌ Seeding Error:", err);
  process.exit(1);
});
