const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "\u20ac",
  GBP: "\u00a3",
  INR: "\u20b9",
  JPY: "\u00a5",
};

interface FormatCurrencyOptions {
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export function formatCurrency(
  amount: number,
  options: FormatCurrencyOptions = {}
): string {
  const {
    currency = "INR",
    locale = "en-IN",
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount);
  } catch {
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${amount.toFixed(minimumFractionDigits)}`;
  }
}
