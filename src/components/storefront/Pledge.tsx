"use client";

import * as React from "react";
import { pledges } from "@/constants/storefront";
import { SectionHeading } from "./heading/SectionHeading";
import { Section } from "./Section";
import { InfoCard } from "./cards/InfoCard";

export function Pledge() {
  return (
    <Section>
      <SectionHeading title="our wholesome food pledge" />

      <div
        className="
          grid
          grid-cols-2
          sm:grid-cols-3
          lg:grid-cols-6
          gap-y-10
          gap-x-6
        "
      >
        {pledges.map((pledge) => (
          <InfoCard
            key={pledge.id}
            image={pledge.icon}
            alt={pledge.name}
            title={pledge.name}
            cardClassName="
              flex
              flex-col
              items-center
            "
            imageClassName="
              w-[110px]
              sm:w-[120px]
              md:w-[140px]
              h-auto
              transition-all
              duration-300
              group-hover:scale-105
              group-hover:-translate-y-2
            "
            titleClassName="
              mt-1
              text-center
              text-sm
              md:text-base
              font-medium
              transition-colors
              duration-300
              text-hover-primary
              text-[var(--brown-800)]
            "
          />
        ))}
      </div>
    </Section>
  );
}

export default Pledge;
