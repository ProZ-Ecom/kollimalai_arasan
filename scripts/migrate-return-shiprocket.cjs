const mariadb = require('mariadb');
require('dotenv').config();

(async () => {
  const url = new URL(process.env.DATABASE_URL);
  const conn = await mariadb.createConnection({
    host: url.hostname === 'localhost' ? '127.0.0.1' : url.hostname,
    port: Number(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', ''),
    multipleStatements: false,
  });

  async function columnExists(table, column) {
    const rows = await conn.query(
      `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [conn.info.database || url.pathname.replace('/', ''), table, column]
    );
    return Number(rows[0]?.cnt || rows[0]?.CNT || 0) > 0;
  }

  // Add return tracking fields to return_requests table
  if (!(await columnExists('return_requests', 'return_awb_code'))) {
    await conn.query("ALTER TABLE `return_requests` ADD COLUMN `return_awb_code` VARCHAR(150) NULL COMMENT 'Shiprocket Return AWB Code'");
    console.log('Added return_awb_code to return_requests');
  }

  if (!(await columnExists('return_requests', 'return_shipment_id'))) {
    await conn.query("ALTER TABLE `return_requests` ADD COLUMN `return_shipment_id` VARCHAR(100) NULL COMMENT 'Shiprocket Return Shipment ID'");
    console.log('Added return_shipment_id to return_requests');
  }

  if (!(await columnExists('return_requests', 'return_label_url'))) {
    await conn.query("ALTER TABLE `return_requests` ADD COLUMN `return_label_url` VARCHAR(500) NULL COMMENT 'Return Shipping Label PDF URL'");
    console.log('Added return_label_url to return_requests');
  }

  if (!(await columnExists('return_requests', 'courier_partner_name'))) {
    await conn.query("ALTER TABLE `return_requests` ADD COLUMN `courier_partner_name` VARCHAR(100) NULL COMMENT 'Reverse pickup courier name (e.g. Delhivery)'");
    console.log('Added courier_partner_name to return_requests');
  }

  await conn.end();
  console.log('Return requests DB migration complete.');
})().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
