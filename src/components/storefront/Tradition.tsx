"use client";

import * as React from "react";
import Image from "next/image";
import { traditionImages } from "@/constants/storefront";
import { SectionHeading } from "./heading/SectionHeading";
import { Section } from "./Section";

export function Tradition() {
  return (
    <Section>
      <SectionHeading title="When Tradition Meets Gourmet Excellence" />

      <div className="flex flex-col gap-3 lg:flex-row lg:justify-center">
        {/* Left Column */}
        <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-col">
          <Image
            src={traditionImages[0].image}
            alt={traditionImages[0].name}
            width={500}
            height={300}
            className="w-full h-auto transition-all duration-300 hover:scale-[1.02] rounded-lg"
          />

          <Image
            src={traditionImages[1].image}
            alt={traditionImages[1].name}
            width={500}
            height={300}
            className="w-full h-auto transition-all duration-300 hover:scale-[1.02] rounded-lg"
          />
        </div>

        {/* Center Column */}
        <div className="flex">
          <Image
            src={traditionImages[2].image}
            alt={traditionImages[2].name}
            width={610}
            height={600}
            className="w-full h-auto transition-all duration-300 hover:scale-[1.02] rounded-lg"
          />
        </div>

        {/* Right Column */}
        <div className="grid grid-cols-3 lg:flex lg:flex-col gap-3">
          <Image
            src={traditionImages[3].image}
            alt={traditionImages[3].name}
            width={220}
            height={210}
            className="w-full h-auto transition-all duration-300 hover:scale-[1.02] rounded-lg"
          />

          <Image
            src={traditionImages[4].image}
            alt={traditionImages[4].name}
            width={220}
            height={210}
            className="w-full h-auto transition-all duration-300 hover:scale-[1.02] rounded-lg"
          />

          <Image
            src={traditionImages[5].image}
            alt={traditionImages[5].name}
            width={220}
            height={210}
            className="w-full h-auto transition-all duration-300 hover:scale-[1.02] rounded-lg"
          />
        </div>
      </div>
    </Section>
  );
}

export default Tradition;
