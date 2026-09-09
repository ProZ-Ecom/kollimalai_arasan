import { db } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma";

type DbClient = typeof db | Prisma.TransactionClient;
export type OtpPurpose = "register" | "reset_password";

export const otpRepository = {
  async deleteByEmail(email: string, purpose: OtpPurpose) {
    return db.otp_verifications.deleteMany({
      where: {
        identifier: email.toLowerCase().trim(),
        purpose,
      },
    });
  },

  async deleteExpired() {
    return db.otp_verifications.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });
  },

  async createOtp(data: {
    email: string;
    otpCode: string;
    purpose: OtpPurpose;
    expiresAt: Date;
  }) {
    const normalizedEmail = data.email.toLowerCase().trim();

    // Invalidate existing unused OTPs for this email and this purpose only
    await db.otp_verifications.updateMany({
      where: {
        identifier: normalizedEmail,
        purpose: data.purpose,
        is_used: false,
      },
      data: {
        is_used: true,
        updated_at: new Date(),
      },
    });

    return db.otp_verifications.create({
      data: {
        identifier: normalizedEmail,
        otp_code: data.otpCode,
        purpose: data.purpose,
        expires_at: data.expiresAt,
        is_used: false,
        is_token_used: false,
      },
    });
  },

  async findLatestValidOtp(email: string, purpose: OtpPurpose) {
    const record = await db.otp_verifications.findFirst({
      where: {
        identifier: email.toLowerCase().trim(),
        purpose,
        is_used: false,
      },
      orderBy: { created_at: "desc" },
    });

    if (!record) return null;

    return {
      id: record.id,
      email: record.identifier,
      otpCode: record.otp_code,
      purpose: record.purpose as OtpPurpose,
      expiresAt: record.expires_at,
      createdAt: record.created_at,
    };
  },

  async markOtpConsumed(id: bigint) {
    return db.otp_verifications.update({
      where: { id },
      data: {
        is_used: true,
        updated_at: new Date(),
      },
    });
  },

  async markOtpConsumedAndIssueToken(
    id: bigint,
    jti: string,
    tokenExpiresAt: Date
  ) {
    return db.otp_verifications.update({
      where: { id },
      data: {
        is_used: true,
        verification_token_hash: jti,
        token_expires_at: tokenExpiresAt,
        is_token_used: false,
        updated_at: new Date(),
      },
    });
  },

  async findValidUnusedVerificationTokenRecord(
    email: string,
    jti: string,
    tx: DbClient = db
  ) {
    const record = await tx.otp_verifications.findFirst({
      where: {
        identifier: email.toLowerCase().trim(),
        purpose: "register",
        is_used: true,
        is_token_used: false,
        verification_token_hash: jti,
        token_expires_at: {
          gt: new Date(),
        },
      },
    });

    return record;
  },

  async markVerificationTokenUsed(id: bigint, tx: DbClient = db) {
    return tx.otp_verifications.update({
      where: { id },
      data: {
        is_token_used: true,
        updated_at: new Date(),
      },
    });
  },

  // Backward-compatible delegates
  async createEmailOtp(data: { email: string; otpCode: string; expiresAt: Date }) {
    return this.createOtp({ ...data, purpose: "register" });
  },

  async findLatestValidEmailOtp(email: string) {
    return this.findLatestValidOtp(email, "register");
  },

  async create(data: { email: string; otpCode: string; expiresAt: Date }) {
    return this.createOtp({ ...data, purpose: "reset_password" });
  },

  async findLatestByEmail(email: string) {
    return this.findLatestValidOtp(email, "reset_password");
  },
};
