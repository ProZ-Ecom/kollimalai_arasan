-- NOTE: This migration was generated with `prisma migrate diff` and has NOT been
-- applied to any database. Before running it against a database that has existing
-- product_variants data, first backfill `variant_unit_prices` from the columns
-- being dropped below, e.g.:
--
--   INSERT INTO variant_unit_prices (uuid, variant_id, unit_id, unit_value, sku, base_price, is_default, is_active, created_at, updated_at, created_by, updated_by)
--   SELECT UUID(), id, unit_id, unit_value, sku, base_price, is_default, is_active, created_at, updated_at, created_by, updated_by
--   FROM product_variants;
--
-- and repoint existing inventories / inventory_transactions / variant_price_history
-- rows at the resulting variant_unit_prices.id before the DROP COLUMN statements run.


-- DropForeignKey
ALTER TABLE `product_variants` DROP FOREIGN KEY `fk_variant_unit`;

-- DropForeignKey
ALTER TABLE `inventories` DROP FOREIGN KEY `fk_inv_variant`;

-- DropForeignKey
ALTER TABLE `inventory_transactions` DROP FOREIGN KEY `fk_invtx_variant`;

-- DropForeignKey
ALTER TABLE `variant_price_history` DROP FOREIGN KEY `fk_vph_variant`;

-- DropIndex
DROP INDEX `sku` ON `product_variants`;

-- DropIndex
DROP INDEX `fk_variant_unit` ON `product_variants`;

-- DropIndex
DROP INDEX `variant_id` ON `inventories`;

-- DropIndex
DROP INDEX `idx_invtx_variant` ON `inventory_transactions`;

-- DropIndex
DROP INDEX `fk_vph_variant` ON `variant_price_history`;

-- AlterTable
ALTER TABLE `product_variants` DROP COLUMN `barcode`,
    DROP COLUMN `base_price`,
    DROP COLUMN `sale_price`,
    DROP COLUMN `sku`,
    DROP COLUMN `unit_id`,
    DROP COLUMN `unit_value`,
    DROP COLUMN `weight_grams`;

-- AlterTable
ALTER TABLE `inventories` DROP COLUMN `variant_id`,
    ADD COLUMN `variant_unit_price_id` BIGINT UNSIGNED NOT NULL;

-- AlterTable
ALTER TABLE `inventory_transactions` DROP COLUMN `variant_id`,
    ADD COLUMN `variant_unit_price_id` BIGINT UNSIGNED NOT NULL;

-- AlterTable
ALTER TABLE `variant_price_history` DROP COLUMN `new_sale_price`,
    DROP COLUMN `old_sale_price`,
    DROP COLUMN `variant_id`,
    ADD COLUMN `variant_unit_price_id` BIGINT UNSIGNED NOT NULL;

-- CreateTable
CREATE TABLE `variant_unit_prices` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(255) NOT NULL DEFAULT 'UUID()',
    `variant_id` BIGINT UNSIGNED NOT NULL,
    `unit_id` BIGINT UNSIGNED NOT NULL,
    `unit_value` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `sku` VARCHAR(100) NOT NULL,
    `base_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,

    UNIQUE INDEX `sku`(`sku`),
    INDEX `fk_vup_variant`(`variant_id`),
    INDEX `fk_vup_unit`(`unit_id`),
    INDEX `fk_vup_created_by`(`created_by`),
    INDEX `fk_vup_updated_by`(`updated_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `variant_unit_price_id` ON `inventories`(`variant_unit_price_id`);

-- CreateIndex
CREATE INDEX `idx_invtx_variant_unit_price` ON `inventory_transactions`(`variant_unit_price_id`);

-- CreateIndex
CREATE INDEX `fk_vph_variant_unit_price` ON `variant_price_history`(`variant_unit_price_id`);

-- AddForeignKey
ALTER TABLE `variant_unit_prices` ADD CONSTRAINT `fk_vup_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `variant_unit_prices` ADD CONSTRAINT `fk_vup_unit` FOREIGN KEY (`unit_id`) REFERENCES `product_units`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `variant_unit_prices` ADD CONSTRAINT `fk_vup_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `variant_unit_prices` ADD CONSTRAINT `fk_vup_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `inventories` ADD CONSTRAINT `fk_inv_variant_unit_price` FOREIGN KEY (`variant_unit_price_id`) REFERENCES `variant_unit_prices`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `fk_invtx_variant_unit_price` FOREIGN KEY (`variant_unit_price_id`) REFERENCES `variant_unit_prices`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `variant_price_history` ADD CONSTRAINT `fk_vph_variant_unit_price` FOREIGN KEY (`variant_unit_price_id`) REFERENCES `variant_unit_prices`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

