"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ICONS, banners } from "@/constants/storefront";
import { useSlider } from "@/hooks/useSlider";
import { useCustomerBanners } from "@/features/banners/hooks";
import { IconButton } from "./buttons/IconButton";

export function HeroSlider() {
  const { data: heroBanners } = useCustomerBanners({ position: "home-hero" });

  const [failedImages, setFailedImages] = React.useState<Record<string, boolean>>({});

  const slides = React.useMemo(() => {
    if (heroBanners && heroBanners.length > 0) {
      return heroBanners.map((banner) => {
        const rawTitle = (banner.title || "").trim();
        const cleanAlt =
          rawTitle && rawTitle.toLowerCase() !== "fixed"
            ? rawTitle
            : "Kollimalai Arasan - Pure Organic Spices & Farm Produce";

        return {
          key: banner.id,
          image: banner.imageUrl || "/images/kolli_spices_hero.jpg",
          link: banner.linkUrl,
          alt: cleanAlt,
        };
      });
    }
    return banners.map((image, index) => ({
      key: `fallback-${index}`,
      image: image || "/images/kolli_spices_hero.jpg",
      link: null as string | null,
      alt: "Kollimalai Arasan - Pure Organic Spices & Farm Produce",
    }));
  }, [heroBanners]);

  const { currentIndex, next, previous } = useSlider(slides.length);
  const activeSlide = slides[currentIndex] ?? slides[0];

  if (!activeSlide) {
    return null;
  }

  const isFailed = failedImages[activeSlide.key];
  const imageSrc = isFailed
    ? "/images/kolli_spices_hero.jpg"
    : activeSlide.image || "/images/kolli_spices_hero.jpg";

  const slideImage = (
    <Image
      src={imageSrc}
      alt={activeSlide.alt}
      width={1366}
      height={623}
      priority
      onError={() => {
        setFailedImages((prev) => ({ ...prev, [activeSlide.key]: true }));
      }}
      className="w-full h-auto block transition-all duration-500 object-cover"
    />
  );

  return (
    <section className="relative w-full overflow-hidden group">
      <IconButton
        icon={ICONS.leftButton}
        alt="Previous"
        onClick={previous}
        width={50}
        height={50}
        className="absolute left-2 sm:left-4 md:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-20 hover:scale-110 transition-transform"
        imageClassName="w-7 sm:w-9 md:w-11 lg:w-14 h-auto drop-shadow-md"
      />

      {activeSlide.link ? (
        <Link href={activeSlide.link} className="block w-full">
          {slideImage}
        </Link>
      ) : (
        <div className="w-full">{slideImage}</div>
      )}

      <IconButton
        icon={ICONS.rightButton}
        alt="Next"
        onClick={next}
        width={50}
        height={50}
        className="absolute right-2 sm:right-4 md:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-20 hover:scale-110 transition-transform"
        imageClassName="w-7 sm:w-9 md:w-11 lg:w-14 h-auto drop-shadow-md"
      />
    </section>
  );
}

export default HeroSlider;
