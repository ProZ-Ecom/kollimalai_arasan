export interface ShippingCalculationResult {
  courierType: "st_courier" | "mss";
  courierName: string;
  totalWeightKg: number;
  billableKg: number;
  shippingCharge: number;
  rateDescription: string;
}

export function calculateVariantWeightKg(unitPrice?: {
  weight_kg?: number | string | any;
  unit_value?: number | string | any;
  product_units?: { code?: string; name?: string } | null;
} | null): number {
  if (!unitPrice) return 0.5;

  const rawWeight = Number(unitPrice.weight_kg);

  // Derive weight from unit_value and product_units code/name if possible
  const unitCode =
    unitPrice.product_units?.code?.toLowerCase() ||
    unitPrice.product_units?.name?.toLowerCase();
  const unitVal = Number(unitPrice.unit_value);

  if (!isNaN(unitVal) && unitVal > 0 && unitCode) {
    if (unitCode === "mg") {
      return Number((unitVal / 1000000).toFixed(6));
    }
    if (
      unitCode === "g" ||
      unitCode === "gm" ||
      unitCode === "gram" ||
      unitCode === "grams" ||
      unitCode === "ml"
    ) {
      return Number((unitVal / 1000).toFixed(3));
    }
    if (
      unitCode === "kg" ||
      unitCode === "kilogram" ||
      unitCode === "kilograms" ||
      unitCode === "l" ||
      unitCode === "litre" ||
      unitCode === "liter"
    ) {
      return Number(unitVal.toFixed(3));
    }
  }

  // If weight_kg is explicitly customized and not 0.5 default
  if (!isNaN(rawWeight) && rawWeight > 0) {
    return rawWeight;
  }

  return 0.5;
}

/**
 * Calculate shipping charges according to courier rules:
 * - ST Courier: ₹40 per kg (1kg -> ₹40, 2kg -> ₹80, 3kg -> ₹120, etc.)
 * - MSS (Mettur Super Services): ₹200 flat for 1 - 20 kg
 * Note: Free shipping is completely eliminated.
 */
export function calculateShippingCharge(
  courierType: "st_courier" | "mss" = "st_courier",
  totalWeightKg: number = 0.5
): ShippingCalculationResult {
  const safeWeight = Math.max(0.01, Number(totalWeightKg) || 0.5);

  if (courierType === "mss") {
    // 1 to 20 kg -> ₹200 flat
    const blocks = Math.max(1, Math.ceil(safeWeight / 20));
    const shippingCharge = blocks * 200;
    return {
      courierType: "mss",
      courierName: "Mettur Super Services (MSS)",
      totalWeightKg: Number(safeWeight.toFixed(3)),
      billableKg: Math.ceil(safeWeight),
      shippingCharge,
      rateDescription: blocks === 1 ? "₹200 (1 - 20 kg)" : `₹${shippingCharge} (${blocks} × 20 kg)`,
    };
  }

  // ST Courier: within 1kg -> ₹40, above 1kg -> ceil(kg) * 40
  const billableKg = Math.max(1, Math.ceil(safeWeight));
  const shippingCharge = billableKg * 40;

  return {
    courierType: "st_courier",
    courierName: "ST Courier",
    totalWeightKg: Number(safeWeight.toFixed(3)),
    billableKg,
    shippingCharge,
    rateDescription: `₹${shippingCharge} (₹40 × ${billableKg} kg)`,
  };
}
