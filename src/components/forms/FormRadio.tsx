"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FormRadioProps {
  label: string;
  description?: string;
  value: string;
  checked?: boolean;
  disabled?: boolean;
  error?: string;
  name?: string;
  onChange?: (value: string) => void;
  className?: string;
}

const FormRadio = React.forwardRef<HTMLInputElement, FormRadioProps>(
  ({ className, label, description, value, checked, disabled, error, name, onChange }, ref) => {
    const id = React.useId();

    return (
      <div className="flex items-start gap-3">
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="radio"
            id={id}
            name={name}
            value={value}
            checked={checked}
            disabled={disabled}
            onChange={() => onChange?.(value)}
            className="peer sr-only"
            aria-invalid={!!error}
          />
          <label
            htmlFor={id}
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
            {checked && <span className="h-2 w-2 rounded-full bg-white" />}
          </label>
        </div>
        <div className="flex flex-col">
          <label
            htmlFor={id}
            className={cn("text-sm font-medium text-gray-900", disabled && "opacity-50")}
          >
            {label}
          </label>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </div>
    );
  }
);
FormRadio.displayName = "FormRadio";

export { FormRadio };
export type { FormRadioProps };
