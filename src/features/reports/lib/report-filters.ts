import { db } from "@/lib/db/prisma";

/** Extracts trimmed non-empty query params for report API handlers. */
export function readQuery<K extends string>(
  searchParams: URLSearchParams | undefined,
  keys: readonly K[]
): Partial<Record<K, string>> {
  const out: Partial<Record<K, string>> = {};
  if (!searchParams) return out;
  for (const k of keys) {
    const v = searchParams.get(k)?.trim();
    if (v) out[k] = v;
  }
  return out;
}

/**
 * Resolves a category reference (uuid, slug, or numeric id) to product_categories.id.
 * Returns null when omitted, or BigInt(0) when unknown so queries return empty instead of all rows.
 */
export async function resolveCategoryFilter(ref?: string | null): Promise<bigint | null> {
  if (!ref) return null;
  const row = await db.productCategory.findFirst({
    where: {
      OR: [
        { uuid: ref },
        { slug: ref },
        ...(/^\d+$/.test(ref) ? [{ id: BigInt(ref) }] : []),
      ],
    },
    select: { id: true },
  });
  return row?.id ?? BigInt(0);
}

/** Resolves a brand reference (uuid, slug, or numeric id) to product_brands.id. */
export async function resolveBrandFilter(ref?: string | null): Promise<bigint | null> {
  if (!ref) return null;
  const row = await db.productBrand.findFirst({
    where: {
      OR: [
        { uuid: ref },
        { slug: ref },
        ...(/^\d+$/.test(ref) ? [{ id: BigInt(ref) }] : []),
      ],
    },
    select: { id: true },
  });
  return row?.id ?? BigInt(0);
}

/** Resolves a coupon reference (uuid, code, or numeric id) to coupons.id. */
export async function resolveCouponFilter(ref?: string | null): Promise<bigint | null> {
  if (!ref) return null;
  const row = await db.coupon.findFirst({
    where: {
      OR: [
        { uuid: ref },
        { code: ref },
        ...(/^\d+$/.test(ref) ? [{ id: BigInt(ref) }] : []),
      ],
    },
    select: { id: true },
  });
  return row?.id ?? BigInt(0);
}

/** Resolves a payment method reference (code or numeric id) to payment_methods.id. */
export async function resolvePaymentMethodFilter(ref?: string | null): Promise<bigint | null> {
  if (!ref) return null;
  const row = await db.payment_methods.findFirst({
    where: {
      OR: [
        { code: ref },
        ...(/^\d+$/.test(ref) ? [{ id: BigInt(ref) }] : []),
      ],
    },
    select: { id: true },
  });
  return row?.id ?? BigInt(0);
}

/** Resolves a delivery partner reference (code or numeric id) to delivery_partners.id. */
export async function resolveDeliveryPartnerFilter(ref?: string | null): Promise<bigint | null> {
  if (!ref) return null;
  const row = await db.delivery_partners.findFirst({
    where: {
      OR: [
        { code: ref },
        ...(/^\d+$/.test(ref) ? [{ id: BigInt(ref) }] : []),
      ],
    },
    select: { id: true },
  });
  return row?.id ?? BigInt(0);
}
