-- Offer Management module.
--
-- The `offers` table only carried a name/type/value/date window, which is not
-- enough to express the two offer levels (product-wide vs a single sellable
-- pack size) or the quantity/cap rules the admin panel needs. Offer targets
-- live in join tables (`offer_products`, `offer_items`) so no product or item
-- detail is duplicated onto the offer row itself.

-- 1. `special_price` ("sell this item at exactly X") joins the existing types.
ALTER TABLE `offers`
  MODIFY COLUMN `type` ENUM('percentage', 'flat', 'special_price', 'bxgy') NOT NULL;

-- 2. Offer configuration columns.
ALTER TABLE `offers`
  ADD COLUMN `code` VARCHAR(50) NULL AFTER `name`,
  ADD COLUMN `level` ENUM('product', 'item') NOT NULL DEFAULT 'product' AFTER `code`,
  ADD COLUMN `buy_quantity` INT NULL AFTER `value`,
  ADD COLUMN `get_quantity` INT NULL AFTER `buy_quantity`,
  ADD COLUMN `min_quantity` INT NOT NULL DEFAULT 1 AFTER `get_quantity`,
  ADD COLUMN `max_quantity` INT NULL AFTER `min_quantity`,
  ADD COLUMN `max_discount_amount` DECIMAL(10, 2) NULL AFTER `min_order_amount`,
  ADD COLUMN `priority` INT NOT NULL DEFAULT 0 AFTER `max_discount_amount`,
  ADD COLUMN `terms` TEXT NULL AFTER `priority`,
  ADD COLUMN `deleted_at` TIMESTAMP NULL AFTER `updated_at`;

-- A coupon-style offer code must be unique when present; NULL repeats freely.
ALTER TABLE `offers` ADD UNIQUE INDEX `uq_offers_code` (`code`);

-- The customer-facing lookup is always "active offers whose window covers now",
-- resolved highest-priority-first.
ALTER TABLE `offers` ADD INDEX `idx_offers_active_window` (`is_active`, `starts_at`, `ends_at`);
ALTER TABLE `offers` ADD INDEX `idx_offers_level` (`level`);
ALTER TABLE `offers` ADD INDEX `idx_offers_priority` (`priority`);

-- 3. Item-level targets. `variant_unit_prices` is the sellable, priced unit
-- (a pack size such as "500g"), which is what cart and order lines key off.
CREATE TABLE `offer_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(255) NULL DEFAULT (UUID()),
  `offer_id` BIGINT UNSIGNED NOT NULL,
  `variant_unit_price_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` BIGINT UNSIGNED NULL,
  `updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_offer_item` (`offer_id`, `variant_unit_price_id`),
  INDEX `fk_offeritem_vup` (`variant_unit_price_id`),
  INDEX `fk_offer_items_created_by` (`created_by`),
  INDEX `fk_offer_items_updated_by` (`updated_by`),
  CONSTRAINT `fk_offeritem_offer` FOREIGN KEY (`offer_id`) REFERENCES `offers` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `fk_offeritem_vup` FOREIGN KEY (`variant_unit_price_id`) REFERENCES `variant_unit_prices` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `fk_offer_items_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON UPDATE NO ACTION,
  CONSTRAINT `fk_offer_items_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON UPDATE NO ACTION
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 4. Order lines record what the offer took off, so an order stays auditable
-- after the offer that produced it changes or expires. `unit_price` keeps the
-- undiscounted price and `total_price` is what the customer actually paid.
ALTER TABLE `order_items`
  ADD COLUMN `discount_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER `unit_price`;

-- 5. `offers.uuid` and `offer_products.uuid` are declared as
-- `@default("UUID()")`, which Prisma writes as the literal five-character
-- string "UUID()" rather than calling the function. Every row created before
-- now therefore shares one non-unique id, which the offer APIs address rows
-- by. Backfill real values; new rows generate their UUID in the repository.
UPDATE `offers` SET `uuid` = UUID() WHERE `uuid` IS NULL OR `uuid` = 'UUID()';
UPDATE `offer_products` SET `uuid` = UUID() WHERE `uuid` IS NULL OR `uuid` = 'UUID()';
