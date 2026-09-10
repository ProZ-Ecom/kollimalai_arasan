"use client";

import * as React from "react";
import { BadgeCheck, Leaf, Package } from "lucide-react";
import { Section } from "./Section";

/**
 * The three promises that sit directly beneath the hero banner.
 *
 * The glyphs are lucide icons filled with their own accent colour rather than
 * flat image assets - they stay crisp at any size and add no files to public/.
 * `stroke` differs per icon on purpose: the badge and the box read as solid
 * shapes with white detailing punched out, while the leaf is a single colour.
 */
const PROMISES = [
  {
    id: 1,
    Icon: Leaf,
    colorClassName: "text-promise-leaf",
    stroke: "currentColor",
    title: "Farm Fresh",
    description:
      "From the start, it's been about pure spices and Millets our promise to never compromise.",
  },
  {
    id: 2,
    Icon: BadgeCheck,
    colorClassName: "text-promise-check",
    stroke: "#ffffff",
    title: "Authentic Taste",
    description:
      "Our process keeps the taste, smell, and color just right\u2014so they stay fresh for longer.",
  },
  {
    id: 3,
    Icon: Package,
    colorClassName: "text-promise-box",
    stroke: "#ffffff",
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
        {PROMISES.map(
          ({ id, Icon, colorClassName, stroke, title, description }) => (
            <div
              key={id}
              className="flex flex-col items-center text-center px-2"
            >
              <Icon
                className={`w-12 h-12 sm:w-14 sm:h-14 ${colorClassName}`}
                fill="currentColor"
                stroke={stroke}
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <h3 className="mt-4 text-base sm:text-lg font-bold text-theme-text-primary">
                {title}
              </h3>
              <p className="mt-2 max-w-[330px] text-sm leading-relaxed text-theme-text-muted">
                {description}
              </p>
            </div>
          )
        )}
      </div>
    </Section>
  );
}

export default BrandPromise;
