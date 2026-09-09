"use client";

import { useState, useCallback, useEffect } from "react";

export function useSlider(length: number) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex >= length) {
      setCurrentIndex(0);
    }
  }, [length, currentIndex]);

  const next = useCallback(() => {
    if (length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % length);
  }, [length]);

  const previous = useCallback(() => {
    if (length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + length) % length);
  }, [length]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  return {
    currentIndex,
    next,
    previous,
    goTo,
  };
}

export default useSlider;
