import React from "react";
import Image from "next/image";
import { Quote } from "lucide-react";

export function AboutFounderSection() {
  return (
    <section className="bg-about-founder-bg py-16 sm:py-24 px-6 lg:px-16 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Founder Biography & Signature */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Eyebrow */}
            <span className="text-xs font-bold tracking-widest text-about-eyebrow uppercase mb-3 block">
              THE VISION BEHIND KOLLIMALAI ARASAN
            </span>

            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-about-heading leading-[1.2] tracking-tight mb-6">
              From academician to natural
              <br className="hidden sm:inline" />
              {" "}spices entrepreneur
            </h2>

            {/* Paragraphs */}
            <div className="space-y-4 text-about-body text-sm sm:text-base leading-relaxed mb-8 max-w-xl">
              <p>
                With a background in engineering and academics, R. Rajesh&apos;s passion for authentic hill farming and natural spice cultivation inspired him to transform his career to an agri-entrepreneur.
              </p>
              <p>
                His vision, dedication and entrepreneurial spirit laid the foundation for Kollimalai Arasan. Today, that same dedication guides every harvest, bringing you pure, unadulterated Kolli Hills spices—Black pepper, cardamom, cloves, and traditional natural products directly from farm to table.
              </p>
            </div>

            {/* Founder Signature Block */}
            <div className="pt-6 border-t border-about-divider flex flex-wrap items-center justify-between gap-6 w-full max-w-xl">
              <div>
                <h4 className="font-bold text-base sm:text-lg text-about-heading">
                  R. Rajesh, M.E. (CSE)
                </h4>
                <p className="text-[10px] sm:text-[11px] tracking-wider uppercase font-semibold text-neutral-500 mt-0.5">
                  PROPRIETOR — KOLLIMALAI ARASAN
                </p>
              </div>

              <div className="italic text-2xl sm:text-3xl text-about-signature tracking-wide select-none font-semibold">
                R. Rajesh
              </div>
            </div>
          </div>

          {/* Right Column: Arch Shape with Image & Overlaid Quote Card */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative flex flex-col items-center justify-end w-full max-w-[340px] sm:max-w-[370px]">
              {/* Outer Arch Frame */}
              <div className="w-full p-2.5 sm:p-3 rounded-t-full bg-white/40 border border-about-divider/60 shadow-sm">
                {/* Inner Arch Body with Image */}
                <div className="w-full h-[380px] sm:h-[430px] rounded-t-full relative overflow-hidden shadow-inner bg-neutral-100">
                  <Image
                    src="/images/kolli_spices_founder.jpg"
                    alt="Kollimalai Arasan - Pure Spices: Black pepper, cardamom, cloves"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 100vw, 400px"
                    priority
                  />
                </div>
              </div>

              {/* Overlaid Dark Quote Box */}
              <div className="w-[96%] sm:w-[100%] bg-about-quote-bg text-white rounded-2xl p-5 sm:p-6 shadow-2xl border border-white/10 -mt-16 sm:-mt-20 relative z-10 text-left">
                {/* Quote Icon */}
                <span className="text-about-quote-accent text-3xl sm:text-4xl leading-none select-none block mb-2 font-bold">
                  <Quote />
                </span>
                <p className="italic text-xs sm:text-sm text-neutral-200/95 leading-relaxed font-normal">
                  &ldquo;Passion, dedication and tradition become the foundation of Kollimalai Arasan. Delivering authentic Kolli Hills Spices: Black pepper, cardamom, cloves, and pure natural harvests.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutFounderSection;
