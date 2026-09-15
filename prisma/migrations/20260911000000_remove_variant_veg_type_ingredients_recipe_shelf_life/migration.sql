-- AlterTable
ALTER TABLE `product_variants`
    DROP COLUMN `ingredients`,
    DROP COLUMN `is_ready_to_mix`,
    DROP COLUMN `cooking_recipe`,
    DROP COLUMN `shelf_life`,
    DROP COLUMN `veg_type`;
