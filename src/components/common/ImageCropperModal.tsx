"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area, type Point } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Crop as CropIcon, X } from "lucide-react";
import { getCroppedImg } from "@/lib/utils/crop-image.util";

export interface ImageCropperModalProps {
  open: boolean;
  imageSrc: string | null;
  originalFileName?: string;
  mimeType?: string;
  title?: string;
  description?: string;
  cropWidth?: number;
  cropHeight?: number;
  queueIndex?: number;
  queueTotal?: number;
  onCropConfirm: (croppedFile: File, previewUrl: string) => void | Promise<void>;
  onCancel: () => void;
}

export function ImageCropperModal({
  open,
  imageSrc,
  originalFileName = "image.jpg",
  mimeType = "image/jpeg",
  title = "Crop Image",
  description,
  cropWidth = 500,
  cropHeight = 500,
  queueIndex,
  queueTotal,
  onCropConfirm,
  onCancel,
}: ImageCropperModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const [crop, setCrop] = React.useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(null);
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate dynamic aspect ratio based on configurable dimensions
  const aspect = React.useMemo(() => {
    const w = cropWidth > 0 ? cropWidth : 500;
    const h = cropHeight > 0 ? cropHeight : 500;
    return w / h;
  }, [cropWidth, cropHeight]);

  // Reset zoom & pan when image source changes
  React.useEffect(() => {
    if (imageSrc) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [imageSrc]);

  // Lock body scroll while modal is active
  React.useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  const handleCropComplete = React.useCallback(
    (_croppedArea: Area, currentCroppedAreaPixels: Area) => {
      setCroppedAreaPixels(currentCroppedAreaPixels);
    },
    []
  );

  const handleConfirm = async () => {
    if (!imageSrc) return;

    try {
      setIsGenerating(true);
      const result = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        cropWidth,
        cropHeight,
        mimeType,
        originalFileName
      );

      await onCropConfirm(result.file, result.previewUrl);
    } catch (err) {
      console.error("Failed to generate cropped image:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!open || !imageSrc || !mounted) return null;

  const isMultiple = Boolean(queueTotal && queueTotal > 1);

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop with high z-index overlay */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-all duration-200"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className="relative z-10 w-full max-w-lg rounded-2xl border border-cream-border bg-white p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-4">
          {/* Header with Title and Queue Badge */}
          <div className="flex items-start justify-between gap-3 pr-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
                  {title}
                </h3>
                {isMultiple && (
                  <span className="px-2 py-0.5 rounded-full bg-cream-100 border border-cream-border text-[11px] font-bold text-secondary-600">
                    Image {queueIndex ?? 1} of {queueTotal}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                {description ||
                  `Output size: ${cropWidth} × ${cropHeight} px. Drag to reposition and zoom as needed.`}
              </p>
            </div>
          </div>

          {/* Crop Area Container */}
          <div className="relative w-full h-[300px] sm:h-[360px] rounded-xl overflow-hidden bg-neutral-950 border border-cream-border shadow-inner select-none">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
              showGrid={false}
              classes={{
                containerClassName: "rounded-xl",
                cropAreaClassName: "!border-2 !border-white/90 !shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]",
              }}
            />
          </div>

          {/* Zoom Controls */}
          <div className="p-3 rounded-xl bg-cream-100 border border-cream-border space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-700">
              <span className="flex items-center gap-1.5">
                <CropIcon className="w-3.5 h-3.5 text-secondary-600" />
                <span>Zoom</span>
              </span>
              <span className="font-mono text-[11px] text-neutral-500">
                {zoom.toFixed(2)}x
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, +(z - 0.2).toFixed(2)))}
                disabled={zoom <= 1 || isGenerating}
                className="p-1.5 rounded-lg border border-cream-border bg-white text-neutral-700 hover:bg-secondary-50 hover:text-secondary-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Zoom out"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                disabled={isGenerating}
                className="w-full accent-secondary-600 h-1.5 bg-cream-border rounded-lg cursor-pointer"
                aria-label="Zoom level slider"
              />

              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, +(z + 0.2).toFixed(2)))}
                disabled={zoom >= 3 || isGenerating}
                className="p-1.5 rounded-lg border border-cream-border bg-white text-neutral-700 hover:bg-secondary-50 hover:text-secondary-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Zoom in"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isGenerating}
              className="px-4 py-2 text-xs font-semibold rounded-xl border-cream-border text-neutral-700 hover:bg-cream-100 cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleConfirm}
              isLoading={isGenerating}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-secondary-600 hover:bg-secondary-700 text-cream-white shadow-xs cursor-pointer transition-colors"
            >
              {isMultiple && queueIndex !== undefined && queueTotal !== undefined && queueIndex < queueTotal
                ? "Crop & Continue"
                : "Confirm Crop"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
