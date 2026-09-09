"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Compass, Sparkles, ArrowDown } from "lucide-react";

export function AboutHeroSection() {
  return (
    <section className="relative bg-about-hero-bg text-white pt-12 pb-8 sm:pt-16 sm:pb-12 lg:pt-20 lg:pb-14 px-6 lg:px-16 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-about-hero-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-about-hero-bg-dark/40 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Heading, Subtext & CTAs */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-about-hero-badge-border bg-about-hero-badge-bg backdrop-blur-xs text-about-hero-gold text-[11px] sm:text-xs tracking-widest uppercase font-semibold mb-6">
              RITHANYA FOOD PRODUCTS & EXPORTS
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl text-white font-bold leading-[1.1] tracking-tight">
              Tradition in
              <br />
              <span className="italic text-about-hero-gold-text">Every Bite</span>
            </h1>

            {/* Subtext */}
            <p className="text-about-hero-subtext text-sm sm:text-base leading-relaxed max-w-md mt-6 mb-8 font-light">
              Authentic South Indian flavours, crafted with care and made for today&apos;s generation.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-about-hero-gold hover:bg-about-hero-gold-hover text-about-hero-btn-dark font-medium text-sm transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
              >
                Discover our range
                <ArrowUpRight className="w-4 h-4" />
              </Link>

              <a
                href="#our-story"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-about-hero-border bg-about-hero-badge-bg hover:bg-white/10 text-white font-medium text-sm transition-all duration-300 backdrop-blur-xs cursor-pointer"
              >
                <Compass className="w-4 h-4 text-about-hero-gold" />
                Our story
              </a>
            </div>
          </div>

          {/* Right Column: Hero Image with Floating Badge */}
          <div className="lg:col-span-6">
            <div className="relative w-full max-w-lg lg:max-w-none mx-auto">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-about-hero-border aspect-[4/3] w-full">
                <Image
                  src="/images/Aboutus_hero_img1.jpg"
                  alt="Tradition in Every Bite"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>

              {/* Floating Circular Badge */}
              <div className="absolute -bottom-5 -left-5 sm:-bottom-7 sm:-left-7 z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-about-hero-circle-bg text-about-hero-btn-dark flex flex-col items-center justify-center text-center p-2 shadow-xl border-4 border-about-hero-circle-border select-none">
                <Sparkles className="w-4 h-4 text-about-hero-btn-dark mb-1 fill-about-hero-btn-dark/20" />
                <span className="text-[10px] sm:text-xs font-bold tracking-wider leading-tight uppercase">
                  MADE WITH
                  <br />
                  CARE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="border-t border-about-hero-border pt-6 mt-12 sm:mt-16 flex flex-col sm:flex-row items-center justify-between gap-4 text-about-hero-subtext text-xs tracking-widest uppercase">
          <span className="font-medium tracking-widest text-center sm:text-left">
            AUTHENTIC • THOUGHTFUL • DELICIOUS
          </span>

          <a
            href="#our-story"
            className="hover:text-about-hero-gold transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
          >
            SCROLL TO EXPLORE
            <ArrowDown className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}

export default AboutHeroSection;
