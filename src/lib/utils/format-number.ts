interface FormatNumberOptions {
  locale?: string;
  style?: "decimal" | "currency" | "percent";
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export function formatNumber(
  num: number,
  options: FormatNumberOptions = {}
): string {
  const {
    locale = "en-IN",
    style = "decimal",
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    ...rest
  } = options;

  try {
    return new Intl.NumberFormat(locale, {
      style,
      minimumFractionDigits,
      maximumFractionDigits,
      ...rest,
    }).format(num);
  } catch {
    return num.toString();
  }
}

export function formatCompactNumber(num: number, locale = "en-IN"): string {
  try {
    return new Intl.NumberFormat(locale, {
      notation: "compact",
      compactDisplay: "short",
    }).format(num);
  } catch {
    return num.toString();
  }
}
