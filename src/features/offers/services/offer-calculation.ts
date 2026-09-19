import type {
  ApplicableOffer,
  OfferBreakdown,
  OfferComputedStatus,
  OfferPricingLine,
  OfferPricingResult,
} from "../types";

/**
 * Pure offer maths. No database, no framework - this module is the single
 * source of truth for "what does this line actually cost", and is called from
 * the product listing, product detail, cart, checkout and order creation so
 * those four surfaces can never disagree.
 */

/** Money is compared and stored to paise, so normalise every result. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeOfferStatus(
  offer: { isActive: boolean; startsAt: Date | null; endsAt: Date | null },
  now: Date = new Date()
): OfferComputedStatus {
  if (!offer.isActive) return "inactive";
  if (offer.endsAt && offer.endsAt.getTime() < now.getTime()) return "expired";
  if (offer.startsAt && offer.startsAt.getTime() > now.getTime()) return "scheduled";
  return "active";
}

/** An offer is live when it is switched on *and* now sits inside its window. */
export function isOfferLive(offer: ApplicableOffer, now: Date = new Date()): boolean {
  return computeOfferStatus(offer, now) === "active";
}

export function toOfferBreakdown(offer: ApplicableOffer): OfferBreakdown {
  return {
    id: offer.id,
    name: offer.name,
    code: offer.code,
    level: offer.level,
    type: offer.type,
    value: offer.value,
    buyQuantity: offer.buyQuantity,
    getQuantity: offer.getQuantity,
    minQuantity: offer.minQuantity,
    terms: offer.terms,
    startsAt: offer.startsAt ? offer.startsAt.toISOString() : null,
    endsAt: offer.endsAt ? offer.endsAt.toISOString() : null,
  };
}

export interface OfferEvaluationContext {
  /** Cart subtotal at base prices, for `minCartValue` gating. */
  cartValue?: number;
  now?: Date;
}

export interface LineDiscount {
  /** Money off the whole line (all units), before rounding into the result. */
  discountAmount: number;
  /** Units handed over free by a Buy X Get Y offer. */
  freeQuantity: number;
}

/**
 * What this one offer takes off this one line, or `null` when the offer does
 * not qualify. Never returns more than the line is worth, and never negative.
 */
export function calculateLineDiscount(
  offer: ApplicableOffer,
  line: OfferPricingLine,
  context: OfferEvaluationContext = {}
): LineDiscount | null {
  const now = context.now ?? new Date();
  if (!isOfferLive(offer, now)) return null;

  const unitPrice = Number(line.unitPrice);
  const quantity = Number(line.quantity);
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) return null;
  if (!Number.isFinite(quantity) || quantity <= 0) return null;

  // Gate: the shopper has to have bought enough of it.
  if (quantity < offer.minQuantity) return null;

  // Gate: the cart has to be big enough. An unknown cart value (product
  // listing, where there is no cart yet) does not block the offer - it is
  // re-checked with the real subtotal at cart/checkout time.
  if (
    offer.minCartValue != null &&
    context.cartValue != null &&
    context.cartValue < offer.minCartValue
  ) {
    return null;
  }

  // `maxQuantity` caps how many units the offer touches, it does not
  // disqualify the line - the surplus units simply pay full price.
  const eligibleQuantity =
    offer.maxQuantity != null ? Math.min(quantity, offer.maxQuantity) : quantity;
  if (eligibleQuantity <= 0) return null;

  const lineTotal = unitPrice * quantity;
  const eligibleTotal = unitPrice * eligibleQuantity;

  let discountAmount = 0;
  let freeQuantity = 0;

  switch (offer.type) {
    case "percentage": {
      discountAmount = (eligibleTotal * offer.value) / 100;
      break;
    }

    case "flat": {
      // A flat offer is per unit, so a 2-pack of a ₹20-off item saves ₹40.
      discountAmount = offer.value * eligibleQuantity;
      break;
    }

    case "special_price": {
      // Selling above the current price is not a discount - ignore it rather
      // than charging the shopper more.
      if (offer.value >= unitPrice) return null;
      discountAmount = (unitPrice - offer.value) * eligibleQuantity;
      break;
    }

    case "bxgy": {
      const buy = offer.buyQuantity ?? 0;
      const get = offer.getQuantity ?? 0;
      if (buy <= 0 || get <= 0) return null;
      // Every full "buy + get" group earns `get` free units; a trailing
      // partial group earns nothing.
      const groupSize = buy + get;
      const fullGroups = Math.floor(eligibleQuantity / groupSize);
      const remainder = eligibleQuantity % groupSize;
      // A remainder that already covers the buy leg earns its free units too.
      const remainderFree = remainder > buy ? Math.min(remainder - buy, get) : 0;
      freeQuantity = fullGroups * get + remainderFree;
      if (freeQuantity <= 0) return null;
      discountAmount = freeQuantity * unitPrice;
      break;
    }

    default:
      return null;
  }

  // Cap: never exceed the configured ceiling...
  if (offer.maxDiscountAmount != null && offer.maxDiscountAmount > 0) {
    discountAmount = Math.min(discountAmount, offer.maxDiscountAmount);
  }

  // ...and never exceed what the line is worth, so a mis-configured flat
  // discount can't drive a line negative.
  discountAmount = Math.min(discountAmount, lineTotal);

  if (discountAmount <= 0) return null;

  return { discountAmount: roundMoney(discountAmount), freeQuantity };
}

/**
 * Resolve the one offer that wins for a line, in this order:
 *   1. item-level beats product-level (the more specific offer wins);
 *   2. higher `priority` beats lower;
 *   3. the bigger discount breaks the remaining tie.
 *
 * Offers are never stacked - exactly one applies per line.
 */
export function selectBestOffer(
  offers: ApplicableOffer[],
  line: OfferPricingLine,
  context: OfferEvaluationContext = {}
): { offer: ApplicableOffer; discount: LineDiscount } | null {
  let best: { offer: ApplicableOffer; discount: LineDiscount } | null = null;

  for (const offer of offers) {
    const discount = calculateLineDiscount(offer, line, context);
    if (!discount) continue;

    if (!best) {
      best = { offer, discount };
      continue;
    }

    const levelRank = (o: ApplicableOffer) => (o.level === "item" ? 1 : 0);
    const levelDelta = levelRank(offer) - levelRank(best.offer);
    if (levelDelta !== 0) {
      if (levelDelta > 0) best = { offer, discount };
      continue;
    }

    const priorityDelta = offer.priority - best.offer.priority;
    if (priorityDelta !== 0) {
      if (priorityDelta > 0) best = { offer, discount };
      continue;
    }

    if (discount.discountAmount > best.discount.discountAmount) {
      best = { offer, discount };
    }
  }

  return best;
}

/** Full pricing for one line, whether or not any offer ends up applying. */
export function priceLine(
  offers: ApplicableOffer[],
  line: OfferPricingLine,
  context: OfferEvaluationContext = {}
): OfferPricingResult {
  const unitPrice = roundMoney(Number(line.unitPrice) || 0);
  const quantity = Number(line.quantity) || 0;
  const originalLineTotal = roundMoney(unitPrice * quantity);

  const best = selectBestOffer(offers, line, context);

  if (!best) {
    const promoOffer = offers.find((o) => isOfferLive(o, context.now ?? new Date()));
    return {
      itemId: line.itemId,
      quantity,
      originalPrice: unitPrice,
      finalPrice: unitPrice,
      originalLineTotal,
      finalLineTotal: originalLineTotal,
      discountAmount: 0,
      discountPercent: 0,
      offerApplied: false,
      offer: promoOffer ? toOfferBreakdown(promoOffer) : null,
      freeQuantity: 0,
    };
  }

  const discountAmount = roundMoney(best.discount.discountAmount);
  const finalLineTotal = roundMoney(originalLineTotal - discountAmount);

  return {
    itemId: line.itemId,
    quantity,
    originalPrice: unitPrice,
    // Effective per-unit price. For a special price on a full-quantity line
    // this lands exactly on the configured price; when a cap or a BXGY split
    // is involved it is the honest blended rate.
    finalPrice: quantity > 0 ? roundMoney(finalLineTotal / quantity) : unitPrice,
    originalLineTotal,
    finalLineTotal,
    discountAmount,
    discountPercent:
      originalLineTotal > 0
        ? Math.round((discountAmount / originalLineTotal) * 100)
        : 0,
    offerApplied: true,
    offer: toOfferBreakdown(best.offer),
    freeQuantity: best.discount.freeQuantity,
  };
}

export interface CartPricingResult {
  lines: OfferPricingResult[];
  subtotal: number;
  totalDiscount: number;
  total: number;
  totalSavings: number;
}

/**
 * Price a whole cart. `minCartValue` is measured against the base-price
 * subtotal so the set of qualifying offers doesn't depend on the order the
 * lines happen to be evaluated in.
 */
export function priceCart(
  lines: OfferPricingLine[],
  offersByItemId: Map<string, ApplicableOffer[]>,
  context: OfferEvaluationContext = {}
): CartPricingResult {
  const subtotal = roundMoney(
    lines.reduce((sum, line) => sum + Number(line.unitPrice) * Number(line.quantity), 0)
  );

  const evaluationContext: OfferEvaluationContext = {
    now: context.now,
    cartValue: context.cartValue ?? subtotal,
  };

  const priced = lines.map((line) =>
    priceLine(offersByItemId.get(line.itemId) ?? [], line, evaluationContext)
  );

  const totalDiscount = roundMoney(
    priced.reduce((sum, line) => sum + line.discountAmount, 0)
  );

  return {
    lines: priced,
    subtotal,
    totalDiscount,
    total: roundMoney(subtotal - totalDiscount),
    totalSavings: totalDiscount,
  };
}
