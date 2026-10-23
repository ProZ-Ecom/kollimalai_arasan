/**
 * Indian Financial Year & Invoice Number Utilities
 *
 * Rules:
 * - Indian Financial Year runs from 1 April to 31 March.
 * - If the date falls between 1 April and 31 December, FY is currentYear to (currentYear + 1).
 * - If the date falls between 1 January and 31 March, FY is (currentYear - 1) to currentYear.
 * - Format: YY-YY (e.g. 2026-2027 becomes "26-27").
 * - Evaluated consistently in the Indian Standard Time (Asia/Kolkata) timezone.
 */

export function getIndianFinancialYear(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
  });
  const parts = formatter.formatToParts(date);
  const yearStr =
    parts.find((p) => p.type === "year")?.value || String(date.getFullYear());
  const monthStr =
    parts.find((p) => p.type === "month")?.value ||
    String(date.getMonth() + 1);

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1 = January, ..., 12 = December

  // April (4) to December (12): FY starts in current calendar year
  // January (1) to March (3): FY started in previous calendar year
  const startYear = month >= 4 ? year : year - 1;
  const endYear = startYear + 1;

  const startYY = String(startYear % 100).padStart(2, "0");
  const endYY = String(endYear % 100).padStart(2, "0");

  return `${startYY}-${endYY}`;
}

/**
 * Formats an invoice number in the official series format:
 * `${prefix}/${financialYear}/${paddedSequence}`
 * e.g. ("WEB", "26-27", 1) -> "WEB/26-27/0001"
 */
export function formatInvoiceNumber(
  prefix = "WEB",
  financialYear: string,
  sequenceNumber: number
): string {
  const paddedSeq = String(sequenceNumber).padStart(4, "0");
  return `${prefix}/${financialYear}/${paddedSeq}`;
}
