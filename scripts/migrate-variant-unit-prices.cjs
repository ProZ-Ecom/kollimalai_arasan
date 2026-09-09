const mariadb = require('mariadb');
require('dotenv').config();

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is not set in .env');

  const url = new URL(databaseUrl);
  const host = url.hostname || 'localhost';
  const port = Number(url.port || 3306);
  const user = decodeURIComponent(url.username || 'root');
  const password = decodeURIComponent(url.password || '');
  const database = url.pathname.slice(1) || 'rithusnack_new';

  console.log(`Connecting to ${host}:${port}/${database}...`);
  const conn = await mariadb.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true,
  });

  await conn.query('SET FOREIGN_KEY_CHECKS = 0;');

  console.log('1. Adding missing columns to product_variants...');
  const pvCols = await conn.query('DESCRIBE product_variants');
  const pvColSet = new Set(pvCols.map((c) => c.Field));

  if (!pvColSet.has('short_description')) {
    await conn.query('ALTER TABLE `product_variants` ADD COLUMN `short_description` VARCHAR(500) NULL;');
    console.log('  + Added short_description to product_variants');
  }
  if (!pvColSet.has('description')) {
    await conn.query('ALTER TABLE `product_variants` ADD COLUMN `description` TEXT NULL;');
    console.log('  + Added description to product_variants');
  }
  if (!pvColSet.has('veg_type')) {
    await conn.query("ALTER TABLE `product_variants` ADD COLUMN `veg_type` ENUM('veg','non_veg','egg','na') NOT NULL DEFAULT 'na';");
    console.log('  + Added veg_type to product_variants');
  }
  if (!pvColSet.has('is_featured')) {
    await conn.query('ALTER TABLE `product_variants` ADD COLUMN `is_featured` TINYINT(1) NOT NULL DEFAULT 0;');
    console.log('  + Added is_featured to product_variants');
  }

  console.log('2. Ensuring variant_unit_prices table exists...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`variant_unit_prices\` (
      \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`uuid\` VARCHAR(255) NOT NULL DEFAULT 'UUID()',
      \`variant_id\` BIGINT UNSIGNED NOT NULL,
      \`unit_id\` BIGINT UNSIGNED NOT NULL,
      \`unit_value\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      \`sku\` VARCHAR(100) NOT NULL,
      \`base_price\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      \`is_default\` TINYINT(1) NOT NULL DEFAULT 1,
      \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      \`deleted_at\` TIMESTAMP NULL,
      \`created_by\` BIGINT UNSIGNED NULL,
      \`updated_by\` BIGINT UNSIGNED NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`sku\` (\`sku\`),
      INDEX \`fk_vup_variant\` (\`variant_id\`),
      INDEX \`fk_vup_unit\` (\`unit_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('3. Backfilling variant_unit_prices from product_variants...');
  // Find variants not yet in variant_unit_prices
  const missingVups = await conn.query(`
    SELECT pv.id, pv.sku, pv.unit_id, pv.unit_value, pv.base_price, pv.is_default, pv.is_active, pv.created_at, pv.updated_at, pv.created_by, pv.updated_by
    FROM product_variants pv
    LEFT JOIN variant_unit_prices vup ON vup.variant_id = pv.id
    WHERE vup.id IS NULL;
  `);

  console.log(`  Found ${missingVups.length} product_variants without unit prices.`);
  for (const v of missingVups) {
    const sku = v.sku || `SKU-${v.id}-${Date.now()}`;
    const unitId = v.unit_id || 1n;
    const unitValue = v.unit_value || 1;
    const basePrice = v.base_price || 0;
    const isDefault = v.is_default !== undefined ? (v.is_default ? 1 : 0) : 1;
    const isActive = v.is_active !== undefined ? (v.is_active ? 1 : 0) : 1;

    try {
      await conn.query(`
        INSERT INTO variant_unit_prices (uuid, variant_id, unit_id, unit_value, sku, base_price, is_default, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [v.id, unitId, unitValue, sku, basePrice, isDefault, isActive, v.created_at, v.updated_at, v.created_by, v.updated_by]);
    } catch (err) {
      console.warn(`  Warning backfilling variant ${v.id}:`, err.message);
      // If duplicate sku, append id
      await conn.query(`
        INSERT INTO variant_unit_prices (uuid, variant_id, unit_id, unit_value, sku, base_price, is_default, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [v.id, unitId, unitValue, `${sku}-${v.id}`, basePrice, isDefault, isActive, v.created_at, v.updated_at, v.created_by, v.updated_by]);
    }
  }

  console.log('4. Adding variant_unit_price_id to referencing tables and backfilling...');
  const referencingTables = [
    'cart_items',
    'wishlist_items',
    'order_items',
    'reviews',
    'inventories',
    'inventory_transactions',
    'combo_product_items',
    'stock_adjustments',
    'stock_reports',
    'variant_price_history',
  ];

  for (const table of referencingTables) {
    const cols = await conn.query(`DESCRIBE \`${table}\``);
    const colSet = new Set(cols.map((c) => c.Field));

    if (!colSet.has('variant_unit_price_id')) {
      await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`variant_unit_price_id\` BIGINT UNSIGNED NULL;`);
      console.log(`  + Added variant_unit_price_id to ${table}`);
    }

    // If table has variant_id, backfill variant_unit_price_id
    if (colSet.has('variant_id')) {
      const updateResult = await conn.query(`
        UPDATE \`${table}\` t
        JOIN \`variant_unit_prices\` vup ON vup.variant_id = t.variant_id
        SET t.variant_unit_price_id = vup.id
        WHERE t.variant_unit_price_id IS NULL;
      `);
      console.log(`  ✓ Backfilled variant_unit_price_id on ${table} (${updateResult.affectedRows || 0} rows)`);
    }
  }

  // Add foreign key constraints where missing
  console.log('5. Adding foreign key constraints...');
  const fkDefinitions = [
    { table: 'cart_items', fk: 'fk_cartitem_variant_unit_price', col: 'variant_unit_price_id', refTable: 'variant_unit_prices', refCol: 'id', onDelete: 'CASCADE' },
    { table: 'wishlist_items', fk: 'fk_wishlist_variant_unit_price', col: 'variant_unit_price_id', refTable: 'variant_unit_prices', refCol: 'id', onDelete: 'CASCADE' },
    { table: 'order_items', fk: 'fk_orderitem_variant_unit_price', col: 'variant_unit_price_id', refTable: 'variant_unit_prices', refCol: 'id', onDelete: 'RESTRICT' },
    { table: 'reviews', fk: 'fk_review_variant_unit_price', col: 'variant_unit_price_id', refTable: 'variant_unit_prices', refCol: 'id', onDelete: 'SET NULL' },
    { table: 'inventories', fk: 'fk_inv_variant_unit_price', col: 'variant_unit_price_id', refTable: 'variant_unit_prices', refCol: 'id', onDelete: 'CASCADE' },
    { table: 'inventory_transactions', fk: 'fk_invtx_variant_unit_price', col: 'variant_unit_price_id', refTable: 'variant_unit_prices', refCol: 'id', onDelete: 'CASCADE' },
    { table: 'variant_price_history', fk: 'fk_vph_variant_unit_price', col: 'variant_unit_price_id', refTable: 'variant_unit_prices', refCol: 'id', onDelete: 'CASCADE' },
  ];

  for (const def of fkDefinitions) {
    try {
      await conn.query(`
        ALTER TABLE \`${def.table}\`
        ADD CONSTRAINT \`${def.fk}\`
        FOREIGN KEY (\`${def.col}\`) REFERENCES \`${def.refTable}\` (\`${def.refCol}\`)
        ON DELETE ${def.onDelete} ON UPDATE NO ACTION;
      `);
      console.log(`  + FK ${def.fk} added to ${def.table}`);
    } catch (e) {
      // already exists
    }
  }

  await conn.query('SET FOREIGN_KEY_CHECKS = 1;');
  console.log('✓ Migration & backfill completed successfully!');
  await conn.end();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
