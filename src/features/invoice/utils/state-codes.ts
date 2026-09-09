/** GST state codes, keyed by lowercased state name. */
const STATE_CODES: Record<string, string> = {
  "jammu and kashmir": "01",
  "himachal pradesh": "02",
  punjab: "03",
  chandigarh: "04",
  uttarakhand: "05",
  haryana: "06",
  delhi: "07",
  rajasthan: "08",
  "uttar pradesh": "09",
  bihar: "10",
  sikkim: "11",
  "arunachal pradesh": "12",
  nagaland: "13",
  manipur: "14",
  mizoram: "15",
  tripura: "16",
  meghalaya: "17",
  assam: "18",
  "west bengal": "19",
  jharkhand: "20",
  odisha: "21",
  orissa: "21",
  chhattisgarh: "22",
  "madhya pradesh": "23",
  gujarat: "24",
  "dadra and nagar haveli and daman and diu": "26",
  maharashtra: "27",
  karnataka: "29",
  goa: "30",
  lakshadweep: "31",
  kerala: "32",
  "tamil nadu": "33",
  puducherry: "34",
  pondicherry: "34",
  "andaman and nicobar islands": "35",
  telangana: "36",
  "andhra pradesh": "37",
  ladakh: "38",
};

/**
 * GST state code for a party. The GSTIN is authoritative (its first two digits
 * are the state code); the state name is only a fallback for unregistered
 * buyers.
 */
export function resolveStateCode(
  state: string | null | undefined,
  gstin?: string | null
): string | null {
  const trimmedGstin = gstin?.trim();
  if (trimmedGstin && /^\d{2}/.test(trimmedGstin)) {
    return trimmedGstin.slice(0, 2);
  }

  const key = state?.trim().toLowerCase();
  if (!key) return null;
  return STATE_CODES[key] ?? null;
}

export function isSameState(
  sellerState: string | null | undefined,
  buyerState: string | null | undefined
): boolean {
  const a = sellerState?.trim().toLowerCase();
  const b = buyerState?.trim().toLowerCase();
  if (!a || !b) return true; // Intra-state is the safe default for a local store.
  return a === b;
}
