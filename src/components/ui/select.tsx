"use client";

import * as React from "react";
import { ChevronDown, Check, Search, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  slug?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  [key: string]: any;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children" | "size"> {
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  onValueChange?: (value: string) => void;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "warm" | "ghost";
  dropdownPosition?: "top" | "bottom" | "auto";
  contentClassName?: string;
  wrapperClassName?: string;

  // ── Async / Infinite Scroll & Debounced Search Props ──
  onSearchChange?: (query: string) => void;
  searchDebounceMs?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  showSearch?: boolean;
  selectedLabel?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      options = [],
      placeholder = "Select an option",
      error,
      disabled = false,
      value: controlledValue,
      defaultValue,
      onChange,
      onValueChange,
      name,
      id,
      icon,
      leftIcon,
      rightIcon,
      size = "md",
      variant = "default",
      dropdownPosition = "bottom",
      contentClassName,
      wrapperClassName,
      onSearchChange,
      searchDebounceMs = 300,
      onLoadMore,
      hasMore = false,
      isLoading = false,
      isLoadingMore = false,
      showSearch,
      selectedLabel,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState<string>(
      (controlledValue !== undefined
        ? controlledValue
        : defaultValue !== undefined
        ? defaultValue
        : "") as string
    );
    const [searchQuery, setSearchQuery] = React.useState("");

    const containerRef = React.useRef<HTMLDivElement>(null);
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const hiddenSelectRef = React.useRef<HTMLSelectElement | null>(null);
    const lastKnownLabelRef = React.useRef<string | null>(null);

    // Sync controlled value if passed
    React.useEffect(() => {
      if (controlledValue !== undefined) {
        setInternalValue(String(controlledValue));
      }
    }, [controlledValue]);

    // Handle outside click
    React.useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setSearchQuery("");
        }
      }

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]);

    // Debounced search callback for server search
    React.useEffect(() => {
      if (!onSearchChange) return;
      const timer = setTimeout(() => {
        onSearchChange(searchQuery);
      }, searchDebounceMs);

      return () => clearTimeout(timer);
    }, [searchQuery, onSearchChange, searchDebounceMs]);

    // Focus search input when dropdown opens
    const isSearchable = Boolean(showSearch || onSearchChange || options.length > 6);
    React.useEffect(() => {
      if (isOpen && isSearchable) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    }, [isOpen, isSearchable]);

    // Keyboard navigation (Escape to close)
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setSearchQuery("");
      } else if (e.key === "ArrowDown" && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    const handleSelectOption = (option: SelectOption) => {
      if (option.disabled || disabled) return;

      const newValue = option.value;
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      lastKnownLabelRef.current = option.label;
      setIsOpen(false);
      setSearchQuery("");

      if (hiddenSelectRef.current) {
        hiddenSelectRef.current.value = newValue;
        const changeEvent = new Event("change", { bubbles: true });
        hiddenSelectRef.current.dispatchEvent(changeEvent);
      }

      if (onValueChange) {
        onValueChange(newValue);
      }

      if (onChange) {
        const syntheticEvent = {
          target: { name, value: newValue, id },
          currentTarget: { name, value: newValue, id },
        } as unknown as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
    };

    // Filter options: if onSearchChange is provided, server handles filtering.
    // Otherwise filter in-memory options by label.
    const filteredOptions = React.useMemo(() => {
      if (onSearchChange) return options;
      if (!searchQuery.trim()) return options;
      const query = searchQuery.toLowerCase().trim();
      return options.filter((opt) =>
        opt.value !== "" && opt.label.toLowerCase().includes(query)
      );
    }, [options, searchQuery, onSearchChange]);

    // Selected option label resolution
    const selectedOption = options.find(
      (opt) => String(opt.value) === String(internalValue)
    );
    if (selectedOption) {
      lastKnownLabelRef.current = selectedOption.label;
    }

    const displayLabel =
      selectedOption?.label ||
      selectedLabel ||
      lastKnownLabelRef.current ||
      placeholder;

    const sizeClasses = {
      sm: "h-9 px-3 rounded-lg text-xs",
      md: "h-11 px-3.5 rounded-xl text-xs sm:text-sm font-semibold",
      lg: "h-12 px-4 rounded-xl text-sm font-semibold",
    };

    const effectiveRightIcon = rightIcon || icon;

    // Infinite scroll handler on list container
    const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollHeight - scrollTop - clientHeight < 40) {
        if (hasMore && !isLoadingMore && !isLoading && onLoadMore) {
          onLoadMore();
        }
      }
    };

    return (
      <div
        className={cn("w-full relative", wrapperClassName, isOpen && "z-[60]")}
        ref={containerRef}
        onKeyDown={handleKeyDown}
      >
        {/* Hidden Native Select for Form Libraries (e.g. react-hook-form) */}
        <select
          ref={(node) => {
            hiddenSelectRef.current = node;
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              (ref as React.MutableRefObject<HTMLSelectElement | null>).current = node;
            }
          }}
          name={name}
          id={id}
          value={internalValue}
          onChange={onChange || (() => {})}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only pointer-events-none"
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom Select Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={cn(
            "flex w-full items-center justify-between border bg-theme-surface text-theme-text-primary transition-all text-left cursor-pointer",
            sizeClasses[size],
            "outline-none focus:outline-none focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/20",
            isOpen
              ? "border-theme-primary ring-2 ring-theme-primary/20 bg-theme-surface"
              : "border-theme-border hover:border-theme-border-accent hover:bg-theme-surface-warm",
            error && "border-theme-status-can-fg focus:border-theme-status-can-fg focus:ring-theme-status-can-fg/20",
            disabled && "cursor-not-allowed bg-theme-surface-alt opacity-60 hover:border-theme-border",
            className
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2 truncate">
            {leftIcon && (
              <span className="shrink-0 text-theme-text-muted">{leftIcon}</span>
            )}
            <span
              className={cn(
                "truncate",
                !selectedOption && !selectedLabel && !lastKnownLabelRef.current
                  ? "text-theme-text-muted font-normal"
                  : "text-theme-text-primary font-medium"
              )}
            >
              {displayLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {effectiveRightIcon && (
              <span className="text-theme-text-muted">{effectiveRightIcon}</span>
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-theme-text-muted transition-transform duration-200",
                isOpen && "rotate-180 text-theme-primary"
              )}
            />
          </div>
        </button>

        {/* Custom Dropdown List - Scrollable and Contained */}
        {isOpen && (
          <div
            className={cn(
              "absolute left-0 right-0 z-[100] overflow-hidden rounded-xl border border-theme-border bg-theme-surface shadow-2xl animate-in zoom-in-95 duration-150 min-w-[140px]",
              dropdownPosition === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
              contentClassName
            )}
            role="listbox"
          >
            {/* Search Input for Long Lists or Async Search */}
            {isSearchable && (
              <div className="border-b border-theme-border-subtle p-2 bg-theme-surface-alt">
                <div className="relative flex items-center">
                  <Search className="absolute left-2.5 h-3.5 w-3.5 text-theme-text-muted pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search options..."
                    className="h-8 w-full rounded-md border border-theme-border bg-theme-surface pl-8 pr-7 text-xs text-theme-text-primary placeholder:text-theme-text-muted outline-none focus:outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary/20"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchQuery("");
                        if (onSearchChange) onSearchChange("");
                        searchInputRef.current?.focus();
                      }}
                      className="absolute right-2 text-theme-text-muted hover:text-theme-text-primary p-0.5 rounded cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Scrollable Options Area with Infinite Scroll */}
            <div
              onScroll={handleListScroll}
              className="max-h-56 overflow-y-auto p-1.5 space-y-0.5"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-xs text-theme-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-theme-primary" />
                  <span>Loading options...</span>
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-theme-text-muted">
                  Search not found
                </div>
              ) : (
                <>
                  {filteredOptions.map((option) => {
                    const isSelected =
                      String(option.value) === String(internalValue) &&
                      option.value !== "";

                    return (
                      <div
                        key={option.value}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelectOption(option)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs sm:text-sm transition-colors cursor-pointer select-none",
                          isSelected
                            ? "bg-theme-surface-alt font-bold text-theme-primary"
                            : "text-theme-text-primary hover:bg-theme-surface-alt hover:text-theme-primary",
                          option.disabled &&
                            "cursor-not-allowed opacity-40 hover:bg-transparent pointer-events-none select-none"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {option.icon && (
                            <span className="shrink-0 text-theme-text-muted">{option.icon}</span>
                          )}
                          <span className="truncate">{option.label}</span>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 shrink-0 text-theme-primary" />
                        )}
                      </div>
                    );
                  })}

                  {isLoadingMore && (
                    <div className="flex items-center justify-center gap-2 py-2.5 text-xs text-theme-text-muted border-t border-theme-border-subtle mt-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-theme-primary" />
                      <span>Loading more...</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && <p className="mt-1 text-xs text-theme-status-can-fg font-medium">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select, Select as Dropdown };
