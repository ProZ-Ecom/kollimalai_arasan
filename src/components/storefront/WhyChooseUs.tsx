"use client";

import * as React from "react";
import { Sprout, Leaf, Globe } from "lucide-react";
import { SectionHeading } from "./heading/SectionHeading";
import { Section } from "./Section";

interface IconProps {
  className?: string;
  strokeWidth?: number;
}

function FlaskConicalOffIcon({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10 2v2.343" />
      <path d="M14 2v6.343" />
      <path d="m2 2 20 20" />
      <path d="M20 20a2 2 0 0 1-2 2H6a2 2 0 0 1-1.755-2.96l5.227-9.563" />
      <path d="M6.453 15H15" />
      <path d="M8.5 2h7" />
    </svg>
  );
}

function DnaOffIcon({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 2c-1.35 1.5-2.092 3-2.5 4.5L14 8" />
      <path d="m17 6-2.891-2.891" />
      <path d="M2 15c3.333-3 6.667-3 10-3" />
      <path d="m2 2 20 20" />
      <path d="m20 9 .891.891" />
      <path d="M22 9c-1.5 1.35-3 2.092-4.5 2.5l-1-1" />
      <path d="M3.109 14.109 4 15" />
      <path d="m6.5 12.5 1 1" />
      <path d="m7 18 2.891 2.891" />
      <path d="M9 22c1.35-1.5 2.092-3 2.5-4.5L10 16" />
    </svg>
  );
}

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
    icon: <FlaskConicalOffIcon className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.5} />,
  },
  {
    id: 3,
    name: "Non-GMO Produce",
    icon: <DnaOffIcon className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.5} />,
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
