"use client";

import * as React from "react";
import { features } from "@/constants/storefront";
import { Section } from "./Section";
import { InfoCard } from "./cards/InfoCard";

export function Features() {
  return (
    <Section className="py-8">
      <div className="grid lg:grid-cols-5 grid-cols-2 gap-6">
        {features.map((item, index) => (
          <InfoCard
            key={item.id}
            image={item.image}
            alt={item.name}
            title={item.name}
            subtitle={item.footer}
            imageWidth={40}
            imageHeight={40}
            cardClassName={`
              flex
              flex-col
              items-center
              text-center
              ${
                index === features.length - 1
                  ? "col-span-2 justify-self-center lg:col-span-1 lg:justify-self-auto"
                  : ""
              }
            `}
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
              text-[var(--brown-900)]
            "
            subtitleClassName="
              mt-1
              text-[14px]
              header-font
              text-[var(--brown-800)]
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
