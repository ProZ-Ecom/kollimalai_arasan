"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FormSwitchProps {
  label?: string;
  description?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
  id?: string;
}

const FormSwitch = React.forwardRef<HTMLButtonElement, FormSwitchProps>(
  ({ className, label, description, checked = false, onCheckedChange, disabled, error, id }, ref) => {
    const generatedId = React.useId();
    const switchId = id || `form-switch-${generatedId}`;

    return (
      <div className="flex items-start gap-3">
        <button
          ref={ref}
          id={switchId}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onCheckedChange?.(!checked)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
            "border-2 border-transparent transition-colors duration-300 ease-in-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            checked ? "bg-emerald-500" : "bg-neutral-300",
            error && "ring-2 ring-red-500 ring-offset-2",
            className
          )}
        >
          <span
            className={cn(
              "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-md",
              "ring-0 transition-transform duration-300 ease-in-out transform",
              checked ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={switchId}
                className={cn("text-sm font-medium text-gray-900", disabled && "opacity-50")}
              >
                {label}
              </label>
            )}
            {description && <p className="text-sm text-gray-500">{description}</p>}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);
FormSwitch.displayName = "FormSwitch";

export { FormSwitch };
export type { FormSwitchProps };
