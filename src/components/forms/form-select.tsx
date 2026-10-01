"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Select, type SelectOption } from "@/components/ui/select";
import { Label } from "./label";

interface FormSelectProps {
  name: string;
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  description?: string;
  required?: boolean;
  onSearchChange?: (query: string) => void;
  searchDebounceMs?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  showSearch?: boolean;
  selectedLabel?: string;
  disabled?: boolean;
  className?: string;
}

function FormSelect({
  name,
  label,
  options,
  placeholder,
  description,
  required,
  onSearchChange,
  searchDebounceMs,
  onLoadMore,
  hasMore,
  isLoading,
  isLoadingMore,
  showSearch,
  selectedLabel,
  disabled,
  className,
}: FormSelectProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className="space-y-2">
          {label && (
            <Label htmlFor={name}>
              {label}
              {required && <span className="text-error-600 font-bold ml-1">*</span>}
            </Label>
          )}
          <Select
            {...field}
            options={options}
            placeholder={placeholder}
            error={fieldState.error?.message}
            onSearchChange={onSearchChange}
            searchDebounceMs={searchDebounceMs}
            onLoadMore={onLoadMore}
            hasMore={hasMore}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            showSearch={showSearch}
            selectedLabel={selectedLabel}
            disabled={disabled}
            className={className}
          />
          {description && !fieldState.error && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}
    />
  );
}

export { FormSelect };
