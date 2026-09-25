"use client";

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "./label";
import { cn, formatTitleCase } from "@/lib/utils";

export function formatSlug(val: string): string {
  return val
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");
}

interface FormInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: "sm" | "md" | "lg";
  name: string;
  label?: string;
  description?: string;
  infoMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  inputPrefix?: React.ReactNode;
  isSlug?: boolean;
  isTitleCase?: boolean;
  required?: boolean;
}

function FormInput({
  name,
  label,
  description,
  infoMessage,
  className,
  leftIcon,
  rightIcon,
  inputPrefix,
  isSlug,
  isTitleCase,
  required,
  ...props
}: FormInputProps) {
  const { control } = useFormContext();
  const [showInfo, setShowInfo] = React.useState(false);
  const infoRef = React.useRef<HTMLDivElement>(null);
  const isSlugField =
    isSlug ?? (name === "slug" || name.toLowerCase().endsWith("slug"));

  React.useEffect(() => {
    if (!showInfo) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
        setShowInfo(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showInfo]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className="pt-0 mb-3">
          {label && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <Label htmlFor={name} className="flex items-center gap-1">
                {label}
                {required && (
                  <span className="text-error-600 font-bold ml-1">*</span>
                )}
              </Label>
              {infoMessage && (
                <div className="relative inline-flex items-center" ref={infoRef}>
                  <button
                    type="button"
                    onClick={() => setShowInfo((prev) => !prev)}
                    className="text-neutral-400 hover:text-[var(--color-secondary-600)] transition-colors focus:outline-none cursor-pointer rounded-full p-0.5"
                    title="Click for more information"
                    aria-label="Information"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>

                  {showInfo && (
                    <div className="absolute right-0 top-full mt-1.5 z-50 w-72 sm:w-80 rounded-xl bg-white border border-neutral-200/90 p-3 text-xs text-neutral-700 shadow-xl shadow-neutral-900/10 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-[var(--color-secondary-600)] shrink-0 mt-0.5" />
                          <p className="leading-relaxed text-[var(--color-neutral-800)]">{infoMessage}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowInfo(false)}
                          className="text-neutral-400 hover:text-neutral-700 font-bold text-sm leading-none ml-1 p-0.5 cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <Input
            id={name}
            {...props}
            value={field.value ?? ""}
            onChange={(e) => {
              if (props.type === "number") {
                const raw = e.target.value;
                if (raw === "") {
                  field.onChange("");
                  return;
                }
                // Strip leading zeroes (e.g. "01" -> 1, but preserve decimals like "0.5")
                if (/^0[0-9]+/.test(raw)) {
                  const cleaned = raw.replace(/^0+/, "") || "0";
                  const parsed = Number(cleaned);
                  field.onChange(isNaN(parsed) ? cleaned : parsed);
                  return;
                }
                const parsedNum = Number(raw);
                field.onChange(isNaN(parsedNum) ? raw : parsedNum);
                return;
              }

              let value = e.target.value;
              if (isSlugField) {
                value = formatSlug(value);
              }

              field.onChange(value);
            }}
            onFocus={(e) => {
              if (props.type === "number" && e.target.value === "0") {
                e.target.select();
              }
              props.onFocus?.(e);
            }}
            onPaste={(e) => {
              if (isSlugField) {
                e.preventDefault();
                const pastedText = e.clipboardData.getData("text");
                const formatted = formatSlug(pastedText);

                const input = e.currentTarget;
                const start = input.selectionStart ?? 0;
                const end = input.selectionEnd ?? 0;
                const currentValue = String(field.value || "");
                const nextValue = formatSlug(
                  currentValue.slice(0, start) +
                    formatted +
                    currentValue.slice(end)
                );

                field.onChange(nextValue);
              }
              props.onPaste?.(e);
            }}
            onBlur={(e) => {
              if (isTitleCase && typeof field.value === "string") {
                const formatted = formatTitleCase(field.value);
                if (formatted !== field.value) {
                  field.onChange(formatted);
                }
              }
              field.onBlur();
              props.onBlur?.(e);
            }}
            name={field.name}
            ref={field.ref}
            className={cn(isTitleCase && "capitalize", className)}
            leftIcon={leftIcon}
            rightIcon={rightIcon}
            inputPrefix={inputPrefix}
            error={fieldState.error?.message}
          />
          {description && !fieldState.error && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}
    />
  );
}

export { FormInput };
