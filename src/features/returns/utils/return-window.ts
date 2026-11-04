/**
 * Return Window Policy Configuration
 * Policy: Customers can request a return within 7 business days after the product is delivered.
 */
export const RETURN_WINDOW_BUSINESS_DAYS = 7;

/**
 * Checks whether a given Date is a business day (Monday - Friday).
 * Weekends (Saturday = 6, Sunday = 0) are excluded.
 */
export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

/**
 * Calculates the exact return expiration Date (inclusive of the 7th business day up to 23:59:59.999).
 *
 * Each business day counts after the delivered date.
 * If delivery was on a weekend, business day counting begins on Monday.
 */
export function calculateReturnWindowExpiry(deliveredDate: Date | string | number): Date {
  const start = new Date(deliveredDate);
  if (isNaN(start.getTime())) {
    return new Date(Date.now() + RETURN_WINDOW_BUSINESS_DAYS * 24 * 60 * 60 * 1000);
  }

  const expiry = new Date(start.getTime());
  let businessDaysCounted = 0;

  while (businessDaysCounted < RETURN_WINDOW_BUSINESS_DAYS) {
    expiry.setDate(expiry.getDate() + 1);
    if (isBusinessDay(expiry)) {
      businessDaysCounted++;
    }
  }

  // Window closes at the end of the 7th business day (23:59:59.999)
  expiry.setHours(23, 59, 59, 999);
  return expiry;
}

/**
 * Checks if the current time is within the 7 business days return window from delivery.
 */
export function isWithinReturnWindow(
  deliveredDate: Date | string | number,
  nowDate: Date | string | number = new Date()
): boolean {
  const expiry = calculateReturnWindowExpiry(deliveredDate);
  const now = new Date(nowDate);
  return now.getTime() <= expiry.getTime();
}

/**
 * Calculates remaining business days left within the return window.
 * Returns 0 if expired, or the number of business days left (minimum 1 if still eligible).
 */
export function getRemainingReturnBusinessDays(
  deliveredDate: Date | string | number,
  nowDate: Date | string | number = new Date()
): number {
  const expiry = calculateReturnWindowExpiry(deliveredDate);
  const now = new Date(nowDate);

  if (now.getTime() > expiry.getTime()) {
    return 0;
  }

  let remaining = 0;
  // Start from the beginning of the next calendar day from 'now'
  const cursor = new Date(now.getTime());
  cursor.setDate(cursor.getDate() + 1);
  cursor.setHours(0, 0, 0, 0);

  while (cursor.getTime() <= expiry.getTime()) {
    if (isBusinessDay(cursor)) {
      remaining++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return Math.max(1, remaining);
}

