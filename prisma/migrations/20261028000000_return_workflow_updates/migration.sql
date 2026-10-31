-- Migration: Add video_url, admin_notes, inspected_at to return_requests and update status enum
-- Date: 2026-10-28

-- 1. Modify return_requests_status ENUM to include 'delivered'
ALTER TABLE `return_requests`
  MODIFY COLUMN `status` ENUM('requested', 'approved', 'rejected', 'picked_up', 'delivered', 'refunded') NOT NULL DEFAULT 'requested';

-- 2. Add video_url to return_requests
ALTER TABLE `return_requests`
  ADD COLUMN `video_url` VARCHAR(500) NULL AFTER `reason`;

-- 3. Add admin_notes and inspected_at to return_requests
ALTER TABLE `return_requests`
  ADD COLUMN `admin_notes` VARCHAR(1000) NULL AFTER `courier_partner_name`,
  ADD COLUMN `inspected_at` TIMESTAMP NULL AFTER `admin_notes`;

