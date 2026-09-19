import { Metadata } from "next";
import {
  AboutHeroSection,
  AboutOurStorySection,
  AboutFounderSection,
} from "@/components/storefront/about";

export const metadata: Metadata = {
  title: "About Us - Kollimalai Arasan | Tradition & Purity from Kolli Hills",
  description:
    "Learn about Kollimalai Arasan, bringing you authentic, pure, and traditional organic products directly from the pristine hills of Kolli Hills, Tamil Nadu.",
};

export default function AboutPage() {
  return (
    <div className="w-full">
      {/* 1. Hero Banner: Tradition in Every Bite */}
      <AboutHeroSection />

      {/* 2. Our Story: Rooted in tradition, growing with purpose */}
      <AboutOurStorySection />

      {/* 3. The Woman Behind The Vision: Dr. S. Anita */}
      <AboutFounderSection />
    </div>
  );
}
