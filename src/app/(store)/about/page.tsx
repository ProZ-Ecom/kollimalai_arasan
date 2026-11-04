import type { Metadata } from "next";
import {
  AboutHeroSection,
  AboutOurStorySection,
  AboutPhilosophySection,
  AboutFounderSection,
} from "@/components/storefront/about";
import { SITE_NAME } from "@/lib/seo/site";
import {
  JsonLd,
  buildBreadcrumbSchema,
  buildOrganizationSchema,
} from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "About Kollimalai Arasan | Our Story & Products",
  description:
    "Learn about Kollimalai Arasan and our range of traditional spices and natural products from the Kolli Hills.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Kollimalai Arasan | Our Story & Products",
    description:
      "Learn about Kollimalai Arasan and our range of traditional spices and natural products from the Kolli Hills.",
    url: "/about",
    siteName: SITE_NAME,
    images: [
      {
        url: "/images/Aboutus_ourstory_img1.jpg",
        width: 1200,
        height: 630,
        alt: "About Kollimalai Arasan - Our Story & Products",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Kollimalai Arasan | Our Story & Products",
    description:
      "Learn about Kollimalai Arasan and our range of traditional spices and natural products from the Kolli Hills.",
    images: ["/images/Aboutus_ourstory_img1.jpg"],
  },
};

export default function AboutPage() {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about" },
  ]);
  const organizationSchema = buildOrganizationSchema();

  return (
    <div className="w-full">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={organizationSchema} />

      {/* 1. Hero Banner */}
      <AboutHeroSection />

      {/* 2. Our Story */}
      <AboutOurStorySection />

      {/* 3. Our Philosophy, Uniqueness, Mission & Vision */}
      <AboutPhilosophySection />

      {/* 4. The Woman Behind The Vision */}
      <AboutFounderSection />
    </div>
  );
}
