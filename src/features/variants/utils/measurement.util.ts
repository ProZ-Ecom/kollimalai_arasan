export type MeasurementType = "weight" | "volume" | "count";

export interface VariantMeasurement {
  type: MeasurementType;
  unit: string;
  unitId: string | null;
  value: number;
}

export interface MeasurementFieldConfig {
  type: MeasurementType;
  label: string;
  placeholder: string;
  helperText: string;
  unitBadge: string;
  validationMessage: string;
}

export function formatVariantMeasurement(
  unit: { id?: string | bigint | number | null; uuid?: string | null; type?: string | null; code?: string | null } | null | undefined,
  unitValue: number | bigint | unknown,
  explicitUnitId?: string | null
): VariantMeasurement {
  const rawType = unit?.type ? String(unit.type).toLowerCase() : "count";
  const type: MeasurementType =
    rawType === "weight" || rawType === "volume" || rawType === "count"
      ? (rawType as MeasurementType)
      : "count";

  const resolvedUnitId = explicitUnitId ?? (unit?.uuid || (unit?.id ? String(unit.id) : null));

  return {
    type,
    unit: unit?.code || "",
    unitId: resolvedUnitId,
    value: unitValue !== null && unitValue !== undefined ? Number(unitValue) : 0,
  };
}

/**
 * Human-readable pack-size label for a measurement, e.g. "250 g", "1 kg".
 * Mirrors the `${value} ${unit}` convention already used across the admin
 * variant UI (VariantCard, VariantUnitPriceList, VariantPriceHistoryCard).
 */
export function formatMeasurementLabel(measurement: VariantMeasurement | null | undefined): string {
  if (!measurement) return "";
  const value = measurement.value ?? 0;
  const unit = measurement.unit ?? "";
  return unit ? `${value} ${unit}` : `${value}`;
}

export function getMeasurementFieldConfig(
  unit?: { type?: string | null; code?: string | null; name?: string | null } | null
): MeasurementFieldConfig {
  if (!unit) {
    return {
      type: "weight",
      label: "Measurement Value",
      placeholder: "e.g. 500, 1",
      helperText: "Select a unit to specify measurement",
      unitBadge: "",
      validationMessage: "Measurement value is required and must be greater than 0",
    };
  }

  const rawType = unit.type ? String(unit.type).toLowerCase() : "";
  const type: MeasurementType =
    rawType === "weight" || rawType === "volume" || rawType === "count"
      ? (rawType as MeasurementType)
      : "weight";

  const unitCode = unit.code || "";
  const unitName = unit.name || "";

  switch (type) {
    case "weight":
      return {
        type: "weight",
        label: unitCode ? `Weight (${unitCode})` : "Weight",
        placeholder: unitCode.toLowerCase() === "g" || unitCode.toLowerCase() === "gm" ? "e.g. 500" : "e.g. 1, 2",
        helperText: `Specify the weight in ${unitName ? unitName.toLowerCase() : unitCode}`,
        unitBadge: unitCode || unitName,
        validationMessage: "Weight is required and must be greater than 0",
      };
    case "volume":
      return {
        type: "volume",
        label: unitCode ? `Volume (${unitCode})` : "Volume",
        placeholder: unitCode.toLowerCase() === "ml" ? "e.g. 500" : "e.g. 1, 2",
        helperText: `Specify the volume in ${unitName ? unitName.toLowerCase() : unitCode}`,
        unitBadge: unitCode || unitName,
        validationMessage: "Volume is required and must be greater than 0",
      };
    case "count":
      return {
        type: "count",
        label: unitCode ? `Quantity (${unitCode})` : "Quantity",
        placeholder: "e.g. 1, 6, 12",
        helperText: `Specify the quantity in ${unitName ? unitName.toLowerCase() : unitCode}`,
        unitBadge: unitCode || unitName,
        validationMessage: "Quantity is required and must be greater than 0",
      };
    default:
      return {
        type: "weight",
        label: "Measurement Value",
        placeholder: "e.g. 500, 1",
        helperText: "Enter the measurement value",
        unitBadge: unitCode || unitName,
        validationMessage: "Measurement value is required and must be greater than 0",
      };
  }
}

