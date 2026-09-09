"use client";

import * as React from "react";
import { reviews } from "@/constants/storefront";
import { ReviewCard } from "./cards/ReviewCard";
import { SectionHeading } from "./heading/SectionHeading";
import { Section } from "./Section";

export function Feedback() {
  return (
    <Section>
      <SectionHeading title="Savory Moments, Joyful Echoes!" />

      <div
        className="
          flex
          gap-4
          overflow-x-auto
          snap-x
          snap-mandatory
          scrollbar-hide
          lg:grid
          lg:grid-cols-3
          lg:overflow-visible
        "
      >
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </Section>
  );
}

export default Feedback;
