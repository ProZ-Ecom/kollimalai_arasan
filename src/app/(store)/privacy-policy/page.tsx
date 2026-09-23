import type { Metadata } from "next";
import Link from "next/link";
import { PolicyLayout } from "@/components/storefront/policy/PolicyLayout";
import { Lock, ShieldCheck, Database, Cookie, Share2, UserCheck, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Kollimalai Arasan",
  description:
    "Learn how Kollimalai Arasan collects, uses, safeguards, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout
      title="Privacy Policy"
      lastUpdated="September 2026"
      icon={Lock}
    >
      {/* Introduction */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 font-serif">
          Introduction
        </h2>
        <p className="text-base sm:text-lg text-neutral-800 leading-relaxed font-medium">
          At <strong className="text-neutral-900 font-semibold">Kollimalai Arasan</strong> (<Link href="/" className="text-primary-700 hover:underline">https://kollimalaiarasan.com/</Link>), your privacy is our priority.
        </p>
        <p className="text-neutral-700 leading-relaxed">
          This policy outlines how we collect, use, and safeguard your personal information when you interact with our website, store, and services.
        </p>
      </section>

      {/* 1. Information We Collect */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <Database className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">1. Information We Collect</h2>
        </div>
        <p className="text-neutral-700 leading-relaxed">
          We may collect the following information from you:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
          <li><strong>Personal Details:</strong> Full name, phone number, and email address.</li>
          <li><strong>Delivery Details:</strong> Shipping address and billing address.</li>
          <li><strong>Payment Information:</strong> Payment transaction identifiers securely processed via authorized third-party payment gateways (we never store your raw card details or banking passwords).</li>
          <li><strong>Technical &amp; Usage Data:</strong> Website usage data including cookies, browser type, device information, and IP address.</li>
        </ul>
      </section>

      {/* 2. How We Use Your Information */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <ShieldCheck className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">2. How We Use Your Information</h2>
        </div>
        <p className="text-neutral-700 leading-relaxed">
          Your data is used strictly to:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
          <li>Process and fulfill your orders, packaging, and doorstep deliveries.</li>
          <li>Enhance and personalize your overall shopping and browsing experience.</li>
          <li>Send relevant order updates, tracking information, seasonal offers, and notifications.</li>
          <li>Maintain the security, safety, and integrity of our website and customer accounts.</li>
        </ul>
      </section>

      {/* 3. Data Protection */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <Lock className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">3. Data Protection</h2>
        </div>
        <p className="text-neutral-700 leading-relaxed">
          We implement rigorous, industry-standard security measures including SSL encryption and secure server protocols to protect your personal information from unauthorized access, misuse, loss, or disclosure.
        </p>
      </section>

      {/* 4. Cookies */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <Cookie className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">4. Cookies</h2>
        </div>
        <p className="text-neutral-700 leading-relaxed">
          Our website uses cookies to recognize your preferences and improve your browsing experience (e.g. keeping items in your shopping cart). You may disable cookies at any time through your browser settings, though this may affect certain features of the store.
        </p>
      </section>

      {/* 5. Third-Party Sharing */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <Share2 className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">5. Third-Party Sharing</h2>
        </div>
        <p className="text-neutral-700 leading-relaxed">
          <strong>We do not sell, rent, or trade your personal data to anyone.</strong> Information is shared only with trusted parties essential to our operations:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
          <li><strong>Payment Providers:</strong> Authorized payment gateways (e.g., Razorpay) to complete transactions safely.</li>
          <li><strong>Delivery Partners:</strong> Trusted courier and logistics partners for shipping your orders.</li>
          <li><strong>Legal Authorities:</strong> Government or statutory bodies, solely when required by applicable law.</li>
        </ul>
      </section>

      {/* 6. Your Rights */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <UserCheck className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">6. Your Rights</h2>
        </div>
        <p className="text-neutral-700 leading-relaxed">
          As a customer, you have full control over your data and the right to:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
          <li>Request access to your stored personal information.</li>
          <li>Request correction or deletion of your account and personal data.</li>
          <li>Opt out of promotional communications at any time.</li>
        </ul>
      </section>

      {/* 7. Contact Us */}
      <section className="space-y-3 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <Mail className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">7. Contact Us</h2>
        </div>
        <p className="text-neutral-700 leading-relaxed">
          If you have questions or concerns regarding this Privacy Policy or your personal information, please reach out to us:
        </p>
        <div className="bg-neutral-50 rounded-xl p-4 sm:p-5 border border-neutral-200/80 space-y-1 text-sm text-neutral-700">
          <p><strong className="text-neutral-900">Brand:</strong> Kollimalai Arasan</p>
          <p><strong className="text-neutral-900">Website:</strong> <Link href="/" className="text-primary-700 hover:underline">https://kollimalaiarasan.com/</Link></p>
          <p><strong className="text-neutral-900">Email:</strong> <a href="mailto:kollimalaiarasan@gmail.com" className="text-primary-700 hover:underline">kollimalaiarasan@gmail.com</a></p>
        </div>
      </section>
    </PolicyLayout>
  );
}
