-- The public FAQ endpoint filters on `is_active` and orders by `sort_order`, and the
-- admin list filters by `category`. Neither column was indexed, so every FAQ request
-- ran a full table scan plus a filesort.
ALTER TABLE `faq` ADD INDEX `idx_faq_active_sort` (`is_active`, `sort_order`);
ALTER TABLE `faq` ADD INDEX `idx_faq_category` (`category`);
