-- Products were looked up by `uuid` (detail, update, delete) and filtered by `category_id`
-- with no index backing either column, forcing full table scans on every call.
ALTER TABLE `products` ADD UNIQUE INDEX `idx_products_uuid` (`uuid`);
ALTER TABLE `products` ADD INDEX `idx_products_category` (`category_id`);
