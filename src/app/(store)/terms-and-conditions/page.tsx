import type { Metadata } from "next";
import Link from "next/link";
import { PolicyLayout } from "@/components/storefront/policy/PolicyLayout";
import {
  FileText,
  Shield,
  ShoppingBag,
  CreditCard,
  Truck,
  RotateCcw,
  Copyright,
  AlertTriangle,
  RefreshCw,
  Scale,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Terms & Conditions | Kollimalai Arasan",
  description:
    "Read the terms and conditions governing the use of the Kollimalai Arasan website, product purchases, shipping, and return policies.",
};

export default function TermsAndConditionsPage() {
  return (
    <PolicyLayout
      title="Terms & Conditions"
      lastUpdated="September 2026"
      icon={FileText}
    >
      {/* Introduction */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 font-serif">
          Introduction
        </h2>
        <p className="text-base sm:text-lg text-neutral-800 leading-relaxed font-medium">
          By accessing or using our website <Link href="/" className="text-primary-700 hover:underline">https://kollimalaiarasan.com/</Link>, you agree to be bound by the following terms and conditions.
        </p>
        <p className="text-neutral-700 leading-relaxed">
          Please read them carefully before proceeding with any purchase or interaction on our platform.
        </p>
      </section>

      {/* 1. Website Usage */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <Shield className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">1. Website Usage</h2>
        </div>
        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
          <li>Users are expected to use the website responsibly, ethically, and lawfully.</li>
          <li>All content is intended for informational and personal shopping purposes only.</li>
          <li>Any unauthorized use, scraping, reverse engineering, or disruption of our website is strictly prohibited.</li>
        </ul>
      </section>

      {/* 2. Product Information */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <ShoppingBag className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">2. Product Information</h2>
        </div>
        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
          <li>We strive to provide accurate, reliable, and up-to-date product details, origin information, and pricing.</li>
          <li>Prices and product availability are subject to change without prior notice.</li>
          <li>As products are 100% natural, single-origin agricultural harvests, product images are for representational purposes; natural variations in grain size, color, and aroma may occur.</li>
        </ul>
      </section>

      {/* 3. Orders & Payments */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <CreditCard className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">3. Orders &amp; Payments</h2>
        </div>
        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
          <li>Orders are confirmed and scheduled for dispatch only upon successful payment completion or confirmation of Cash on Delivery where applicable.</li>
          <li>We reserve the right to cancel orders under exceptional circumstances (e.g., inventory exhaustion, pricing errors, or suspicion of fraudulent activity), in which case any charged amounts will be refunded immediately.</li>
        </ul>
      </section>

      {/* 4. Shipping & Delivery */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <Truck className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">4. Shipping &amp; Delivery</h2>
        </div>
        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
          <li>Delivery timelines may vary based on shipping location, state regulations, and courier partner availability.</li>
          <li>Delays caused by external, logistical, climatic, or unforeseen factors beyond our direct control are regretfully not liable for punitive damages.</li>
        </ul>
      </section>

      {/* 5. Returns & Refunds */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <RotateCcw className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">5. Returns &amp; Refunds</h2>
        </div>
        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
          <li>Returns and replacements are accepted strictly in accordance with our <Link href="/return-refund-policy" className="text-primary-700 underline font-medium">Refund / Replacement Policy</Link>.</li>
          <li>Refunds will be processed back to the original payment source after proper physical or photographic verification of the claim.</li>
        </ul>
      </section>

      {/* 6. Intellectual Property */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <Copyright className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">6. Intellectual Property</h2>
        </div>
        <p className="text-neutral-700 leading-relaxed">
          All content published on this website — including text, brand trademarks, logos, graphics, illustrations, and images — is the exclusive property of <strong>Kollimalai Arasan</strong> and may not be reproduced, modified, distributed, or reused without prior written permission.
        </p>
      </section>

      {/* 7. Limitation of Liability */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <AlertTriangle className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">7. Limitation of Liability</h2>
        </div>
        <p className="text-neutral-700 leading-relaxed">
          We shall not be held responsible for:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
          <li>Any indirect, punitive, incidental, or consequential damages arising from the use or inability to use this website.</li>
          <li>Delivery delays caused by third-party logistics providers, courier strikes, or natural disruptions.</li>
        </ul>
      </section>

      {/* 8. Updates to Terms */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <RefreshCw className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">8. Updates to Terms</h2>
        </div>
        <p className="text-neutral-700 leading-relaxed">
          We reserve the right to update or modify these terms at any time. Continued use of the website following any posted modifications constitutes your acceptance of the revised terms and conditions.
        </p>
      </section>

      {/* 9. Governing Law */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <Scale className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">9. Governing Law</h2>
        </div>
        <p className="text-neutral-700 leading-relaxed">
          These terms and conditions are governed by and construed in accordance with the laws of India. Any legal disputes shall be subject to the exclusive jurisdiction of the competent courts in Tamil Nadu, India.
        </p>
      </section>
    </PolicyLayout>
  );
}
