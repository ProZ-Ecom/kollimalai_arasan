const mariadb = require("mariadb");
require("dotenv").config();

async function resetForProduction() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const url = new URL(databaseUrl);
  const host = url.hostname === "localhost" ? "127.0.0.1" : url.hostname;
  const port = Number(url.port || 3306);
  const user = decodeURIComponent(url.username || "root");
  const password = decodeURIComponent(url.password || "");
  const database = url.pathname.slice(1) || "kollimalai";

  console.log(`\n======================================================`);
  console.log(`🚨 PRODUCTION CLEANUP & RESET`);
  console.log(`Connecting to: ${database} on ${host}:${port}`);
  console.log(`======================================================\n`);

  const conn = await mariadb.createConnection({
    host,
    port,
    user,
    password,
    database,
    allowPublicKeyRetrieval: true,
  });

  try {
    // 1. Disable Foreign Key checks
    await conn.query("SET FOREIGN_KEY_CHECKS = 0;");

    // 2. Define tables to wipe clean
    const TABLES_TO_TRUNCATE = [
      // Transactions, Orders & Invoices
      "order_status_history",
      "order_items",
      "order_addresses",
      "orders",
      "shipment_tracking",
      "shipments",
      "refunds",
      "return_items",
      "return_requests",
      "payment_transactions",
      "payments",
      "payment_gateway_webhooks",
      "payment_redirect_tokens",

      // Carts & Wishlists
      "cart_items",
      "carts",
      "wishlist_items",
      "recently_viewed_products",

      // Mock Catalog, Products, Variants
      "reviews",
      "review_images",
      "product_questions",
      "product_variant_images",
      "variant_unit_prices",
      "variant_price_history",
      "inventories",
      "inventory_transactions",
      "stock_adjustments",
      "combo_product_items",
      "combo_products",
      "offer_items",
      "offer_products",
      "offers",
      "product_variants",
      "product_images",
      "product_tag_maps",
      "product_tags",
      "product_attribute_values",
      "product_attributes",
      "attribute_values",
      "products",
      "product_category_images",
      "product_categories",

      // Logs, Test Enquiries & Marketing Mocks
      "bulk_order_enquiries",
      "contact_messages",
      "coupon_usage",
      "coupons",
      "audit_logs",
      "login_logs",
      "notification_logs",
      "notifications",
      "otp_verifications",
      "search_history",
      "sales_reports",
      "stock_reports",
      "customer_reports",
      "user_sessions",
      "wallet_transactions",
      "wallets",
      "reward_transactions",
      "reward_points",
      "whatsapp_campaign_recipients",
      "whatsapp_campaigns",
    ];

    console.log(`Clearing ${TABLES_TO_TRUNCATE.length} transactional and mock data tables...\n`);

    for (const table of TABLES_TO_TRUNCATE) {
      try {
        await conn.query(`TRUNCATE TABLE \`${table}\``);
        console.log(`  ✓ Cleared: ${table}`);
      } catch (err) {
        // Fallback to DELETE if TRUNCATE fails
        try {
          await conn.query(`DELETE FROM \`${table}\``);
          console.log(`  ✓ Cleared (via DELETE): ${table}`);
        } catch (innerErr) {
          console.warn(`  ⚠️ Skipped ${table}: ${innerErr.message}`);
        }
      }
    }

    // 3. Re-enable Foreign Key checks
    await conn.query("SET FOREIGN_KEY_CHECKS = 1;");

    console.log(`\n======================================================`);
    console.log(`✅ DATABASE SUCCESSFULLY PREPARED FOR PRODUCTION!`);
    console.log(`======================================================`);
    console.log(`PRESERVED ESSENTIAL DATA:`);
    console.log(`  ✓ Admin & User Credentials (users table)`);
    console.log(`  ✓ Roles & Permissions (roles, permissions, role_permissions)`);
    console.log(`  ✓ Company Settings & Address (companies table)`);
    console.log(`  ✓ Hero Banners & Positions (banners, banner_positions)`);
    console.log(`  ✓ Brand Identity (product_brands table)`);
    console.log(`  ✓ Measurement Units (product_units table)`);
    console.log(`  ✓ Tax/HSN Configuration (product_gst_rates, product_hsn_codes)`);
    console.log(`  ✓ Operational Settings (delivery_slots, payment_methods, etc.)`);
    console.log(`======================================================\n`);
  } catch (error) {
    console.error("❌ Reset Error:", error);
  } finally {
    await conn.end();
  }
}

resetForProduction().catch(console.error);
