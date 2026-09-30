import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Named date shapes used across the app. Each call site used to hand-roll its
 * own Intl options (there were eight near-identical `formatDate` helpers), so
 * the presets live here and differences are passed as options instead.
 */
export type DateStyle = "long" | "medium" | "datetime" | "input";

const DATE_STYLE_OPTIONS: Record<
  Exclude<DateStyle, "input">,
  Intl.DateTimeFormatOptions
> = {
  long: { year: "numeric", month: "long", day: "numeric" },
  medium: { year: "numeric", month: "short", day: "numeric" },
  datetime: {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
};

export interface FormatDateOptions {
  /** Preset shape. Defaults to "long", matching this helper's original output. */
  style?: DateStyle;
  locale?: string;
  /** Returned for null/undefined/unparseable input. */
  fallback?: string;
  /** Escape hatch for one-off shapes (e.g. a 2-digit day). Wins over `style`. */
  dateOptions?: Intl.DateTimeFormatOptions;
}

export function formatDate(
  date: Date | string | number | null | undefined,
  options: FormatDateOptions = {}
): string {
  const {
    style = "long",
    locale = "en-IN",
    fallback = "",
    dateOptions,
  } = options;

  if (date === null || date === undefined || date === "") return fallback;

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return fallback;

  // `datetime-local` inputs want local wall-clock time, not the UTC string
  // toISOString() produces, so shift by the offset before slicing.
  if (style === "input" && !dateOptions) {
    const offsetMs = parsed.getTimezoneOffset() * 60 * 1000;
    return new Date(parsed.getTime() - offsetMs).toISOString().slice(0, 16);
  }

  try {
    return new Intl.DateTimeFormat(
      locale,
      dateOptions ?? DATE_STYLE_OPTIONS[style === "input" ? "medium" : style]
    ).format(parsed);
  } catch {
    return parsed.toLocaleDateString(locale);
  }
}

/** Convenience wrapper - the date/time shape used by order and review views. */
export function formatDateTime(
  date: Date | string | number | null | undefined,
  options: Omit<FormatDateOptions, "style"> = {}
): string {
  return formatDate(date, { ...options, style: "datetime" });
}

export interface FormatPriceOptions {
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export function formatPrice(
  amount: number,
  currencyOrOptions: string | FormatPriceOptions = "INR"
): string {
  const options =
    typeof currencyOrOptions === "string"
      ? { currency: currencyOrOptions }
      : currencyOrOptions;
  const { currency = "INR", locale = "en-IN" } = options;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    ...(options.minimumFractionDigits !== undefined && {
      minimumFractionDigits: options.minimumFractionDigits,
    }),
    ...(options.maximumFractionDigits !== undefined && {
      maximumFractionDigits: options.maximumFractionDigits,
    }),
  }).format(amount);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateOrderNumber(): string {
  const date = new Date();
  const prefix = "RS";
  const timestamp = date.getFullYear().toString().slice(-2) +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function getImageUrl(path: string | null | undefined): string {
  const trimmed = path?.trim();
  if (!trimmed) return "/images/placeholder.png";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
    return trimmed;
  }
  return `/${trimmed}`;
}

export function calculateDiscountPrice(
  price: number,
  discountPercent: number
): number {
  return price - (price * discountPercent) / 100;
}

export function formatTitleCase(str?: string | null): string {
  if (!str) return "";
  return str
    .trim()
    .replace(/\s+/g, " ")
    .replace(/(?:^|\s|-|\/)([a-z])/g, (match) => match.toUpperCase());
}

export const toTitleCase = formatTitleCase;

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
