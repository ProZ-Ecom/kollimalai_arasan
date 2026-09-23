"use client";

import React from "react";
import { Leaf, Award, ShieldCheck, Sparkles, Target, Eye } from "lucide-react";

export function AboutPhilosophySection() {
  const uniqueFeatures = [
    {
      icon: Award,
      title: "Single-Origin Farming",
      description: "Consistent, traceable quality harvested exclusively from our single pristine estate in Kolli Hills.",
    },
    {
      icon: Leaf,
      title: "100% Organic Practices",
      description: "Absolutely zero chemicals, artificial pesticides, or synthetic fertilizers in any stage of cultivation.",
    },
    {
      icon: ShieldCheck,
      title: "Eco-Friendly Approach",
      description: "Dedicated to preserving forest biodiversity, natural spring water, and protecting our mountain environment.",
    },
    {
      icon: Sparkles,
      title: "Premium Quality Products",
      description: "Naturally grown under optimal elevation and soil fertility to deliver rich, authentic flavor in every harvest.",
    },
  ];

  return (
    <section className="bg-white py-16 sm:py-24 px-6 lg:px-16 border-t border-neutral-100">
      <div className="max-w-7xl mx-auto">
        {/* Philosophy Intro */}
        <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
          <span className="text-xs font-bold tracking-widest text-secondary-500 uppercase mb-3 block">
            OUR PHILOSOPHY
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.2] mb-6">
            Nurtured by Nature, Rewarded with Purity
          </h2>
          <p className="text-neutral-600 text-base sm:text-lg leading-relaxed">
            At <strong>Kollimalai Arasan</strong>, we live by a nature-first philosophy. Our farming practices are rooted in sustainability, harnessing natural resources such as soil fertility, clean natural mountain water, and organic compost — while completely avoiding external chemical inputs. We believe that when nature is nurtured with care, it rewards us with the finest, most aromatic produce.
          </p>
        </div>

        {/* What Makes Us Unique Grid */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <span className="text-xs font-bold tracking-widest text-primary-700 uppercase mb-2 block">
              THE ARASAN PROMISE
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-neutral-900">
              What Makes Us Unique
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {uniqueFeatures.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-neutral-200/80 bg-neutral-50/60 p-6 flex flex-col items-start hover:border-secondary-500/50 hover:bg-secondary-50/20 transition-all duration-300 shadow-xs hover:shadow-md"
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary-500/10 text-secondary-600 flex items-center justify-center mb-4 shrink-0">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-neutral-900 mb-2">
                    {item.title}
                  </h4>
                  <p className="text-sm text-neutral-600 leading-relaxed font-light">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mission & Vision Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Mission */}
          <div className="rounded-3xl border border-secondary-100 bg-linear-to-br from-secondary-50/50 to-white p-8 sm:p-10 shadow-sm flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-100/80 text-secondary-700 text-xs font-bold tracking-wider uppercase mb-5">
                <Target className="w-4 h-4 text-secondary-600" />
                OUR MISSION
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-4">
                Purity in Every Home
              </h3>
              <p className="text-neutral-700 text-base sm:text-lg leading-relaxed">
                To deliver pure, natural, and chemical-free products to every household while championing the cause of sustainable, responsible, and ethical agriculture across Kolli Hills.
              </p>
            </div>
          </div>

          {/* Vision */}
          <div className="rounded-3xl border border-primary-100 bg-linear-to-br from-primary-50/40 to-white p-8 sm:p-10 shadow-sm flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100/80 text-primary-800 text-xs font-bold tracking-wider uppercase mb-5">
                <Eye className="w-4 h-4 text-primary-700" />
                OUR VISION
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-4">
                A Globally Trusted Organic Brand
              </h3>
              <p className="text-neutral-700 text-base sm:text-lg leading-relaxed">
                To grow into a trusted and globally recognized organic farming brand, delivering authentic, farm-fresh produce directly from our hills to your dining table.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutPhilosophySection;
