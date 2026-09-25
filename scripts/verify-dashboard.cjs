const mariadb = require("mariadb");
require("dotenv").config();

async function check() {
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

  const orders = await conn.query(
    "SELECT order_status, COUNT(*) as count, SUM(total_amount) as total_amount FROM orders GROUP BY order_status"
  );
  console.log("\n📦 Order Status Breakdown:");
  console.table(
    orders.map((o) => ({
      Status: o.order_status,
      Count: Number(o.count),
      "Total Amount (₹)": Number(o.total_amount).toFixed(2),
    }))
  );

  const topProducts = await conn.query(`
    SELECT oi.product_name_snapshot, SUM(oi.quantity) as total_qty, SUM(oi.total_price) as total_rev
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.order_status NOT IN ('cancelled', 'returned')
    GROUP BY oi.product_name_snapshot
    ORDER BY total_qty DESC
    LIMIT 5
  `);
  console.log("\n🏆 Top Selling Products (Dashboard Widget):");
  console.table(
    topProducts.map((p) => ({
      Product: p.product_name_snapshot,
      "Units Sold": Number(p.total_qty),
      "Revenue (₹)": Number(p.total_rev).toFixed(2),
    }))
  );

  const lowStock = await conn.query(`
    SELECT p.name, vup.sku, i.quantity_available, i.reorder_level
    FROM inventories i
    JOIN variant_unit_prices vup ON i.variant_unit_price_id = vup.id
    JOIN product_variants pv ON vup.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    WHERE i.quantity_available <= i.reorder_level
    ORDER BY i.quantity_available ASC
    LIMIT 10
  `);
  console.log("\n⚠️ Low Stock & Out of Stock Alerts (Dashboard Widget):");
  console.table(
    lowStock.map((l) => ({
      Product: l.name,
      SKU: l.sku,
      "Stock Left": Number(l.quantity_available),
      "Reorder Level": Number(l.reorder_level),
      Status: Number(l.quantity_available) === 0 ? "OUT OF STOCK" : "LOW STOCK",
    }))
  );

  const recentOrders = await conn.query(`
    SELECT o.order_number, u.name as customer, o.total_amount, o.order_status, o.payment_status, o.created_at
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
    LIMIT 6
  `);
  console.log("\n🕒 Recent Orders (Dashboard Widget):");
  console.table(
    recentOrders.map((r) => ({
      "Order #": r.order_number,
      Customer: r.customer,
      "Amount (₹)": Number(r.total_amount).toFixed(2),
      Status: r.order_status,
      Payment: r.payment_status,
      Placed: new Date(r.created_at).toLocaleString("en-IN"),
    }))
  );

  await conn.end();
}

check().catch(console.error);
