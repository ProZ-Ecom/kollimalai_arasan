"use client";

import * as React from "react";
import Image from "next/image";
import { Gift, Cookie, ImageIcon } from "lucide-react";
import { LOGOS } from "@/constants/storefront";

/**
 * Full-bleed promo banner beneath the hero.
 *
 * Placeholder build: the real design needs photography (gift box product
 * shots, the cooking-scene painting) and the Snack4us diamond badge as image
 * assets, none of which exist in `public/` yet. Everything here is drawn with
 * CSS/lucide icons so the layout and copy can be reviewed now; swap the
 * placeholder blocks for real <Image> assets once they're provided.
 */
export function TasteTradition() {
  return (
    <section className="relative w-full overflow-hidden bg-[var(--yellow-500)]">
      <div className="relative flex flex-col lg:flex-row lg:min-h-[420px]">
        {/* Left: copy + diamond badge + placeholder product shots */}
        <div className="relative z-10 flex-1 px-6 py-10 sm:px-12 sm:py-14 lg:pr-24">
          <div className="flex flex-col sm:flex-row sm:items-center gap-8">
            {/* Snack4us diamond badge - same logo used in the header */}
            <div className="shrink-0 mx-auto sm:mx-0">
              <Image
                src={LOGOS.logo}
                alt="Kollimalai Arasan"
                width={144}
                height={144}
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl shadow-lg"
              />
            </div>

            <div className="text-center sm:text-left">
              <p className="text-white font-bold tracking-wide text-lg sm:text-xl uppercase">
                Filling every home with
              </p>
              <h2 className="text-white font-extrabold text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight mt-1">
                Purity &amp; Tradition
              </h2>
              <p className="mt-3 max-w-md text-[var(--neutral-900)] font-medium text-sm sm:text-base">
                Every pack carries pure Kolli Hills spices and natural harvests that enrich your kitchen and well-being.
              </p>
            </div>
          </div>

          {/* Placeholder product row: gift boxes + sweets plate + fans */}
          <div className="mt-8 flex items-end justify-center sm:justify-start gap-4">
            <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-md bg-[#4a221a]/90 flex items-center justify-center shadow-md">
              <Gift className="w-8 h-8 text-white/70" strokeWidth={1.5} />
            </div>
            <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-md bg-[#4a221a]/70 flex items-center justify-center shadow-md">
              <Gift className="w-6 h-6 text-white/70" strokeWidth={1.5} />
            </div>
            <div className="w-24 h-20 sm:w-28 sm:h-24 rounded-full bg-white flex items-center justify-center shadow-md">
              <Cookie className="w-9 h-9 text-[#5a2318]" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Right: placeholder image panel with a diagonal cut, matching the
            reference's arrow-shaped divider between the orange panel and the
            photo */}
        <div
          className="relative flex-1 min-h-[220px] lg:min-h-0 bg-[#e9ddc8] flex items-center justify-center"
          style={{
            clipPath: "polygon(6% 0%, 100% 0%, 100% 100%, 6% 100%, 26% 50%)",
          }}
        >
          <div className="flex flex-col items-center gap-2 text-[var(--neutral-500)] pl-10">
            <ImageIcon className="w-10 h-10" strokeWidth={1.25} />
            <span className="text-xs font-medium text-center max-w-[180px]">
              Cooking-scene photo goes here
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TasteTradition;
