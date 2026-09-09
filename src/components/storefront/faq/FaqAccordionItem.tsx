"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

export interface FaqAccordionItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function FaqAccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
}: FaqAccordionItemProps) {
  const contentId = React.useId();

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white transition-colors duration-300 ${
        isOpen
          ? "border-[var(--secondary-300)] shadow-sm"
          : "border-[var(--cream-border)] hover:border-[var(--cream-border-hover)]"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-4 text-left sm:px-5"
      >
        <span className="text-sm font-medium text-[var(--secondary-700)] sm:text-[15px]">
          {question}
        </span>
        <span
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
            isOpen
              ? "rotate-180 border-[var(--secondary-600)] bg-[var(--secondary-600)] text-white"
              : "border-[var(--cream-border)] text-[var(--secondary-600)]"
          }`}
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>

      {/* Grid-rows transition animates any answer length without a fixed max-height. */}
      <div
        id={contentId}
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="whitespace-pre-line px-4 pb-4 text-sm leading-relaxed text-[var(--neutral-600)] sm:px-5 sm:pb-5">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default FaqAccordionItem;
