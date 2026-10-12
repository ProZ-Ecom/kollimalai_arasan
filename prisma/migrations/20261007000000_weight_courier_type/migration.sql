-- Migration: Add weight_kg to variant_unit_prices and courier_type to delivery_partners
-- Date: 2026-10-07

-- 1. Add weight_kg column to variant_unit_prices
--    Default 0.5 kg for all existing rows (500g)
ALTER TABLE `variant_unit_prices`
  ADD COLUMN `weight_kg` DECIMAL(8,3) NOT NULL DEFAULT 0.500
  COMMENT 'Weight of this variant unit in kilograms (used for shipping charge calculation)';

-- 2. Add courier_type to delivery_partners
ALTER TABLE `delivery_partners`
  ADD COLUMN `courier_type` VARCHAR(20) NOT NULL DEFAULT 'manual'
  COMMENT 'st_courier = ST Courier (live tracking), mss = MSS manual tracking, manual = admin-managed';

-- 3. Seed MSS courier (Mettur Super Services)
INSERT INTO `delivery_partners` (`name`, `code`, `courier_type`, `is_active`)
VALUES ('Mettur Super Services', 'MSS', 'mss', 1)
ON DUPLICATE KEY UPDATE `courier_type` = 'mss';

-- 4. Mark existing ST Courier entry with correct courier_type
UPDATE `delivery_partners` SET `courier_type` = 'st_courier' WHERE `code` = 'ST';
