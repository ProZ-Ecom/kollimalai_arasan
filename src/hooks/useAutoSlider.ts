"use client";

import { useEffect, useRef, useCallback } from "react";

export function useAutoSlider(speed: number = 35) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const positionRef = useRef<number>(0);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const container = slider.parentElement;
    if (!container) return;

    let lastTime = 0;

    const animate = (time: number) => {
      if (!lastTime) lastTime = time;

      const delta = time - lastTime;
      lastTime = time;

      positionRef.current += (speed * delta) / 1000;

      const oneSetWidth = slider.scrollWidth / 2;

      if (positionRef.current >= oneSetWidth) {
        positionRef.current -= oneSetWidth;
      }

      container.scrollLeft = positionRef.current;

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [speed]);

  const getStep = useCallback(() => {
    const slider = sliderRef.current;
    if (!slider) return 0;

    const firstCard = slider.children[0] as HTMLElement | undefined;
    if (!firstCard) return 0;

    const styles = getComputedStyle(slider);
    const gap = parseFloat(styles.columnGap || styles.gap || "0");

    return firstCard.offsetWidth + gap;
  }, []);

  const next = useCallback(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const container = slider.parentElement;
    if (!container) return;

    const step = getStep();
    positionRef.current += step;
    container.scrollLeft = positionRef.current;
  }, [getStep]);

  const previous = useCallback(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const container = slider.parentElement;
    if (!container) return;

    const step = getStep();
    positionRef.current -= step;

    if (positionRef.current < 0) {
      positionRef.current += slider.scrollWidth / 2;
    }

    container.scrollLeft = positionRef.current;
  }, [getStep]);

  return {
    sliderRef,
    next,
    previous,
  };
}

export default useAutoSlider;
