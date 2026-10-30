import type { RefundDetailsInput } from "../validations/return.schema";
import type { ReturnPayoutDetails } from "../types/return.types";

/**
 * Serializes refund transfer details into a compact, structured tag.
 * Full unmasked account details are preserved without truncation risk.
 *
 * Example UPI:
 *   [PAYOUT:UPI:user@okaxis]
 * Example Bank:
 *   [PAYOUT:BANK:A/C:123456789012|IFSC:SBIN0001234|Holder:John Doe|Bank:SBI]
 */
export function serializePayoutDetails(details?: RefundDetailsInput | null): string {
  if (!details) return "";

  if (details.method === "upi" && details.upiId) {
    return `[PAYOUT:UPI:${details.upiId.trim()}]`;
  }

  if (details.method === "bank_transfer") {
    const acct = details.accountNumber ? details.accountNumber.trim() : "";
    const ifsc = details.ifscCode ? details.ifscCode.trim().toUpperCase() : "";
    const holder = details.accountHolderName ? details.accountHolderName.trim() : "";
    const bank = details.bankName ? details.bankName.trim() : "";

    const parts = [
      `A/C:${acct}`,
      `IFSC:${ifsc}`,
      `Holder:${holder}`,
    ];
    if (bank) {
      parts.push(`Bank:${bank}`);
    }

    return `[PAYOUT:BANK:${parts.join("|")}]`;
  }

  return "";
}

/**
 * Parses customer payout transfer details from stored reason string.
 * Supports both structured [PAYOUT:...] tags and legacy plain-text tags.
 */
export function parsePayoutDetailsFromReason(
  reasonText?: string | null
): ReturnPayoutDetails | null {
  if (!reasonText) return null;

  // 1. Structured tag: UPI
  const structuredUpi = reasonText.match(/\[PAYOUT:UPI:([^\]]+)\]/i);
  if (structuredUpi && structuredUpi[1]) {
    return {
      method: "upi",
      upiId: structuredUpi[1].trim(),
    };
  }

  // 2. Structured tag: Bank
  const structuredBank = reasonText.match(/\[PAYOUT:BANK:([^\]]+)\]/i);
  if (structuredBank && structuredBank[1]) {
    const raw = structuredBank[1];
    const acMatch = raw.match(/(?:A\/C|acc|acct):([^|]+)/i);
    const ifscMatch = raw.match(/IFSC:([^|]+)/i);
    const holderMatch = raw.match(/(?:Holder|name):([^|]+)/i);
    const bankMatch = raw.match(/Bank:([^|]+)/i);

    return {
      method: "bank_transfer",
      accountNumber: acMatch ? acMatch[1].trim() : undefined,
      ifscCode: ifscMatch ? ifscMatch[1].trim() : undefined,
      accountHolderName: holderMatch ? holderMatch[1].trim() : undefined,
      bankName: bankMatch ? bankMatch[1].trim() : undefined,
    };
  }

  // 3. Legacy tag: Refund via UPI:
  const upiMatch = reasonText.match(/Refund via UPI:\s*([^\s|\]]+)/i);
  if (upiMatch && upiMatch[1]) {
    return {
      method: "upi",
      upiId: upiMatch[1].trim(),
    };
  }

  // 4. Legacy tag: Refund via Bank:
  const bankMatch = reasonText.match(/Refund via Bank:([^|\]]+)/i);
  if (bankMatch && bankMatch[1]) {
    const detailsStr = bankMatch[1];
    const acMatch = detailsStr.match(/A\/C:\s*([^\s,]+)/i);
    const ifscMatch = detailsStr.match(/IFSC:\s*([^\s,]+)/i);
    const holderMatch = detailsStr.match(/Holder:\s*([^,]+)/i);
    const bankNameMatch = detailsStr.match(/Bank:\s*([^,]+)/i);

    return {
      method: "bank_transfer",
      accountNumber: acMatch ? acMatch[1].trim() : undefined,
      ifscCode: ifscMatch ? ifscMatch[1].trim() : undefined,
      accountHolderName: holderMatch ? holderMatch[1].trim() : undefined,
      bankName: bankNameMatch ? bankNameMatch[1].trim() : undefined,
    };
  }

  return null;
}

/**
 * Strips payout metadata tag from the reason string for clean display to users.
 */
export function cleanReasonText(reasonText?: string | null): string {
  if (!reasonText) return "";
  return reasonText
    .replace(/\[PAYOUT:(?:UPI|BANK):[^\]]+\]\s*/gi, "")
    .replace(/\|\s*Refund via (?:UPI|Bank):[^\s|]+/gi, "")
    .trim();
}

