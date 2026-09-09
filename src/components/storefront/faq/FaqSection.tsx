"use client";

import * as React from "react";
import Image from "next/image";
import { Search, ArrowRight, List, HelpCircle, AlertCircle } from "lucide-react";
import { usePublicFaqs } from "@/features/faqs/hooks";
import { resolveFaqIcon } from "@/features/faqs/constants/faq-icon-map";
import type { PublicFaqDto } from "@/features/faqs/types";
import { FaqAccordionItem } from "./FaqAccordionItem";

const UNCATEGORISED = "General";

/**
 * Section accents still cycle by position so consecutive categories stay
 * visually distinct; the icon itself is whatever the admin picked.
 */
const CATEGORY_ACCENTS = [
  { accent: "var(--secondary-600)", tint: "var(--secondary-100)" },
  { accent: "var(--primary-700)", tint: "var(--primary-100)" },
  { accent: "var(--secondary-500)", tint: "var(--secondary-100)" },
  { accent: "var(--primary-600)", tint: "var(--primary-100)" },
  { accent: "var(--neutral-600)", tint: "var(--neutral-100)" },
];

interface FaqGroup {
  category: string;
  /** Taken from the first FAQ in the group that specifies one. */
  icon: string | null;
  faqs: PublicFaqDto[];
}

/**
 * Groups FAQs by category while preserving the display order the API already
 * sorted them into — the first appearance of a category fixes its position.
 */
function groupByCategory(faqs: PublicFaqDto[]): FaqGroup[] {
  const groups: FaqGroup[] = [];
  const index = new Map<string, FaqGroup>();

  for (const faq of faqs) {
    const category = faq.category?.trim() || UNCATEGORISED;
    let group = index.get(category);

    if (!group) {
      group = { category, icon: faq.icon ?? null, faqs: [] };
      index.set(category, group);
      groups.push(group);
    }

    if (!group.icon && faq.icon) {
      group.icon = faq.icon;
    }

    group.faqs.push(faq);
  }

  return groups;
}

function FaqSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
      <div className="hidden lg:block">
        <div className="h-[220px] animate-pulse rounded-2xl border border-[var(--cream-border)] bg-white" />
        <div className="mt-6 h-[260px] animate-pulse rounded-2xl bg-[var(--cream-200)]" />
      </div>

      <div className="space-y-8">
        {[0, 1, 2].map((section) => (
          <div key={section}>
            <div className="mb-4 h-7 w-56 animate-pulse rounded-lg bg-[var(--cream-200)]" />
            <div className="space-y-3">
              {[0, 1, 2].map((row) => (
                <div
                  key={row}
                  className="h-[58px] animate-pulse rounded-xl border border-[var(--cream-border)] bg-white"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FaqSection() {
  const [searchInput, setSearchInput] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<string | null>(
    null
  );
  const [openFaqId, setOpenFaqId] = React.useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = usePublicFaqs();

  // Guards against a malformed payload so one bad row can never blank the page.
  const faqs = React.useMemo<PublicFaqDto[]>(() => {
    if (!Array.isArray(data)) return [];
    return data.filter(
      (faq): faq is PublicFaqDto =>
        Boolean(faq) &&
        typeof faq.id === "string" &&
        typeof faq.question === "string" &&
        faq.question.trim().length > 0 &&
        typeof faq.answer === "string"
    );
  }, [data]);

  const allGroups = React.useMemo(() => groupByCategory(faqs), [faqs]);

  const categoryStyleByName = React.useMemo(() => {
    const map = new Map<
      string,
      { accent: string; tint: string; icon: ReturnType<typeof resolveFaqIcon> }
    >();

    allGroups.forEach((group, index) => {
      map.set(group.category, {
        ...CATEGORY_ACCENTS[index % CATEGORY_ACCENTS.length],
        icon: resolveFaqIcon(group.icon, index),
      });
    });

    return map;
  }, [allGroups]);

  const query = searchInput.trim().toLowerCase();

  const visibleGroups = React.useMemo(() => {
    return allGroups
      .filter(
        (group) => !activeCategory || group.category === activeCategory
      )
      .map((group) => ({
        ...group,
        faqs: query
          ? group.faqs.filter(
              (faq) =>
                faq.question.toLowerCase().includes(query) ||
                faq.answer.toLowerCase().includes(query)
            )
          : group.faqs,
      }))
      .filter((group) => group.faqs.length > 0);
  }, [allGroups, activeCategory, query]);

  const visibleCount = visibleGroups.reduce(
    (total, group) => total + group.faqs.length,
    0
  );

  const hasFilters = Boolean(activeCategory) || query.length > 0;

  const clearFilters = () => {
    setSearchInput("");
    setActiveCategory(null);
  };

  return (
    <div className="w-full bg-[var(--background)]">
      {/* HERO — search and topic pills */}
      <section className="bg-gradient-to-b from-[var(--primary-100)]/60 via-[var(--cream-100)] to-[var(--background)] px-6 pb-10 pt-12 sm:pt-16 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold uppercase leading-tight text-[var(--secondary-700)] sm:text-4xl lg:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[var(--neutral-600)] sm:text-base">
            Everything you need to know about our snacks — orders and shipping,
            ingredients and shelf life, festive corporate gifting, and more.
          </p>

          <div className="mt-7 flex items-center gap-2 rounded-full border border-[var(--cream-border)] bg-white p-1.5 pl-4 shadow-sm">
            <Search className="h-4 w-4 flex-shrink-0 text-[var(--neutral-400)]" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by keyword (e.g. shelf life, shipping, bulk discounts)"
              aria-label="Search FAQs"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-[var(--neutral-800)] outline-none placeholder:text-[var(--neutral-400)]"
            />
            <span className="hidden flex-shrink-0 items-center gap-1.5 rounded-full bg-[var(--secondary-700)] px-5 py-2.5 text-sm font-semibold text-white sm:inline-flex">
              Search
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>

          {allGroups.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-300 sm:text-[13px] ${
                  activeCategory === null
                    ? "bg-[var(--secondary-700)] text-white"
                    : "border border-[var(--cream-border)] bg-white text-[var(--secondary-700)] hover:border-[var(--cream-border-hover)]"
                }`}
              >
                All Topics
              </button>

              {allGroups.map((group) => (
                <button
                  key={group.category}
                  type="button"
                  onClick={() => setActiveCategory(group.category)}
                  className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-300 sm:text-[13px] ${
                    activeCategory === group.category
                      ? "bg-[var(--secondary-700)] text-white"
                      : "border border-[var(--cream-border)] bg-white text-[var(--secondary-700)] hover:border-[var(--cream-border-hover)]"
                  }`}
                >
                  {group.category}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* BODY — category sidebar and grouped accordions */}
      <section className="px-6 pb-16 pt-8 lg:px-16">
        <div className="mx-auto max-w-7xl">
          {isLoading ? (
            <FaqSkeleton />
          ) : isError ? (
            <div className="mx-auto max-w-lg rounded-2xl border border-[var(--cream-border)] bg-white px-6 py-12 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-[var(--secondary-500)]" />
              <h2 className="mt-4 text-lg font-semibold text-[var(--secondary-700)]">
                We could not load the FAQs
              </h2>
              <p className="mt-2 text-sm text-[var(--neutral-600)]">
                Something went wrong on our side. Please check your connection
                and try again.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[var(--secondary-700)] px-6 py-2.5 text-sm font-semibold text-white transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isFetching ? "Retrying..." : "Try again"}
              </button>
            </div>
          ) : allGroups.length === 0 ? (
            <div className="mx-auto max-w-lg rounded-2xl border border-[var(--cream-border)] bg-white px-6 py-12 text-center">
              <HelpCircle className="mx-auto h-8 w-8 text-[var(--neutral-400)]" />
              <h2 className="mt-4 text-lg font-semibold text-[var(--secondary-700)]">
                No FAQs available at the moment.
              </h2>
              <p className="mt-2 text-sm text-[var(--neutral-600)]">
                Please check back soon — we are putting these together.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
              {/* SIDEBAR */}
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-2xl border border-[var(--cream-border)] bg-white p-4">
                  <div className="flex items-center gap-2 border-b border-[var(--cream-border)] pb-3">
                    <List className="h-4 w-4 text-[var(--secondary-600)]" />
                    <h2 className="text-sm font-semibold text-[var(--secondary-700)]">
                      Browse Categories
                    </h2>
                  </div>

                  <ul className="mt-2 space-y-1">
                    {allGroups.map((group) => {
                      const style = categoryStyleByName.get(group.category);
                      const Icon = style?.icon ?? HelpCircle;
                      const isActive = activeCategory === group.category;

                      return (
                        <li key={group.category}>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveCategory(
                                isActive ? null : group.category
                              )
                            }
                            className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors duration-300 ${
                              isActive
                                ? "bg-[var(--cream-200)] font-semibold text-[var(--secondary-700)]"
                                : "text-[var(--neutral-700)] hover:bg-[var(--cream-100)]"
                            }`}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <Icon
                                className="h-4 w-4 flex-shrink-0"
                                style={{ color: style?.accent }}
                              />
                              <span className="truncate">{group.category}</span>
                            </span>
                            <span
                              className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
                                isActive
                                  ? "bg-[var(--secondary-700)] text-white"
                                  : "bg-[var(--cream-200)] text-[var(--neutral-600)]"
                              }`}
                            >
                              {group.faqs.length}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Static storefront trust card */}
                <div className="mt-6 hidden overflow-hidden rounded-2xl border border-[var(--cream-border)] bg-white lg:block">
                  <div className="relative h-32 w-full">
                    <Image
                      src="/images/Aboutus_ourstory_img1.jpg"
                      alt="Freshly prepared snacks at our Namakkal kitchen"
                      fill
                      sizes="260px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--secondary-900)]/85 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--primary-300)]">
                        Namakkal Heritage
                      </p>
                      <p className="text-base font-semibold text-white">
                        Fresh Daily Batches
                      </p>
                    </div>
                  </div>
                  <p className="p-4 text-xs leading-relaxed text-[var(--neutral-600)]">
                    Every tin is filled with freshly drawn boondi, stone-ground
                    flours and pristine farm-churned ghee, prepared strictly
                    against your incoming order.
                  </p>
                </div>
              </aside>

              {/* GROUPED ACCORDIONS */}
              <div>
                {visibleCount === 0 ? (
                  <div className="rounded-2xl border border-[var(--cream-border)] bg-white px-6 py-12 text-center">
                    <Search className="mx-auto h-7 w-7 text-[var(--neutral-400)]" />
                    <h2 className="mt-4 text-base font-semibold text-[var(--secondary-700)]">
                      No FAQs match your search
                    </h2>
                    <p className="mt-2 text-sm text-[var(--neutral-600)]">
                      Try a different keyword or browse all topics.
                    </p>
                    {hasFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-5 cursor-pointer rounded-full border border-[var(--cream-border)] px-5 py-2 text-sm font-semibold text-[var(--secondary-700)] transition-colors duration-300 hover:border-[var(--cream-border-hover)]"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-9">
                    {visibleGroups.map((group) => {
                      const style = categoryStyleByName.get(group.category);
                      const Icon = style?.icon ?? HelpCircle;

                      return (
                        <div key={group.category}>
                          <div className="mb-4 flex items-center gap-2.5">
                            <span
                              className="flex h-7 w-7 items-center justify-center rounded-md"
                              style={{ backgroundColor: style?.tint }}
                            >
                              <Icon
                                className="h-4 w-4"
                                style={{ color: style?.accent }}
                              />
                            </span>
                            <h2
                              className="text-lg font-bold sm:text-xl"
                              style={{ color: style?.accent }}
                            >
                              {group.category}
                            </h2>
                          </div>

                          <div className="space-y-3">
                            {group.faqs.map((faq) => (
                              <FaqAccordionItem
                                key={faq.id}
                                question={faq.question}
                                answer={faq.answer}
                                isOpen={openFaqId === faq.id}
                                onToggle={() =>
                                  setOpenFaqId((current) =>
                                    current === faq.id ? null : faq.id
                                  )
                                }
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default FaqSection;
