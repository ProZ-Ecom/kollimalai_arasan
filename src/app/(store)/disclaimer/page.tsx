import type { Metadata } from "next";
import Link from "next/link";
import { PolicyLayout } from "@/components/storefront/policy/PolicyLayout";
import {
  AlertCircle,
  Leaf,
  ExternalLink,
  ShieldAlert,
  CheckSquare,
  RefreshCw,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Disclaimer Policy | Kollimalai Arasan",
  description:
    "Read the official disclaimer policy for Kollimalai Arasan organic farm products, health representations, and external links.",
};

export default function DisclaimerPolicyPage() {
  return (
    <PolicyLayout
      title="Disclaimer Policy"
      lastUpdated="September 2026"
      icon={AlertCircle}
    >
      {/* Introduction */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 font-serif">
          Introduction
        </h2>
        <p className="text-base sm:text-lg text-neutral-800 leading-relaxed font-medium">
          The information provided on <Link href="/" className="text-primary-700 hover:underline">https://kollimalaiarasan.com/</Link> is intended for general informational and shopping purposes only.
        </p>
        <p className="text-neutral-700 leading-relaxed">
          While we make every effort to ensure the accuracy and reliability of all information on our store, <strong>Kollimalai Arasan</strong> makes no warranties or representations of any kind regarding the completeness, accuracy, or suitability of the information presented.
        </p>
      </section>

      {/* 1. Product Disclaimer */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <Leaf className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">1. Product Disclaimer</h2>
        </div>
        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
          <li><strong>Natural Organic Produce:</strong> All products are single-origin, naturally grown organic produce. Because these are harvested from natural hill estates without synthetic manipulation, individual results, tastes, grain dimensions, and experiences may naturally vary.</li>
          <li><strong>Representational Images:</strong> Product images on the website are used for visual representation purposes only. Actual delivered products may show natural seasonal variations in color, size, and aroma.</li>
          <li><strong>Information Integrity:</strong> While we endeavor to keep all product specifications accurate, we do not guarantee that all product descriptions, pricing, or content are entirely free of unintentional typographical errors.</li>
        </ul>
      </section>

      {/* 2. External Links Disclaimer */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <ExternalLink className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">2. External Links Disclaimer</h2>
        </div>
        <p className="text-neutral-700 leading-relaxed">
          Our website may occasionally contain links to external third-party websites or services (e.g., payment gateways, social media platforms, or courier tracking portals).
        </p>
        <p className="text-neutral-700 leading-relaxed">
          Kollimalai Arasan does not control, investigate, monitor, or endorse the content, privacy practices, terms, or reliability of any linked external sites, and cannot assume responsibility for external web content.
        </p>
      </section>

      {/* 3. Limitation of Liability */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <ShieldAlert className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">3. Limitation of Liability</h2>
        </div>
        <p className="text-neutral-700 leading-relaxed">
          Under no circumstances shall Kollimalai Arasan, its proprietors, or its team be held liable for:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
          <li>Any direct, indirect, consequential, special, or incidental damages resulting from the use of, or inability to use, our website and products.</li>
          <li>Loss of data, business disruption, or commercial loss.</li>
          <li>Any unintentional errors, omissions, or inaccuracies found within the website content.</li>
        </ul>
      </section>

      {/* 4. Consent */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <CheckSquare className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">4. Consent</h2>
        </div>
        <p className="text-neutral-700 leading-relaxed">
          By continuing to use our website, browse our store, or purchase our products, you explicitly confirm that you have read, understood, and agree to this disclaimer and all its terms.
        </p>
      </section>

      {/* 5. Updates */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <RefreshCw className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">5. Updates to this Disclaimer</h2>
        </div>
        <p className="text-neutral-700 leading-relaxed">
          This disclaimer may be revised, updated, or modified at any time without prior notice. Continued use of our website following any posted updates implies your full acceptance of the revised policy.
        </p>
      </section>
    </PolicyLayout>
  );
}
