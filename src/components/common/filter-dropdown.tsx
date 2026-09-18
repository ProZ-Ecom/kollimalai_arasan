"use client";

import * as React from "react";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FilterDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

function FilterDropdown({
  label,
  options,
  value,
  onChange,
  className,
}: FilterDropdownProps) {
  const allOptions = [
    { value: "", label },
    ...options,
  ];

  return (
    <Select
      value={value ?? ""}
      onValueChange={(val) => onChange?.(val)}
      options={allOptions}
      wrapperClassName={cn("w-full sm:w-44", className)}
      size="sm"
      className="h-10 rounded-xl text-xs font-medium"
    />
  );
}

export { FilterDropdown };

