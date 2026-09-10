"use client";

import * as React from "react";
import { Sprout, SprayCan, FlaskConical, Leaf, Globe, Ban } from "lucide-react";
import { SectionHeading } from "./heading/SectionHeading";
import { Section } from "./Section";

interface WhyChooseUsItem {
  id: number;
  name: string;
  icon: React.ReactNode;
}

const whyChooseUsItems: WhyChooseUsItem[] = [
  {
    id: 1,
    name: "Sustainable Farming Techniques",
    icon: <Sprout className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.5} />,
  },
  {
    id: 2,
    name: "Chemical-Free Practices",
    icon: (
      <span className="relative inline-flex">
        <SprayCan className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.5} />
        <Ban className="w-8 h-8 sm:w-9 sm:h-9 absolute inset-0" strokeWidth={1.5} />
      </span>
    ),
  },
  {
    id: 3,
    name: "Non-GMO Produce",
    icon: (
      <span className="relative inline-flex">
        <FlaskConical className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.5} />
        <Ban className="w-8 h-8 sm:w-9 sm:h-9 absolute inset-0" strokeWidth={1.5} />
      </span>
    ),
  },
  {
    id: 4,
    name: "Locally Ethically Sourced",
    icon: <Leaf className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.5} />,
  },
  {
    id: 5,
    name: "Health Certified",
    icon: <Globe className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.5} />,
  },
];

export function WhyChooseUs() {
  return (
    <Section>
      <SectionHeading title="Why choose us?" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-10 gap-x-6">
        {whyChooseUsItems.map((item) => (
          <div
            key={item.id}
            className="group flex flex-col items-center text-center"
          >
            <div className="text-[var(--neutral-900)] transition-transform duration-300 group-hover:scale-110 group-hover:text-theme-primary">
              {item.icon}
            </div>
            <p className="mt-3 text-xs sm:text-sm font-medium text-[var(--neutral-900)] leading-tight">
              {item.name}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export default WhyChooseUs;
