"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  label?: string;
  description?: string;
  error?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, error, disabled, name, value, checked, onValueChange, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || `radio-${generatedId}`;

    return (
      <div className="flex items-start gap-3">
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="radio"
            id={inputId}
            name={name}
            value={value}
            checked={checked}
            disabled={disabled}
            onChange={() => onValueChange?.(value || "")}
            className="peer sr-only"
            aria-describedby={description ? `${inputId}-desc` : undefined}
            aria-invalid={!!error}
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-300",
              "bg-white transition-colors duration-200",
              "peer-checked:border-primary peer-checked:bg-primary",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              error && "border-error-600",
              className
            )}
          >
            <span className="h-2 w-2 rounded-full bg-white scale-0 transition-transform duration-200 peer-checked:scale-100" />
          </label>
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={inputId}
                className={cn(
                  "text-sm font-medium text-gray-900",
                  disabled && "opacity-50"
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p id={`${inputId}-desc`} className="text-sm text-gray-500">
                {description}
              </p>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);
Radio.displayName = "Radio";

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  label?: string;
  error?: string;
  description?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  options: RadioOption[];
  name?: string;
  className?: string;
  disabled?: boolean;
  orientation?: "horizontal" | "vertical";
}

function RadioGroup({
  label,
  error,
  description,
  value,
  onValueChange,
  options,
  name,
  className,
  disabled,
  orientation = "vertical",
}: RadioGroupProps) {
  const generatedId = React.useId();
  const groupId = `radiogroup-${generatedId}`;

  return (
    <div role="radiogroup" aria-labelledby={label ? groupId : undefined} aria-describedby={description ? `${groupId}-desc` : undefined} aria-invalid={!!error} className={cn("space-y-2", className)}>
      {label && (
        <p id={groupId} className="text-sm font-medium text-gray-900">
          {label}
        </p>
      )}
      {description && (
        <p id={`${groupId}-desc`} className="text-sm text-gray-500">
          {description}
        </p>
      )}
      <div className={cn(orientation === "horizontal" ? "flex flex-wrap gap-4" : "space-y-2")}>
        {options.map((option) => (
          <Radio
            key={option.value}
            name={name}
            value={option.value}
            label={option.label}
            description={option.description}
            checked={value === option.value}
            onValueChange={onValueChange}
            disabled={disabled || option.disabled}
          />
        ))}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

export { Radio, RadioGroup };
export type { RadioProps, RadioGroupProps, RadioOption };
