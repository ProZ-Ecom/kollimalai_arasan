-- AlterTable
ALTER TABLE `product_variants`
    ADD COLUMN `ingredients` TEXT NULL AFTER `description`,
    ADD COLUMN `is_ready_to_mix` BOOLEAN NOT NULL DEFAULT false AFTER `ingredients`,
    ADD COLUMN `cooking_recipe` TEXT NULL AFTER `is_ready_to_mix`,
    ADD COLUMN `shelf_life` VARCHAR(100) NULL AFTER `cooking_recipe`;
