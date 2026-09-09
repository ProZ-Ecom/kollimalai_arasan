-- FAQ section icons used to be assigned by list position, so a new category
-- inherited whatever icon fell at its index. The icon is now chosen by the
-- admin and stored per FAQ; a category takes the icon of its first FAQ.
ALTER TABLE `faq` ADD COLUMN `icon` VARCHAR(50) NULL AFTER `category`;
