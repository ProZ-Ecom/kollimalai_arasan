import type { Metadata } from "next";
import { ContactClient } from "./ContactClient";
import { SITE_NAME, DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/seo/site";
import { JsonLd, buildBreadcrumbSchema } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "Contact Kollimalai Arasan | Customer Support",
  description:
    "Get in touch with Kollimalai Arasan for product enquiries, orders, customer support and other assistance.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Kollimalai Arasan | Customer Support",
    description:
      "Get in touch with Kollimalai Arasan for product enquiries, orders, customer support and other assistance.",
    url: "/contact",
    siteName: SITE_NAME,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Contact Kollimalai Arasan",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Kollimalai Arasan | Customer Support",
    description:
      "Get in touch with Kollimalai Arasan for product enquiries, orders, customer support and other assistance.",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function ContactPage() {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Contact Us", path: "/contact" },
  ]);

  const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Kollimalai Arasan",
    url: `${SITE_URL}/contact`,
    description:
      "Get in touch with Kollimalai Arasan for product enquiries, orders, customer support and other assistance.",
    mainEntity: {
      "@type": "OnlineStore",
      name: SITE_NAME,
      telephone: "+91 74181 88950",
      email: "kollimalaiarasan@gmail.com",
    },
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={contactPageSchema} />
      <ContactClient />
    </>
  );
}
