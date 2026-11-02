/**
 * Site-wide SEO constants and helpers.
 * Ensures consistent canonical URLs, absolute OG image paths, and description sanitization.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://kollimalaiarasan.com"
).replace(/\/+$/, "");

export const SITE_NAME = "Kollimalai Arasan";

export const DEFAULT_OG_IMAGE = "/images/kolli_spices_hero.jpg";

/**
 * Returns an absolute URL for a given relative path.
 * If the path is already absolute, it returns the path untouched.
 */
export function absoluteUrl(path?: string | null): string {
  if (!path) return `${SITE_URL}${DEFAULT_OG_IMAGE}`;
  const trimmed = path.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const clean = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${SITE_URL}${clean}`;
}

/**
 * Cleans, strips HTML tags, and truncates text to an SEO-friendly length (default 160 chars).
 */
export function cleanDescription(
  text?: string | null,
  fallback = "Discover authentic spices and natural products from Kolli Hills at Kollimalai Arasan.",
  maxLength = 160
): string {
  if (!text) return fallback;
  const stripped = text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!stripped) return fallback;
  if (stripped.length <= maxLength) return stripped;

  const truncated = stripped.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > 100 ? `${truncated.slice(0, lastSpace)}...` : `${truncated}...`;
}

