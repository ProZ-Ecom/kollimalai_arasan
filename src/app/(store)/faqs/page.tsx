import type { Metadata } from "next";
import { FaqSection } from "@/components/storefront/faq";

export const metadata: Metadata = {
  title: "FAQs - Kollimalai Arasan | Orders, Quality & Delivery",
  description:
    "Answers to common questions about delivery, organic ingredients, packaging, bulk orders, returns and cancellations at Kollimalai Arasan.",
};

export default function FaqPage() {
  return <FaqSection />;
}
