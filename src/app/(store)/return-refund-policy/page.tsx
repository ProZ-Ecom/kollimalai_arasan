import type { Metadata } from "next";
import Link from "next/link";
import { PolicyLayout } from "@/components/storefront/policy/PolicyLayout";
import {
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
  CreditCard,
  Ban,
  ShieldAlert,
  Mail,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Refund & Replacement Policy | Kollimalai Arasan",
  description:
    "Learn about our 2-day return, refund, and replacement policy for farm-fresh organic products from Kolli Hills.",
};

export default function ReturnRefundPolicyPage() {
  return (
    <PolicyLayout
      title="Refund / Replacement Policy"
      lastUpdated="September 2026"
      icon={RotateCcw}
    >
      {/* Introduction */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 font-serif">
          Introduction
        </h2>
        <p className="text-base sm:text-lg text-neutral-800 leading-relaxed font-medium">
          At <strong className="text-neutral-900 font-semibold">Kollimalai Arasan</strong>, we take great care to ensure that every product is thoroughly processed, carefully packaged, and delivered to your doorstep in excellent condition.
        </p>
        <p className="text-neutral-700 leading-relaxed">
          However, we understand that certain unexpected situations during transit may warrant a refund or replacement.
        </p>
      </section>

      {/* 1. Eligible Cases for Return / Replacement */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <CheckCircle className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">
            1. Eligible Cases for Return / Replacement
          </h2>
        </div>
        <p className="text-neutral-700 leading-relaxed">
          You may request a replacement or full refund in the following scenarios:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
          <li><strong>Incorrect Item:</strong> The product delivered does not match your original order.</li>
          <li><strong>Damaged / Defective:</strong> The product arrives damaged during transit (e.g., opened packaging, broken seal, punctured pouch, or visibly defective condition).</li>
        </ul>
      </section>

      {/* 2. Important Instructions */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <AlertCircle className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">
            2. Important Instructions for Delivery
          </h2>
        </div>
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 text-neutral-800 space-y-2">
          <ul className="list-disc pl-6 space-y-2 text-neutral-800 text-sm sm:text-base">
            <li><strong>Inspect your package:</strong> Please inspect the outer parcel at the time of delivery before accepting it from the courier executive.</li>
            <li><strong>Visible Damage:</strong> If obvious, visible outer damage or leakage is noticed, please <strong>reject the package during delivery itself</strong> and note it with the courier.</li>
            <li><strong>Damage Found After Opening:</strong> If damage or incorrect contents are discovered only after opening the box, you may still request a return/replacement by taking clear photos or videos of the package and items.</li>
          </ul>
        </div>
      </section>

      {/* 3. Time Limit for Claims */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <Clock className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">
            3. Time Limit for Claims (2-Day Window)
          </h2>
        </div>
        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5 text-neutral-800 space-y-2">
          <p className="font-semibold text-emerald-950 text-base">
            All refund or replacement requests must be submitted within 2 calendar days of delivery.
          </p>
          <p className="text-neutral-700 text-sm">
            Due to the perishable and natural organic nature of agricultural produce and spices, requests made after this 2-day period will unfortunately not be considered.
          </p>
        </div>
      </section>

      {/* 4. Refund Process */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <CreditCard className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">
            4. Refund Process
          </h2>
        </div>
        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
          <li>Each refund or replacement request will be carefully reviewed and verified by our customer care team.</li>
          <li>If the claim is found valid, a replacement package will be dispatched immediately, or the approved refund will be credited directly to your original payment method.</li>
          <li>Processing time for refunds to reflect in your bank account or card statement typically takes 3 to 7 business days depending on your issuing bank or payment gateway.</li>
        </ul>
      </section>

      {/* 5. Rejection of Claims */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <Ban className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">
            5. Rejection of Claims
          </h2>
        </div>
        <p className="text-neutral-700 leading-relaxed">
          Kollimalai Arasan reserves the right to:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
          <li>Reject return or refund claims that are found to be non-genuine, self-damaged, or tampered with after delivery.</li>
          <li>Deny requests submitted beyond the permitted 2-day claim window.</li>
          <li>Refuse returns where the product has been substantially consumed or depleted.</li>
        </ul>
      </section>

      {/* 6. Misuse Policy */}
      <section className="space-y-4 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <ShieldAlert className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">
            6. Misuse Policy
          </h2>
        </div>
        <p className="text-neutral-700 leading-relaxed">
          Any false, exaggerated, frivolous, or unjustified complaints regarding product quality or delivery may result in:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
          <li>Outright rejection of the return or refund claim.</li>
          <li>Permanent restriction or deactivation of the customer account.</li>
          <li>Potential legal action in cases of identified fraud or malicious misuse.</li>
        </ul>
      </section>

      {/* 7. Contact Us */}
      <section className="space-y-3 pt-6 border-t border-[var(--theme-border-subtle,#F0E6D6)]">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg sm:text-xl">
          <Mail className="w-5 h-5 text-secondary-600" />
          <h2 className="text-neutral-900 font-serif font-bold">7. How to File a Claim</h2>
        </div>
        <p className="text-neutral-700 leading-relaxed">
          To file a return, refund, or replacement request within 2 days of delivery:
        </p>
        <div className="bg-neutral-50 rounded-xl p-4 sm:p-5 border border-neutral-200/80 space-y-1 text-sm text-neutral-700">
          <p><strong className="text-neutral-900">Brand:</strong> Kollimalai Arasan</p>
          <p><strong className="text-neutral-900">Email:</strong> <a href="mailto:kollimalaiarasan@gmail.com" className="text-primary-700 hover:underline">kollimalaiarasan@gmail.com</a></p>
          <p><strong className="text-neutral-900">WhatsApp / Helpline:</strong> <a href="https://wa.me/917338880950" target="_blank" rel="noopener noreferrer" className="text-primary-700 hover:underline">+91 73388 80950</a></p>
          <p><strong className="text-neutral-900">Website:</strong> <Link href="/" className="text-primary-700 hover:underline">https://kollimalaiarasan.com/</Link></p>
        </div>
      </section>
    </PolicyLayout>
  );
}
