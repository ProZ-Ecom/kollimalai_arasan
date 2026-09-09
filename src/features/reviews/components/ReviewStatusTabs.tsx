"use client";

import { cn } from "@/lib/utils";

export interface ReviewStatusTab {
  id: "all" | "approved" | "unapproved";
  label: string;
  count?: number;
}

interface ReviewStatusTabsProps {
  tabs: ReviewStatusTab[];
  activeTab: string;
  onChange: (tabId: "all" | "approved" | "unapproved") => void;
  className?: string;
}

export function ReviewStatusTabs({
  tabs,
  activeTab,
  onChange,
  className,
}: ReviewStatusTabsProps) {
  return (
    <div
      className={cn(
        "flex p-1 bg-cream-200 border border-cream-border rounded-xl gap-1 overflow-x-auto scrollbar-none",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
              isActive
                ? "bg-secondary-600 text-cream-white shadow-xs font-bold"
                : "text-neutral-500 hover:text-neutral-900 hover:bg-white/80"
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={cn(
                  "px-1.5 py-0.2 text-[10.5px] rounded-full font-bold leading-none",
                  isActive
                    ? "bg-white/20 text-cream-white"
                    : "bg-cream-300 text-neutral-700"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
