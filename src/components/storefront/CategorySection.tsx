"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ICONS, LOGOS } from "@/constants/storefront";
import { SectionHeading } from "./heading/SectionHeading";
import { Section } from "./Section";
import { useCustomerCategories, type CustomerCategoryDto } from "@/features/categories";
import { getImageUrl } from "@/lib/utils";

const FALLBACK_CATEGORY_IMAGE = "/images/placeholder.png";

function resolveCategoryImage(category: CustomerCategoryDto): string {
  if (category.image?.trim()) {
    return getImageUrl(category.image);
  }
  return FALLBACK_CATEGORY_IMAGE;
}

export interface CategorySectionProps {
  withoutSectionWrapper?: boolean;
  className?: string;
  showHeading?: boolean;
}

export function CategorySection({
  withoutSectionWrapper = false,
  className = "",
  showHeading = true,
}: CategorySectionProps = {}) {
  const { data: response, isLoading } = useCustomerCategories({
    page: 1,
    pageSize: 50,
    sortBy: "name",
    sortOrder: "asc",
  });

  const rawCategories = response?.data || [];

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const singleSetRef = React.useRef<HTMLDivElement>(null);

  // needsScroll is true when categories exceed available container width
  const [needsScroll, setNeedsScroll] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isManualInteracting, setIsManualInteracting] = React.useState(false);
  const interactionTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Subpixel accumulator for silky 60fps auto-scroll
  const posRef = React.useRef<number>(0);

  // Measure if the single set of categories actually overflows the visible container
  const checkNeedsScroll = React.useCallback(() => {
    const container = scrollContainerRef.current;
    const singleSet = singleSetRef.current;
    if (!container || !singleSet) return;

    const isOverflowing = singleSet.offsetWidth > container.clientWidth + 4;
    setNeedsScroll(isOverflowing);
  }, []);

  React.useEffect(() => {
    checkNeedsScroll();
    const container = scrollContainerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      checkNeedsScroll();
    });
    ro.observe(container);
    if (singleSetRef.current) {
      ro.observe(singleSetRef.current);
    }
    window.addEventListener("resize", checkNeedsScroll);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", checkNeedsScroll);
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, [checkNeedsScroll, rawCategories.length]);

  // Sync posRef with container.scrollLeft when user manually scrolls or touches
  const handleScroll = React.useCallback(() => {
    if (scrollContainerRef.current && isManualInteracting) {
      posRef.current = scrollContainerRef.current.scrollLeft;
    }
  }, [isManualInteracting]);

  // Desktop hover pause: only pauses for mouse devices
  const handleMouseEnter = () => {
    if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Helper to compute loop width (single set width + flex gap)
  const getLoopWidth = React.useCallback(() => {
    const container = scrollContainerRef.current;
    const singleSet = singleSetRef.current;
    if (!container || !singleSet) return 0;
    const styles = getComputedStyle(container);
    const gap = parseFloat(styles.columnGap || styles.gap || "16");
    return singleSet.offsetWidth + gap;
  }, []);

  // Fluid auto-scroll animation loop
  React.useEffect(() => {
    if (!needsScroll || isHovered || isManualInteracting) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    posRef.current = container.scrollLeft;

    let animationFrameId: number;
    let lastTime = performance.now();
    const pixelsPerSecond = 45; // Smooth comfortable scrolling speed

    const step = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (container) {
        posRef.current += pixelsPerSecond * delta;

        const loopWidth = getLoopWidth();
        if (loopWidth > 0 && posRef.current >= loopWidth) {
          posRef.current -= loopWidth;
        }

        container.scrollLeft = posRef.current;
      }

      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [needsScroll, isHovered, isManualInteracting, getLoopWidth]);

  // Manual navigation buttons
  const handleNext = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setIsManualInteracting(true);
    const step = Math.max(160, container.clientWidth * 0.6);
    container.scrollBy({ left: step, behavior: "smooth" });
    posRef.current = container.scrollLeft + step;

    if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
    interactionTimeoutRef.current = setTimeout(() => {
      if (scrollContainerRef.current) {
        posRef.current = scrollContainerRef.current.scrollLeft;
      }
      setIsManualInteracting(false);
    }, 3500);
  };

  const handlePrevious = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setIsManualInteracting(true);
    const step = Math.max(160, container.clientWidth * 0.6);
    const loopWidth = getLoopWidth();

    if (loopWidth > 0 && container.scrollLeft < step) {
      container.scrollLeft += loopWidth;
      posRef.current += loopWidth;
    }

    container.scrollBy({ left: -step, behavior: "smooth" });
    posRef.current = Math.max(0, container.scrollLeft - step);

    if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
    interactionTimeoutRef.current = setTimeout(() => {
      if (scrollContainerRef.current) {
        posRef.current = scrollContainerRef.current.scrollLeft;
      }
      setIsManualInteracting(false);
    }, 3500);
  };

  const renderCategoryCard = (category: CustomerCategoryDto, index: number, keyPrefix = "") => {
    const imageUrl = resolveCategoryImage(category);

    return (
      <Link
        key={`${keyPrefix}-${category.id}-${index}`}
        href={`/categories/${category.id}`}
        className="flex flex-col items-center shrink-0 group cursor-pointer select-none focus:outline-none"
      >
        {/* Circular Avatar Container */}
        <div
          className="
            relative
            w-20
            sm:w-24
            md:w-28
            lg:w-32
            aspect-square
            rounded-full
            overflow-hidden
            isolate
            bg-white
            border
            border-neutral-200/90
            group-hover:border-secondary-500
            shadow-xs
            group-hover:shadow-md
            transition-all
            duration-300
            flex
            items-center
            justify-center
            p-1.5
            sm:p-2
          "
          style={{ WebkitMaskImage: "-webkit-radial-gradient(white, black)" }}
        >
          <img
            src={imageUrl}
            alt={category.name}
            className="w-full h-full object-cover rounded-full transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.onerror = null;
              target.src = FALLBACK_CATEGORY_IMAGE;
            }}
          />
        </div>

        {/* Category Name */}
        <span
          className="
            mt-2.5
            sm:mt-3
            text-center
            text-xs
            sm:text-sm
            font-medium
            text-neutral-800
            group-hover:text-secondary-700
            transition-colors
            duration-200
            line-clamp-2
            max-w-[80px]
            sm:max-w-[96px]
            md:max-w-[112px]
            lg:max-w-[128px]
            leading-tight
            h-[32px]
            sm:h-[36px]
            flex
            items-start
            justify-center
          "
        >
          {category.name}
        </span>
      </Link>
    );
  };

  const content = (
    <>
      {/* {showHeading && <SectionHeading title="Explore by category" />} */}

      {/* Main Slider Track */}
      <div className="relative md:flex md:items-center md:gap-3 lg:gap-5 w-full">

        {needsScroll && (
          <button
            type="button"
            onClick={handlePrevious}
            aria-label="Previous Categories"
            className="
              absolute
              left-0
              top-1/2
              -translate-y-1/2
              z-20
              w-8
              h-12
              flex
              items-center
              justify-center
              bg-white/80
              backdrop-blur-xs
              border
              border-neutral-200
              rounded-r-lg
              shadow-sm
              cursor-pointer
              transition-all
              duration-200
              hover:bg-neutral-100
              md:static
              md:translate-y-0
              md:w-9
              md:h-9
              lg:w-10
              lg:h-10
              md:rounded-full
              md:bg-white
              md:border
              md:border-neutral-200
              md:shadow-xs
              md:hover:bg-neutral-50
              md:shrink-0
            "
          >
            <ChevronLeft className="w-5 h-5 text-neutral-700" />
          </button>
        )}

        {/* Categories Carousel Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className={`w-full md:flex-1 flex items-center flex-nowrap gap-4 sm:gap-6 md:gap-8 py-2 px-2 sm:px-4 md:px-1 overflow-x-auto scrollbar-hide no-scrollbar category-carousel ${needsScroll ? "justify-start" : "justify-center"
            }`}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={() => setIsManualInteracting(true)}
          onTouchEnd={() => {
            if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
            interactionTimeoutRef.current = setTimeout(() => {
              if (scrollContainerRef.current) {
                posRef.current = scrollContainerRef.current.scrollLeft;
              }
              setIsManualInteracting(false);
            }, 2000);
          }}
          onTouchCancel={() => {
            if (scrollContainerRef.current) {
              posRef.current = scrollContainerRef.current.scrollLeft;
            }
            setIsManualInteracting(false);
          }}
        >
          {isLoading ? (
            <div className="flex justify-center items-center gap-4 sm:gap-6 md:gap-8 py-2 w-full">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="flex flex-col items-center shrink-0 animate-pulse"
                >
                  <div className="w-20 sm:w-24 md:w-28 lg:w-32 aspect-square rounded-full bg-neutral-100 border border-neutral-200" />
                  <div className="mt-2.5 h-3.5 w-16 sm:w-20 bg-neutral-100 rounded" />
                </div>
              ))}
            </div>
          ) : rawCategories.length > 0 ? (
            <>
              {/* Primary set of categories */}
              <div
                ref={singleSetRef}
                className="flex items-center flex-nowrap gap-4 sm:gap-6 md:gap-8 shrink-0"
              >
                {rawCategories.map((cat, idx) => renderCategoryCard(cat, idx, "set1"))}
              </div>

              {/* Duplicate set for seamless looping */}
              {needsScroll && (
                <div className="flex items-center flex-nowrap gap-4 sm:gap-6 md:gap-8 shrink-0">
                  {rawCategories.map((cat, idx) => renderCategoryCard(cat, idx, "set2"))}
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center text-sm text-neutral-400 w-full">
              No categories available at the moment.
            </div>
          )}
        </div>

        {/* Right Arrow Button */}
        {needsScroll && (
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Categories"
            className="
              absolute
              right-0
              top-1/2
              -translate-y-1/2
              z-20
              w-8
              h-12
              flex
              items-center
              justify-center
              bg-white/80
              backdrop-blur-xs
              border
              border-neutral-200
              rounded-l-lg
              shadow-sm
              cursor-pointer
              transition-all
              duration-200
              hover:bg-neutral-100
              md:static
              md:translate-y-0
              md:w-9
              md:h-9
              lg:w-10
              lg:h-10
              md:rounded-full
              md:bg-white
              md:border
              md:border-neutral-200
              md:shadow-xs
              md:hover:bg-neutral-50
              md:shrink-0
            "
          >
            <ChevronRight className="w-5 h-5 text-neutral-700" />
          </button>
        )}
      </div>
    </>
  );

  if (withoutSectionWrapper) {
    return <div className={`w-full ${className}`}>{content}</div>;
  }

  return (
    <Section className={`py-6 sm:py-10 bg-white ${className}`}>
      {content}
    </Section>
  );
}

export default CategorySection;
