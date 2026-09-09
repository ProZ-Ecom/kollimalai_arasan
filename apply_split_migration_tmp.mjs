import { PrismaClient } from './src/generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
const url = new URL(process.env.DATABASE_URL || "mysql://root:root@localhost:3306/rithusnack_new");
const adapter = new PrismaMariaDb({ host: "127.0.0.1", port: Number(url.port||3306), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: url.pathname.slice(1), connectionLimit: 5, allowPublicKeyRetrieval: true });
const db = new PrismaClient({ adapter });

async function run(label, sql) {
  await db.$executeRawUnsafe(sql);
  console.log("OK:", label);
}

// 1. Create the target table first (this appears after the drops in the
// generated migration file, but must run before them so we can backfill).
await run("create variant_unit_prices", `
CREATE TABLE \`variant_unit_prices\` (
    \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`uuid\` VARCHAR(255) NOT NULL DEFAULT 'UUID()',
    \`variant_id\` BIGINT UNSIGNED NOT NULL,
    \`unit_id\` BIGINT UNSIGNED NOT NULL,
    \`unit_value\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    \`sku\` VARCHAR(100) NOT NULL,
    \`base_price\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    \`is_default\` BOOLEAN NOT NULL DEFAULT false,
    \`is_active\` BOOLEAN NOT NULL DEFAULT true,
    \`created_at\` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    \`updated_at\` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    \`deleted_at\` TIMESTAMP(0) NULL,
    \`created_by\` BIGINT UNSIGNED NULL,
    \`updated_by\` BIGINT UNSIGNED NULL,

    UNIQUE INDEX \`sku\`(\`sku\`),
    INDEX \`fk_vup_variant\`(\`variant_id\`),
    INDEX \`fk_vup_unit\`(\`unit_id\`),
    INDEX \`fk_vup_created_by\`(\`created_by\`),
    INDEX \`fk_vup_updated_by\`(\`updated_by\`),
    PRIMARY KEY (\`id\`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
`);

// 2. Backfill from product_variants before its columns are dropped.
await run("backfill variant_unit_prices", `
  INSERT INTO variant_unit_prices (uuid, variant_id, unit_id, unit_value, sku, base_price, is_default, is_active, created_at, updated_at, created_by, updated_by)
  SELECT UUID(), id, unit_id, unit_value, sku, base_price, is_default, is_active, created_at, updated_at, created_by, updated_by
  FROM product_variants
`);

const backfilled = await db.$queryRawUnsafe(`SELECT * FROM variant_unit_prices`);
console.log("backfilled rows:", backfilled);

// 3. Drop old foreign keys.
await run("drop fk_variant_unit", "ALTER TABLE `product_variants` DROP FOREIGN KEY `fk_variant_unit`");
await run("drop fk_inv_variant", "ALTER TABLE `inventories` DROP FOREIGN KEY `fk_inv_variant`");
await run("drop fk_invtx_variant", "ALTER TABLE `inventory_transactions` DROP FOREIGN KEY `fk_invtx_variant`");
await run("drop fk_vph_variant", "ALTER TABLE `variant_price_history` DROP FOREIGN KEY `fk_vph_variant`");

// 4. Drop old indexes.
await run("drop index sku", "DROP INDEX `sku` ON `product_variants`");
await run("drop index fk_variant_unit", "DROP INDEX `fk_variant_unit` ON `product_variants`");
await run("drop index variant_id (inventories)", "DROP INDEX `variant_id` ON `inventories`");
await run("drop index idx_invtx_variant", "DROP INDEX `idx_invtx_variant` ON `inventory_transactions`");
await run("drop index fk_vph_variant", "DROP INDEX `fk_vph_variant` ON `variant_price_history`");

// 5. Alter tables: drop moved columns, add new FK columns.
await run("alter product_variants drop columns", `
ALTER TABLE \`product_variants\` DROP COLUMN \`barcode\`,
    DROP COLUMN \`base_price\`,
    DROP COLUMN \`sale_price\`,
    DROP COLUMN \`sku\`,
    DROP COLUMN \`unit_id\`,
    DROP COLUMN \`unit_value\`,
    DROP COLUMN \`weight_grams\`
`);

await run("alter inventories", `
ALTER TABLE \`inventories\` DROP COLUMN \`variant_id\`,
    ADD COLUMN \`variant_unit_price_id\` BIGINT UNSIGNED NOT NULL
`);

await run("alter inventory_transactions", `
ALTER TABLE \`inventory_transactions\` DROP COLUMN \`variant_id\`,
    ADD COLUMN \`variant_unit_price_id\` BIGINT UNSIGNED NOT NULL
`);

await run("alter variant_price_history", `
ALTER TABLE \`variant_price_history\` DROP COLUMN \`new_sale_price\`,
    DROP COLUMN \`old_sale_price\`,
    DROP COLUMN \`variant_id\`,
    ADD COLUMN \`variant_unit_price_id\` BIGINT UNSIGNED NOT NULL
`);

// 6. New indexes.
await run("index variant_unit_price_id (inventories)", "CREATE UNIQUE INDEX `variant_unit_price_id` ON `inventories`(`variant_unit_price_id`)");
await run("index idx_invtx_variant_unit_price", "CREATE INDEX `idx_invtx_variant_unit_price` ON `inventory_transactions`(`variant_unit_price_id`)");
await run("index fk_vph_variant_unit_price", "CREATE INDEX `fk_vph_variant_unit_price` ON `variant_price_history`(`variant_unit_price_id`)");

// 7. New foreign keys.
await run("fk_vup_variant", "ALTER TABLE `variant_unit_prices` ADD CONSTRAINT `fk_vup_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
await run("fk_vup_unit", "ALTER TABLE `variant_unit_prices` ADD CONSTRAINT `fk_vup_unit` FOREIGN KEY (`unit_id`) REFERENCES `product_units`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
await run("fk_vup_created_by", "ALTER TABLE `variant_unit_prices` ADD CONSTRAINT `fk_vup_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION");
await run("fk_vup_updated_by", "ALTER TABLE `variant_unit_prices` ADD CONSTRAINT `fk_vup_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION");
await run("fk_inv_variant_unit_price", "ALTER TABLE `inventories` ADD CONSTRAINT `fk_inv_variant_unit_price` FOREIGN KEY (`variant_unit_price_id`) REFERENCES `variant_unit_prices`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
await run("fk_invtx_variant_unit_price", "ALTER TABLE `inventory_transactions` ADD CONSTRAINT `fk_invtx_variant_unit_price` FOREIGN KEY (`variant_unit_price_id`) REFERENCES `variant_unit_prices`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
await run("fk_vph_variant_unit_price", "ALTER TABLE `variant_price_history` ADD CONSTRAINT `fk_vph_variant_unit_price` FOREIGN KEY (`variant_unit_price_id`) REFERENCES `variant_unit_prices`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");

console.log("DONE");
await db.$disconnect();
