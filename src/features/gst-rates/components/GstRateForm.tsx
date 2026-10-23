"use client";

import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAdminGstRateSchema } from "../validations/admin-gst-rate.schema";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Percent, Lock, Calculator } from "lucide-react";
import type { z } from "zod";

type GstRateFormData = z.infer<typeof createAdminGstRateSchema>;

interface GstRateFormProps {
  initialData?: Partial<GstRateFormData>;
  isEditing?: boolean;
  onSubmit: (data: GstRateFormData) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

const COMMON_GST_PRESETS = [
  { label: "0% (Exempt)", rate: 0 },
  { label: "5%", rate: 5 },
  { label: "12%", rate: 12 },
  { label: "18%", rate: 18 },
  { label: "28%", rate: 28 },
];

export function GstRateForm({
  initialData,
  isEditing = false,
  onSubmit,
  isLoading = false,
  submitLabel = "Save GST Rate",
}: GstRateFormProps) {
  // Determine initial total GST rate from initialData (defaults to igstPercent or cgst+sgst)
  const initialTotalRate =
    initialData?.igstPercent !== undefined
      ? initialData.igstPercent
      : (initialData?.cgstPercent ?? 0) + (initialData?.sgstPercent ?? 0);

  const [totalGstRate, setTotalGstRate] = useState<string>(
    initialTotalRate !== undefined && initialTotalRate !== null
      ? String(initialTotalRate)
      : ""
  );

  const methods = useForm<GstRateFormData>({
    resolver: zodResolver(createAdminGstRateSchema) as any,
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: initialData?.name || "",
      cgstPercent: initialData?.cgstPercent ?? 0,
      sgstPercent: initialData?.sgstPercent ?? 0,
      igstPercent: initialData?.igstPercent ?? 0,
    },
  });

  const { setValue, watch, register } = methods;
  const currentName = watch("name");
  const cgstVal = watch("cgstPercent") ?? 0;
  const sgstVal = watch("sgstPercent") ?? 0;
  const igstVal = watch("igstPercent") ?? 0;

  useEffect(() => {
    if (initialData) {
      const initTotal =
        initialData?.igstPercent !== undefined
          ? initialData.igstPercent
          : (initialData?.cgstPercent ?? 0) + (initialData?.sgstPercent ?? 0);
      setTotalGstRate(initTotal !== undefined && initTotal !== null ? String(initTotal) : "");
      methods.reset({
        name: initialData?.name || "",
        cgstPercent: initialData?.cgstPercent ?? 0,
        sgstPercent: initialData?.sgstPercent ?? 0,
        igstPercent: initialData?.igstPercent ?? 0,
      });
    }
  }, [initialData, methods]);

  // Helper to apply a total GST rate and auto-divide by 2 for CGST/SGST and match IGST
  const applyGstRate = (rate: number, isPreset = false) => {
    const safeRate = Math.max(0, Math.min(100, isNaN(rate) ? 0 : rate));
    const halfRate = Number((safeRate / 2).toFixed(4));

    setValue("cgstPercent", halfRate, { shouldValidate: true, shouldDirty: true });
    setValue("sgstPercent", halfRate, { shouldValidate: true, shouldDirty: true });
    setValue("igstPercent", safeRate, { shouldValidate: true, shouldDirty: true });
    setTotalGstRate(String(safeRate));

    // Auto-suggest name if name is empty or matches previous auto-generated name pattern
    const isAutoName = !currentName || currentName.startsWith("GST ") || isPreset;
    if (isAutoName && !isEditing) {
      if (safeRate === 0) {
        setValue("name", "GST 0% (Exempt)", { shouldValidate: true, shouldDirty: true });
      } else {
        setValue("name", `GST ${safeRate}%`, { shouldValidate: true, shouldDirty: true });
      }
    }
  };

  const handleTotalGstInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setTotalGstRate(raw);

    if (raw.trim() === "") {
      setValue("cgstPercent", 0, { shouldValidate: true, shouldDirty: true });
      setValue("sgstPercent", 0, { shouldValidate: true, shouldDirty: true });
      setValue("igstPercent", 0, { shouldValidate: true, shouldDirty: true });
      return;
    }

    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      applyGstRate(parsed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent minus sign, exponential notation, and plus
    if (e.key === "-" || e.key === "Minus" || e.key === "e" || e.key === "E" || e.key === "+") {
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasteData = e.clipboardData.getData("text");
    if (pasteData.includes("-")) {
      e.preventDefault();
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(async (data) => {
          const rateNum = parseFloat(totalGstRate) || 0;
          const finalName =
            data.name?.trim() ||
            (rateNum === 0 ? "GST 0% (Exempt)" : `GST ${rateNum}%`);

          await onSubmit({
            name: finalName,
            cgstPercent: Number(data.cgstPercent) || 0,
            sgstPercent: Number(data.sgstPercent) || 0,
            igstPercent: Number(data.igstPercent) || 0,
          });
        })}
        className="space-y-6"
      >
        {/* Hidden inputs to guarantee values are registered with React Hook Form */}
        <input type="hidden" {...register("name")} />
        <input type="hidden" {...register("cgstPercent", { valueAsNumber: true })} />
        <input type="hidden" {...register("sgstPercent", { valueAsNumber: true })} />
        <input type="hidden" {...register("igstPercent", { valueAsNumber: true })} />

        {/* Primary GST Rate Input Panel */}
        <div className="rounded-2xl border border-theme-border bg-theme-surface-alt/70 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="text-xs font-bold text-theme-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5 text-theme-secondary" />
                GST Rate Percentage (%)
                <span className="text-error-600 font-bold">*</span>
              </label>
              <p className="text-xs text-theme-text-muted mt-0.5">
                Enter the total GST percentage (or 0% for tax-exempt products).
              </p>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-theme-text-muted mr-1 hidden sm:inline">
                Presets:
              </span>
              {COMMON_GST_PRESETS.map((preset) => {
                const isSelected = totalGstRate === String(preset.rate);
                return (
                  <button
                    key={preset.rate}
                    type="button"
                    onClick={() => applyGstRate(preset.rate, true)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer select-none ${
                      isSelected
                        ? "bg-theme-secondary text-theme-secondary-fg border-theme-secondary shadow-xs font-bold ring-1 ring-theme-secondary"
                        : "bg-white border-theme-border text-theme-text-secondary hover:border-theme-secondary hover:text-theme-primary active:scale-95"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Master Rate Input */}
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="any"
              value={totalGstRate}
              onChange={handleTotalGstInputChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Enter GST rate percentage"
              className="w-full h-11 px-4 pr-10 rounded-xl border border-theme-border-input bg-white text-base font-bold text-theme-text-primary placeholder:text-theme-text-muted/60 focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/15 focus:outline-none transition-all"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-theme-text-muted pointer-events-none">
              %
            </div>
          </div>
        </div>

        {/* Auto-Calculated Sub-Taxes Breakdown (Read-Only) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-theme-secondary" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-theme-text-secondary">
                Auto-Calculated Tax Breakdown
              </h4>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-theme-text-muted bg-theme-surface px-2 py-0.5 rounded-md border border-theme-border-subtle">
              <Lock className="h-3 w-3 text-theme-text-muted" />
              Automatic (Non-editable)
            </span>
          </div>

          {/* Breakdown Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* CGST */}
            <div className="rounded-xl border border-theme-border bg-white p-3.5 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-xs font-bold text-theme-text-primary">CGST</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-theme-text-primary font-mono tracking-tight">
                  {cgstVal}%
                </span>
              </div>
              <p className="text-[11px] text-theme-text-muted mt-1.5">
                Intra-state split (50%)
              </p>
            </div>

            {/* SGST */}
            <div className="rounded-xl border border-theme-border bg-white p-3.5 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-xs font-bold text-theme-text-primary">SGST</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-theme-text-primary font-mono tracking-tight">
                  {sgstVal}%
                </span>
              </div>
              <p className="text-[11px] text-theme-text-muted mt-1.5">
                Intra-state split (50%)
              </p>
            </div>

            {/* IGST */}
            <div className="rounded-xl border border-theme-border bg-white p-3.5 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-xs font-bold text-theme-text-primary">IGST</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-theme-text-primary font-mono tracking-tight">
                  {igstVal}%
                </span>
              </div>
              <p className="text-[11px] text-theme-text-muted mt-1.5">
                Inter-state total (100%)
              </p>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end pt-2 border-t border-theme-border-subtle">
          <FormSubmitButton
            isLoading={isLoading}
            className="w-full sm:w-auto h-11 rounded-xl bg-theme-primary px-7 text-sm font-bold text-white hover:bg-theme-primary-hover shadow-xs transition-all cursor-pointer"
          >
            {submitLabel}
          </FormSubmitButton>
        </div>
      </form>
    </FormProvider>
  );
}