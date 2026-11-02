import type { Metadata } from "next";
import { ShopAllClient } from "./ShopAllClient";
import { SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/seo/site";
import { JsonLd, buildBreadcrumbSchema } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "Shop Spices & Natural Products Online | Kollimalai Arasan",
  description:
    "Explore our collection of authentic Kolli Hills spices and natural products. Discover black pepper, cardamom, cloves, natural honey and traditional food products.",
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "Shop Spices & Natural Products Online | Kollimalai Arasan",
    description:
      "Explore our collection of authentic Kolli Hills spices and natural products. Discover black pepper, cardamom, cloves, natural honey and traditional food products.",
    url: "/products",
    siteName: SITE_NAME,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Shop Spices & Natural Products - Kollimalai Arasan",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop Spices & Natural Products Online | Kollimalai Arasan",
    description:
      "Explore our collection of authentic Kolli Hills spices and natural products. Discover black pepper, cardamom, cloves, natural honey and traditional food products.",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function ShopAllPage() {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Shop All Products", path: "/products" },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <ShopAllClient />
    </>
  );
}
