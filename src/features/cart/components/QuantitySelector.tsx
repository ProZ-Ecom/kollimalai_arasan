"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  size = "md",
}: QuantitySelectorProps) {
  const handleDecrement = () => {
    if (value > min && !disabled) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max && !disabled) {
      onChange(value + 1);
    }
  };

  const btnClasses = {
    sm: "h-7 w-7 rounded-lg",
    md: "h-8 w-8 rounded-lg",
    lg: "h-9 w-9 rounded-xl",
  };

  const inputClasses = {
    sm: "w-8 text-xs font-semibold",
    md: "w-10 text-sm font-semibold",
    lg: "w-12 text-base font-bold",
  };

  return (
    <div className="inline-flex items-center rounded-xl border border-theme-border bg-theme-surface-alt p-0.5 shadow-2xs">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`${btnClasses[size]} text-theme-primary hover:bg-theme-surface hover:text-theme-primary hover:shadow-2xs transition-all disabled:opacity-40 cursor-pointer`}
        onClick={handleDecrement}
        disabled={disabled || value <= min}
      >
        <Minus className="h-3 w-3" />
      </Button>

      <span
        className={`${inputClasses[size]} flex items-center justify-center text-center text-theme-text-primary select-none`}
      >
        {value}
      </span>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`${btnClasses[size]} text-theme-primary hover:bg-theme-surface hover:text-theme-primary hover:shadow-2xs transition-all disabled:opacity-40 cursor-pointer`}
        onClick={handleIncrement}
        disabled={disabled || value >= max}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}

export { QuantitySelector };

