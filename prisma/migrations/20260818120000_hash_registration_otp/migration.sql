-- SHA-256 OTP digests require 64 characters. Existing six-digit reset-password
-- OTP values remain compatible with this widened column.
ALTER TABLE `otp_verifications` MODIFY `otp_code` VARCHAR(64) NOT NULL;
