"use client";

import * as React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { ExternalLink, Link2, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseVideoUrl } from "@/lib/utils/video-url.util";
import { FormInput } from "./form-input";

export interface FormVideoUrlProps {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  /** Helper text under the input. */
  description?: string;
  /** Tailwind classes framing the preview, e.g. "aspect-[9/16] w-full max-w-[240px]". */
  previewClassName?: string;
}

/**
 * URL input for a hosted video (YouTube, Vimeo, or a direct file link) with a
 * live preview underneath. Validation of the URL itself belongs to the form
 * schema - this component only previews what it can recognise.
 */
function FormVideoUrl({
  name,
  label,
  required,
  placeholder = "Enter video URL",
  description = "Paste the video/reels URL",
  previewClassName = "aspect-[9/16] w-full max-w-[240px]",
}: FormVideoUrlProps) {
  const { control, getFieldState, formState } = useFormContext();
  const value = useWatch({ control, name }) as string | undefined;

  const parsed = React.useMemo(() => parseVideoUrl(value), [value]);
  const hasError = Boolean(getFieldState(name, formState).error);
  const showPreview = Boolean(parsed) && !hasError;

  return (
    <div className="space-y-2">
      <FormInput
        name={name}
        label={label}
        required={required}
        type="url"
        inputMode="url"
        placeholder={placeholder}
        description={description}
        leftIcon={<Link2 className="h-4 w-4" />}
        autoComplete="off"
      />

      {showPreview && parsed && (
        <div className="rounded-xl border border-theme-border bg-theme-surface-warm p-3 sm:p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-theme-text-muted">
            Video preview
          </p>

          {parsed.embedUrl ? (
            <div
              className={cn(
                "relative mx-auto overflow-hidden rounded-lg bg-black",
                previewClassName
              )}
            >
              <iframe
                src={parsed.embedUrl}
                title="Video preview"
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : parsed.kind === "file" ? (
            <div
              className={cn(
                "relative mx-auto overflow-hidden rounded-lg bg-black",
                previewClassName
              )}
            >
              <video
                key={parsed.url}
                src={parsed.url}
                controls
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-theme-border-subtle bg-theme-surface p-3">
              <PlayCircle className="h-8 w-8 shrink-0 text-theme-text-muted" />
              <div className="min-w-0">
                <p className="text-xs text-theme-text-subtle">
                  This host cannot be embedded here. Open the link to check it
                  plays.
                </p>
                <a
                  href={parsed.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-flex max-w-full items-center gap-1 text-xs font-medium text-theme-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span className="truncate">{parsed.url}</span>
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { FormVideoUrl };
