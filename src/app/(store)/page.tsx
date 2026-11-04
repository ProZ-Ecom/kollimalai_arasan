
import type { Metadata } from "next";
import {
  HeroSlider,
  BrandPromise,
  ProductSection,
  LowestPrice,
  WhyChooseUs,
  Features,
  Feedback,
  OfferPopup,
  OfferReels,
} from "@/components/storefront";
import { SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/seo/site";
import {
  JsonLd,
  buildWebSiteSchema,
  buildOrganizationSchema,
} from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "Kollimalai Arasan | Pure Kolli Hills Spices & Natural Products",
  description:
    "Discover authentic spices and natural products from Kolli Hills at Kollimalai Arasan. Explore black pepper, cardamom, cloves and traditional food products.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Kollimalai Arasan | Pure Kolli Hills Spices & Natural Products",
    description:
      "Discover authentic spices and natural products from Kolli Hills at Kollimalai Arasan. Explore black pepper, cardamom, cloves and traditional food products.",
    url: "/",
    siteName: SITE_NAME,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Kollimalai Arasan | Pure Kolli Hills Spices & Natural Products",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kollimalai Arasan | Pure Kolli Hills Spices & Natural Products",
    description:
      "Discover authentic spices and natural products from Kolli Hills at Kollimalai Arasan. Explore black pepper, cardamom, cloves and traditional food products.",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function HomePage() {
  const websiteSchema = buildWebSiteSchema();
  const organizationSchema = buildOrganizationSchema();

  return (
    <div className="pb-16 lg:pb-0 bg-white">
      <JsonLd data={websiteSchema} />
      <JsonLd data={organizationSchema} />
      <OfferPopup />
      <HeroSlider />
      <BrandPromise />
      <OfferReels />
      <ProductSection title="Freshly Launched" accent="Flavours" />
      <WhyChooseUs />
      <LowestPrice />
      <Features />
      <Feedback />
    </div>
  );
}
