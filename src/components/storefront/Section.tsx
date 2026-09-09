"use client";

import * as React from "react";

export interface SectionProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export function Section({
  children,
  className = "",
  containerClassName = "",
}: SectionProps) {
  return (
    <section className={`py-6 sm:py-10 ${className}`}>
      <div className={`max-w-[1400px] mx-auto px-4 ${containerClassName}`}>
        {children}
      </div>
    </section>
  );
}

export default Section;
