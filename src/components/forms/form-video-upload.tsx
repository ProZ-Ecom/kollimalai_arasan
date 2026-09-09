"use client";

import React, { useRef, useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormVideoUploadProps {
  name: string;
  label: string;
  folder?: string;
  className?: string;
  aspectRatioClassName?: string;
  required?: boolean;
  maxSizeMB?: number;
}

function FormVideoUpload({
  name,
  label,
  folder = "banners",
  className,
  aspectRatioClassName = "aspect-[9/16] w-full max-h-80",
  required,
  maxSizeMB = 30,
}: FormVideoUploadProps) {
  const { control } = useFormContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    field,
    fieldState: { error },
  } = useController({ name, control });

  const videoUrl = field.value as string;

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      setFileError(null);

      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        throw new Error(
          `Video size cannot exceed ${maxSizeMB}MB (Selected: ${(
            file.size /
            (1024 * 1024)
          ).toFixed(2)}MB).`
        );
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Video upload failed");
      }

      field.onChange(result.data.path);
    } catch (err: any) {
      console.error("Video upload error:", err);
      setFileError(err?.message || "Video upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayError = fileError || error?.message;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[var(--color-neutral-700)]">
          {label}
          {required && <span className="text-error-600 font-bold ml-1">*</span>}
        </label>
        <span className="text-xs font-medium text-neutral-400">
          Max size: {maxSizeMB} MB
        </span>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-neutral-300)] bg-[var(--color-neutral-50)] transition-all hover:border-[var(--color-primary-500)] hover:bg-white overflow-hidden mx-auto",
          aspectRatioClassName,
          displayError && "border-[var(--color-error-500)]",
          className
        )}
      >
        {videoUrl ? (
          <>
            <video
              src={videoUrl}
              className="h-full w-full object-contain bg-black"
              controls
              muted
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                field.onChange("");
                setFileError(null);
              }}
              className="absolute right-3 top-3 rounded-full bg-white p-2 shadow-md hover:bg-neutral-100 transition-colors z-10"
              title="Remove video"
            >
              <X className="h-4 w-4 text-[var(--color-neutral-700)]" />
            </button>
          </>
        ) : isUploading ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary-500)] border-t-transparent" />
            <p className="text-sm text-[var(--color-neutral-500)]">
              Uploading video...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2.5 text-center px-4">
            <div className="rounded-full bg-white p-3 shadow-sm">
              <Upload className="h-6 w-6 text-[var(--color-neutral-500)]" />
            </div>
            <div>
              <p className="font-medium text-[var(--color-neutral-700)] text-sm">
                Upload Video
              </p>
              <p className="text-xs text-[var(--color-neutral-500)] mt-0.5">
                MP4, WebM, MOV • Max {maxSizeMB}MB • Portrait (9:16) recommended
              </p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {displayError && (
        <p className="text-xs font-medium text-[var(--color-error-600)]">
          {displayError}
        </p>
      )}
    </div>
  );
}

export { FormVideoUpload };
