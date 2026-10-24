import "server-only";
import { checkShiprocketServiceability } from "@/lib/shiprocket";
import {
  calculateShippingCharge,
  ShippingCalculationResult,
} from "./shipping-calculator";

/**
 * Server-only async shipping charge calculator that looks up live Shiprocket rates
 * when a valid 6-digit delivery pincode is provided.
 */
export async function calculateShippingChargeAsync(
  courierType: "st_courier" | "mss" | "shiprocket" = "st_courier",
  totalWeightKg: number = 0.5,
  deliveryPostcode?: string
): Promise<ShippingCalculationResult> {
  const safeWeight = Math.max(0.01, Number(totalWeightKg) || 0.5);

  if (
    courierType === "shiprocket" &&
    deliveryPostcode &&
    /^\d{6}$/.test(deliveryPostcode.trim())
  ) {
    try {
      const serviceability = await checkShiprocketServiceability({
        deliveryPostcode: deliveryPostcode.trim(),
        weightKg: safeWeight,
      });

      if (serviceability.isServiceable && serviceability.recommendedCourier?.rate) {
        const liveRate = Math.ceil(serviceability.recommendedCourier.rate);
        return {
          courierType: "shiprocket",
          courierName: serviceability.recommendedCourier.name
            ? `Shiprocket (${serviceability.recommendedCourier.name})`
            : "Shiprocket Express",
          totalWeightKg: Number(safeWeight.toFixed(3)),
          billableKg: Math.max(1, Math.ceil(safeWeight)),
          shippingCharge: liveRate,
          rateDescription: `Live quote via ${
            serviceability.recommendedCourier.name || "Shiprocket"
          } (${serviceability.recommendedCourier.etd || "2-5 days"})`,
        };
      }
    } catch (err) {
      console.warn(
        "[ServerShippingCalculator] Shiprocket live rate check failed, falling back to flat rate:",
        err
      );
    }
  }

  return calculateShippingCharge(courierType, safeWeight);
}
