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

  if (!(await columnExists('variant_unit_prices', 'weight_kg'))) {
    await conn.query("ALTER TABLE `variant_unit_prices` ADD COLUMN `weight_kg` DECIMAL(8,3) NOT NULL DEFAULT 0.500 COMMENT 'Weight of this variant unit in kg'");
    console.log('Added weight_kg to variant_unit_prices');
  } else {
    console.log('weight_kg already exists');
  }

  if (!(await columnExists('delivery_partners', 'courier_type'))) {
    await conn.query("ALTER TABLE `delivery_partners` ADD COLUMN `courier_type` VARCHAR(20) NOT NULL DEFAULT 'manual' COMMENT 'st_courier|mss|manual'");
    console.log('Added courier_type to delivery_partners');
  } else {
    console.log('courier_type already exists');
  }

  // Check if delivery_partners has uuid or other required columns
  const partnerCols = await conn.query("DESCRIBE `delivery_partners`");
  console.log('delivery_partners columns:', partnerCols.map(c => c.Field));

  const existingST = await conn.query("SELECT * FROM `delivery_partners` LIMIT 1");
  console.log('Sample partner row:', existingST[0]);

  const existingMss = await conn.query("SELECT id FROM `delivery_partners` WHERE `code` = 'MSS'");
  if (existingMss.length === 0) {
    const crypto = require('crypto');
    const now = new Date();
    await conn.query(
      "INSERT INTO `delivery_partners` (`uuid`, `name`, `code`, `courier_type`, `is_active`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [crypto.randomUUID(), 'Mettur Super Services', 'MSS', 'mss', 1, now, now, 1, 1]
    );
    console.log('Inserted MSS delivery partner');
  } else {
    await conn.query("UPDATE `delivery_partners` SET `courier_type` = 'mss' WHERE `code` = 'MSS'");
    console.log('Updated MSS courier_type');
  }

  await conn.query("UPDATE `delivery_partners` SET `courier_type` = 'st_courier' WHERE `code` = 'ST'");
  console.log('Updated ST courier_type');

  await conn.end();
  console.log('Migration complete.');
})();
