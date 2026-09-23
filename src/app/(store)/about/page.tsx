import { Metadata } from "next";
import {
  AboutHeroSection,
  AboutOurStorySection,
  AboutPhilosophySection,
  AboutFounderSection,
} from "@/components/storefront/about";

export const metadata: Metadata = {
  title: "About Us - Kollimalai Arasan | 100% Organic Farm from Kolli Hills",
  description:
    "Learn about Kollimalai Arasan, bringing you 100% certified organic coffee, spices, millets, and fruits directly from our single-origin farm in Kolli Hills, Tamil Nadu.",
};

export default function AboutPage() {
  return (
    <div className="w-full">
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
