"use client";

import * as React from "react";
import Image from "next/image";
import { LOGOS } from "@/constants/storefront";

export interface SectionHeadingProps {
  title: string;
}

export function SectionHeading({ title }: SectionHeadingProps) {
  return (
    <div className="flex justify-center ">
      <div className="inline-flex flex-col items-center">
        <h2
          className="
            text-2xl
            sm:text-4xl
            lg:text-5xl
            uppercase
            text-center
            leading-none
            font-bold
            text-[var(--brown-800)]
          "
        >
          {title}
        </h2>

        <div className="flex items-center mt-1 w-full">
          <div className="flex-1 h-[2px] bg-[var(--brown-800)]" />

          <Image
            src={LOGOS.flower}
            alt="flower"
            width={30}
            height={30}
            className="mx-3 w-7 sm:w-8 md:w-9 h-auto"
          />

          <div className="flex-1 h-[2px] bg-[var(--brown-800)]" />
        </div>
      </div>
    </div>
  );
}

export default SectionHeading;
