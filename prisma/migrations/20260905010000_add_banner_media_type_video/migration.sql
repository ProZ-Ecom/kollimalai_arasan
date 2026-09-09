-- AlterTable
ALTER TABLE `banners`
    ADD COLUMN `media_type` ENUM('image', 'video') NOT NULL DEFAULT 'image' AFTER `link_url`,
    ADD COLUMN `video_url` VARCHAR(500) NULL AFTER `media_type`,
    ADD COLUMN `thumbnail_url` VARCHAR(500) NULL AFTER `video_url`;
