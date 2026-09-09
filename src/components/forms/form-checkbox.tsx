"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";

interface FormCheckboxProps {
  name: string;
  label: string;
  description?: string;
}

function FormCheckbox({ name, label, description }: FormCheckboxProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="space-y-1">
          <Checkbox
            label={label}
            checked={field.value}
            onChange={field.onChange}
          />
          {description && (
            <p className="text-xs text-muted-foreground pl-6">
              {description}
            </p>
          )}
        </div>
      )}
    />
  );
}

export { FormCheckbox };
