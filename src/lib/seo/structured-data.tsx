import React from "react";
import { SITE_NAME, SITE_URL, absoluteUrl, DEFAULT_OG_IMAGE, cleanDescription } from "./site";
import type { CustomerProductDetailDto } from "@/features/customers/types/catalog.types";

/**
 * Universal JSON-LD Structured Data Script Component.
 */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Array<Record<string, unknown>> | null | undefined;
}) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Generates WebSite Schema for SearchAction.
 */
export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Discover authentic spices and natural products from Kolli Hills at Kollimalai Arasan. Explore black pepper, cardamom, cloves and traditional food products.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generates OnlineStore / Organization Schema using actual business information.
 */
export function buildOrganizationSchema(company?: {
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
} | null) {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: company?.companyName || SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/logo.svg"),
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    description:
      "Discover authentic spices and natural products from Kolli Hills at Kollimalai Arasan. Farm-fresh, traditional quality delivered straight to your kitchen.",
    telephone: company?.phone || "+91 74181 88950",
    email: company?.email || "kollimalaiarasan@gmail.com",
    address: {
      "@type": "PostalAddress",
      streetAddress:
        company?.address ||
        "18/41, MGR Nagar, Sakkarai Patti, Valavanthi Nadu, Semmedu Post",
      addressLocality: company?.city || "Kolli Hills, Namakkal",
      addressRegion: company?.state || "Tamil Nadu",
      postalCode: company?.pincode || "637411",
      addressCountry: "IN",
    },
    priceRange: "₹₹",
  };
}

/**
 * Generates BreadcrumbList Schema.
 */
export function buildBreadcrumbSchema(
  items: { name: string; path: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/**
 * Generates Product Schema using actual product and variant data.
 */
export function buildProductSchema(
  product: CustomerProductDetailDto,
  canonicalPath?: string
) {
  const images = (product.images && product.images.length > 0)
    ? product.images.map((img) => absoluteUrl(img.imageUrl))
    : product.image
    ? [absoluteUrl(product.image)]
    : [absoluteUrl(DEFAULT_OG_IMAGE)];

  const primaryVariant =
    product.variants?.find((v) => v.isDefault) ?? product.variants?.[0] ?? null;

  const price = primaryVariant?.salePrice || primaryVariant?.basePrice || 0;
  const isOutOfStock = Boolean(primaryVariant?.outOfStock);
  const sku = primaryVariant?.sku || product.id;
  const description = cleanDescription(
    product.description || primaryVariant?.shortDescription,
    `Buy authentic ${product.name} online from Kollimalai Arasan. Sourced directly from Kolli Hills.`
  );

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: images,
    description,
    sku,
    brand: {
      "@type": "Brand",
      name: product.brand?.name || SITE_NAME,
    },
    ...(product.category?.name ? { category: product.category.name } : {}),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(canonicalPath || `/products/${product.id}`),
      priceCurrency: "INR",
      price: price > 0 ? price.toFixed(2) : undefined,
      itemCondition: "https://schema.org/NewCondition",
      availability: isOutOfStock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
      },
    },
  };
}

