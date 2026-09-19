"use client";

import * as React from "react";
import Image from "next/image";
import { Section } from "./Section";
import { ICONS } from "@/constants/storefront";

const PROMISES = [
  {
    id: 1,
    icon: ICONS.leaf,
    title: "Farm Fresh",
    description:
      "From the start, it's been about pure spices and Millets our promise to never compromise.",
  },
  {
    id: 2,
    icon: ICONS.badge,
    title: "Authentic Purity",
    description:
      "Our traditional process preserves the natural aroma, potency, and rich color—so they stay fresh for longer.",
  },
  {
    id: 3,
    icon: ICONS.box,
    title: "Freshly Packed",
    description:
      "We use a fully automated system to keep every step clean, safe, and pure.",
  },
] as const;

export function BrandPromise() {
  return (
    <Section className="py-10 sm:py-14">
      <h2 className="text-center text-xl sm:text-2xl lg:text-[32px] font-semibold leading-snug text-theme-text-primary">
        Explore the world of rich and pure Spices &amp; Millets with{" "}
        <span className="block mt-1 text-accent-orange">
          Kollimalai Arasan.
        </span>
      </h2>

      <div className="mt-9 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-9 sm:gap-6">
        {PROMISES.map(({ id, icon, title, description }) => (
          <div
            key={id}
            className="flex flex-col items-center text-center px-2"
          >
            <Image
              src={icon}
              alt={title}
              width={56}
              height={56}
              className="w-12 h-12 sm:w-14 sm:h-14"
            />
            <h3 className="mt-4 text-base sm:text-lg font-bold text-theme-text-primary">
              {title}
            </h3>
            <p className="mt-2 max-w-[330px] text-sm leading-relaxed text-theme-text-muted">
              {description}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export default BrandPromise;
