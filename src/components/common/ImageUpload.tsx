"use client";

import * as React from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageCropperModal } from "./ImageCropperModal";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  accept?: string;
  className?: string;
  disabled?: boolean;
  cropWidth?: number;
  cropHeight?: number;
  enableCrop?: boolean;
}

function ImageUpload({
  value,
  onChange,
  accept = "image/*",
  className,
  disabled,
  cropWidth = 500,
  cropHeight = 500,
  enableCrop = true,
}: ImageUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = React.useState("");

  // Crop state
  const [cropSrc, setCropSrc] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!enableCrop) {
      const preview = URL.createObjectURL(file);
      onChange(preview);
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    setCropSrc(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleCropConfirm = (_croppedFile: File, previewUrl: string) => {
    if (cropSrc) {
      URL.revokeObjectURL(cropSrc);
    }
    setCropSrc(null);
    setSelectedFile(null);
    onChange(previewUrl);
  };

  const handleCropCancel = () => {
    if (cropSrc) {
      URL.revokeObjectURL(cropSrc);
    }
    setCropSrc(null);
    setSelectedFile(null);
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput("");
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
          value
            ? "border-primary/50 bg-primary/5"
            : "border-gray-300 bg-gray-50 hover:border-primary/50 hover:bg-primary/5",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        {value ? (
          <div className="relative w-full max-w-xs">
            <img
              src={value}
              alt="Preview"
              className="mx-auto max-h-40 rounded-md object-contain"
            />
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
                className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-white hover:bg-destructive/90"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="text-center">
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              Click to upload or drag and drop
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {accept.replace("image/", ".").toUpperCase()} supported
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="url"
          placeholder="Or paste an image URL"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm",
            "placeholder:text-gray-500",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
        <button
          type="button"
          onClick={handleUrlSubmit}
          disabled={disabled || !urlInput.trim()}
          className={cn(
            "inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-white",
            "hover:bg-primary/90 transition-colors",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          Add
        </button>
      </div>

      {/* Image Cropper Modal */}
      <ImageCropperModal
        open={Boolean(cropSrc)}
        imageSrc={cropSrc}
        originalFileName={selectedFile?.name}
        mimeType={selectedFile?.type || "image/jpeg"}
        title="Crop Image"
        description={`Reposition and zoom to fit the ${cropWidth} × ${cropHeight} px area.`}
        cropWidth={cropWidth}
        cropHeight={cropHeight}
        onCropConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    </div>
  );
}

export { ImageUpload };
export type { ImageUploadProps };
