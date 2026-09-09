"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
  debounceMs?: number;
}

function SearchInput({
  className,
  onSearch,
  debounceMs = 300,
  placeholder = "Search...",
  value: propValue,
  defaultValue,
  ...props
}: SearchInputProps) {
  const [value, setValue] = React.useState(
    propValue !== undefined ? propValue : (defaultValue || "")
  );
  const onSearchRef = React.useRef(onSearch);

  React.useEffect(() => {
    if (propValue !== undefined) {
      setValue(propValue);
    }
  }, [propValue]);

  React.useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onSearchRef.current?.(value as string);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [value, debounceMs]);

  return (
    <div className={cn("relative w-full", className)}>
      <Input
        leftIcon={<Search className="h-4 w-4 text-theme-text-muted" />}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={cn(
          "h-11 rounded-xl border-theme-border bg-theme-surface text-theme-text-primary placeholder:text-theme-text-muted hover:border-theme-border-accent focus:border-theme-primary",
          value ? "pr-10" : ""
        )}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            onSearchRef.current?.("");
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text-muted hover:text-theme-primary cursor-pointer p-1 z-10"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export { SearchInput };
