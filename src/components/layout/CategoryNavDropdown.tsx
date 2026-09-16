"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, Sparkles } from "lucide-react";
import { ICONS, CATEGORYLOGOS } from "@/constants/storefront";
import { useCustomerCategories } from "@/features/customers/hooks/use-customer-catalog";
import type { CustomerCategoryDto } from "@/features/customers/types/catalog.types";
import { getImageUrl } from "@/lib/utils";

const fallbackCategoryLogos: Record<string, string> = {
  "flavors & spices": CATEGORYLOGOS.flavourSpices,
  "sweets": CATEGORYLOGOS.sweet,
  "healthy bites": CATEGORYLOGOS.bites,
  "traditional delights": CATEGORYLOGOS.traditional,
  "bakery": CATEGORYLOGOS.bakery,
  "chips": CATEGORYLOGOS.chips,
  "namkeen": CATEGORYLOGOS.flavourSpices,
  "snacks": CATEGORYLOGOS.traditional,
  "cakes": CATEGORYLOGOS.bakery,
};

export function resolveCategoryIcon(category: CustomerCategoryDto): string {
  if (category.image?.trim()) {
    return getImageUrl(category.image);
  }
  const normalizedName = category.name.trim().toLowerCase();
  return fallbackCategoryLogos[normalizedName] || CATEGORYLOGOS.traditional;
}

export interface CategoryNavDropdownProps {
  text?: string;
  icon?: string;
  isActive?: boolean;
}

export function CategoryNavDropdown({
  text = "OUR SNACKS",
  icon = ICONS.drop_icon,
  isActive = false,
}: CategoryNavDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Fetch categories using TanStack Query from POST /api/customer/categories
  const { data: response, isLoading } = useCustomerCategories({
    page: 1,
    pageSize: 50,
    sortBy: "name",
    sortOrder: "asc",
  });

  const categories = response?.data ?? [];

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  // Close when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape key
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isCurrentActive =
    isActive || pathname.startsWith("/categories");

  return (
    <div
      ref={dropdownRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`
          group flex items-center gap-1.5 text-sm font-medium transition-all duration-150 cursor-pointer
          text-hover-primary hover:-translate-y-0.5
          ${
            isCurrentActive
              ? "text-theme-primary font-semibold"
              : "text-neutral-800"
          }
        `}
      >
        <span>{text}</span>

        {icon && (
          <div className="relative inline-flex items-center justify-center">
            <Image
              src={icon}
              alt="dropdown icon"
              width={12}
              height={12}
              className={`transition-transform duration-300 ${
                isOpen ? "rotate-180" : "group-hover:rotate-180"
              }`}
            />
          </div>
        )}
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div
          className="
            absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50
            w-72 sm:w-80 bg-white/95 backdrop-blur-md
            border border-neutral-200/80 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)]
            p-2 overflow-hidden
            animate-in fade-in slide-in-from-top-2 duration-200
          "
        >
          {/* Header Banner inside dropdown */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100 mb-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-theme-primary tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-theme-secondary" />
              <span>Explore Categories</span>
            </div>
            {/* {categories.length > 0 && (
              <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                {categories.length} Types
              </span>
            )} */}
          </div>

          {/* Categories List */}
          <div className="max-h-[320px] overflow-y-auto py-1 scrollbar-thin">
            {isLoading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={`skeleton-${n}`}
                    className="flex items-center gap-3 p-2 rounded-xl animate-pulse bg-neutral-50"
                  >
                    <div className="w-9 h-9 rounded-full bg-neutral-200 shrink-0" />
                    <div className="h-4 bg-neutral-200 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : categories.length > 0 ? (
              <div className="space-y-0.5">
                {categories.map((category) => {
                  const categoryIcon = resolveCategoryIcon(category);
                  const isCategoryActive =
                    pathname === `/categories/${category.id}`;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        router.push(`/categories/${category.id}`);
                      }}
                      className={`
                        w-full flex items-center justify-between px-3 py-2 rounded-xl text-left
                        transition-all duration-150 cursor-pointer group/item
                        ${
                          isCategoryActive
                            ? "bg-theme-surface-alt text-theme-primary font-semibold"
                            : "text-neutral-700 hover:bg-neutral-50 hover:text-theme-primary"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="
                            w-9 h-9 rounded-full bg-neutral-100/80 border border-neutral-200/50
                            flex items-center justify-center p-1 shrink-0
                            group-hover/item:scale-105 group-hover/item:border-theme-primary/30
                            transition-transform duration-200
                          "
                        >
                          <Image
                            src={categoryIcon}
                            alt={category.name}
                            width={28}
                            height={28}
                            className="w-6 h-6 object-contain"
                          />
                        </div>
                        <span className="text-sm font-medium truncate">
                          {category.name}
                        </span>
                      </div>

                      <ChevronRight
                        className={`
                          w-4 h-4 text-neutral-400 shrink-0
                          transition-transform duration-200
                          group-hover/item:translate-x-1 group-hover/item:text-theme-primary
                          ${isCategoryActive ? "text-theme-primary font-bold" : ""}
                        `}
                      />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-neutral-500">
                No categories found.
              </div>
            )}
          </div>

          {/* Footer View All Link */}
          <div className="mt-1 pt-2 border-t border-neutral-100">
            <Link
              href="/categories"
              onClick={() => setIsOpen(false)}
              className="
                flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl
                bg-neutral-50 hover:bg-theme-surface-alt
                text-xs font-semibold text-theme-primary
                transition-colors duration-150
              "
            >
              <span>View All Categories</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryNavDropdown;
