"use client";

import * as React from "react";
import { features } from "@/constants/storefront";
import { Section } from "./Section";
import { InfoCard } from "./cards/InfoCard";

export function Features() {
  return (
    <Section className="py-8">
      <div className="grid lg:grid-cols-4 grid-cols-2 gap-6">
        {features.map((item) => (
          <InfoCard
            key={item.id}
            image={item.image}
            alt={item.name}
            title={item.name}
            subtitle={item.footer}
            imageWidth={40}
            imageHeight={40}
            cardClassName="
              flex
              flex-col
              items-center
              text-center
            "
            imageClassName="
              w-9
              h-9
              md:w-10
              md:h-10
              transition-all
              duration-300
              group-hover:scale-110
            "
            titleClassName="
              mt-3
              font-semibold
              text-[18px]
              leading-tight
              transition-colors
              duration-300
              text-hover-primary
              text-[var(--neutral-900)]
            "
            subtitleClassName="
              mt-1
              text-[14px]
              header-font
              text-[var(--neutral-900)]
              transition-opacity
              duration-300
              group-hover:opacity-80
            "
          />
        ))}
      </div>
    </Section>
  );
}

export default Features;
