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

  // 1. Add Shiprocket columns to shipments table if not present
  if (!(await columnExists('shipments', 'label_url'))) {
    await conn.query("ALTER TABLE `shipments` ADD COLUMN `label_url` VARCHAR(500) NULL COMMENT 'Shipping Label PDF URL'");
    console.log('Added label_url to shipments');
  } else {
    console.log('label_url already exists in shipments');
  }

  if (!(await columnExists('shipments', 'shiprocket_order_id'))) {
    await conn.query("ALTER TABLE `shipments` ADD COLUMN `shiprocket_order_id` VARCHAR(100) NULL COMMENT 'Shiprocket Order ID'");
    console.log('Added shiprocket_order_id to shipments');
  } else {
    console.log('shiprocket_order_id already exists in shipments');
  }

  if (!(await columnExists('shipments', 'shiprocket_shipment_id'))) {
    await conn.query("ALTER TABLE `shipments` ADD COLUMN `shiprocket_shipment_id` VARCHAR(100) NULL COMMENT 'Shiprocket Shipment ID'");
    console.log('Added shiprocket_shipment_id to shipments');
  } else {
    console.log('shiprocket_shipment_id already exists in shipments');
  }

  if (!(await columnExists('shipments', 'courier_partner_name'))) {
    await conn.query("ALTER TABLE `shipments` ADD COLUMN `courier_partner_name` VARCHAR(100) NULL COMMENT 'Actual courier name assigned (Delhivery, Bluedart, etc.)'");
    console.log('Added courier_partner_name to shipments');
  } else {
    console.log('courier_partner_name already exists in shipments');
  }

  // 2. Provision or update SHIPROCKET partner in delivery_partners
  const existingShiprocket = await conn.query("SELECT id FROM `delivery_partners` WHERE `code` = 'SHIPROCKET'");
  if (existingShiprocket.length === 0) {
    const now = new Date();
    const hasUuid = await columnExists('delivery_partners', 'uuid');
    if (hasUuid) {
      const crypto = require('crypto');
      await conn.query(
        "INSERT INTO `delivery_partners` (`uuid`, `name`, `code`, `courier_type`, `is_active`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [crypto.randomUUID(), 'Shiprocket Multi-Carrier', 'SHIPROCKET', 'shiprocket', 1, now, now]
      );
    } else {
      await conn.query(
        "INSERT INTO `delivery_partners` (`name`, `code`, `courier_type`, `is_active`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?, ?, ?)",
        ['Shiprocket Multi-Carrier', 'SHIPROCKET', 'shiprocket', 1, now, now]
      );
    }
    console.log('Inserted SHIPROCKET delivery partner');
  } else {
    await conn.query("UPDATE `delivery_partners` SET `courier_type` = 'shiprocket', `is_active` = 1 WHERE `code` = 'SHIPROCKET'");
    console.log('Updated SHIPROCKET courier_type and active status');
  }

  await conn.end();
  console.log('Shiprocket DB migration completed successfully.');
})().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
