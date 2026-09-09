"use client";

import React from "react";
import Image from "next/image";
import { Clock, MapPin, Award, Package } from "lucide-react";

export function AboutOurStorySection() {
  const factCards = [
    {
      id: "est",
      icon: Clock,
      label: "ESTABLISHED",
      value: "2021",
    },
    {
      id: "loc",
      icon: MapPin,
      label: "LOCATION",
      value: "Namakkal, Tamil Nadu",
    },
    {
      id: "brand",
      icon: Award,
      label: "BRAND",
      value: "Rithu's Snacks",
    },
    {
      id: "range",
      icon: Package,
      label: "PRODUCT RANGE",
      value: "30+ varieties",
    },
  ];

  return (
    <section id="our-story" className="bg-about-story-bg py-16 sm:py-24 px-6 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Image with Floating "Since" Badge */}
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="relative w-full max-w-lg mx-auto">
              <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-square sm:aspect-[4/3] lg:aspect-square w-full">
                <Image
                  src="/images/Aboutus_ourstory_img1.jpg"
                  alt="Our Story - Rithu's Snacks"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>

              {/* Floating "Since" Badge */}
              <div className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 z-10 bg-about-story-badge-bg text-about-story-badge-text rounded-2xl p-4 sm:p-5 shadow-2xl border-white min-w-[150px] sm:min-w-[170px] text-left">
                <span className="text-[10px] tracking-widest uppercase font-semibold text-about-story-badge-sub/80 block">
                  SINCE
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-about-story-badge-text leading-none my-1 block">
                  2021
                </span>
                <span className="text-[9px] tracking-wider uppercase font-semibold text-about-story-badge-sub/90 block">
                  NAMAKKAL, TAMIL NADU
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Story Text & 2x2 Fact Grid */}
          <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col items-start text-left">
            {/* Eyebrow */}
            <span className="text-xs font-bold tracking-widest text-about-eyebrow uppercase mb-3 block">
              OUR STORY
            </span>

            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-about-heading leading-[1.2] tracking-tight mb-5">
              Rooted in tradition,
              <br className="hidden sm:inline" />
              {" "}growing with purpose
            </h2>

            {/* Description */}
            <p className="text-about-body text-sm sm:text-base leading-relaxed mb-8">
              Rithanya Food Products and Exports was established in 2021 in Namakkal, Tamil Nadu, with a vision to deliver quality food products with a traditional touch, exceptional taste, and a strong focus on health and customer satisfaction.
            </p>

            {/* 2x2 Fact Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {factCards.map((card) => {
                const IconComponent = card.icon;
                return (
                  <div
                    key={card.id}
                    className="bg-about-card-bg border border-about-card-border hover:border-about-card-border-hover rounded-xl p-4 flex items-center gap-3.5 shadow-xs transition-colors duration-200"
                  >
                    <div className="w-10 h-10 rounded-lg bg-about-card-icon-bg text-about-card-icon-fg flex items-center justify-center shrink-0">
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] tracking-wider text-neutral-400 font-semibold uppercase">
                        {card.label}
                      </span>
                      <span className="text-sm font-bold text-about-heading truncate">
                        {card.value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutOurStorySection;
