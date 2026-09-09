const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function twoDigits(value: number): string {
  if (value < 20) return ONES[value];
  const tens = TENS[Math.floor(value / 10)];
  const ones = ONES[value % 10];
  return ones ? `${tens} ${ones}` : tens;
}

function threeDigits(value: number): string {
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  const parts: string[] = [];
  if (hundreds) parts.push(`${ONES[hundreds]} Hundred`);
  if (rest) parts.push(twoDigits(rest));
  return parts.join(" ");
}

/** Converts a whole number to words using the Indian numbering system. */
export function numberToIndianWords(value: number): string {
  const whole = Math.floor(Math.abs(value));
  if (whole === 0) return "Zero";

  const crore = Math.floor(whole / 10000000);
  const lakh = Math.floor((whole % 10000000) / 100000);
  const thousand = Math.floor((whole % 100000) / 1000);
  const rest = whole % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${numberToIndianWords(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (rest) parts.push(threeDigits(rest));

  return parts.join(" ");
}

/**
 * Renders a rupee amount the way a tax invoice states it, e.g.
 * `One Thousand Two Hundred and Fifty Paise` for 1250.50.
 */
export function rupeesInWords(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const rupees = Math.floor(Math.abs(safe));
  const paise = Math.round((Math.abs(safe) - rupees) * 100);

  const sign = safe < 0 ? "Minus " : "";
  const rupeeWords = numberToIndianWords(rupees);

  if (!paise) return `${sign}${rupeeWords}`;
  return `${sign}${rupeeWords} and ${numberToIndianWords(paise)} Paise`;
}
