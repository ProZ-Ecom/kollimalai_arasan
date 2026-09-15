"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Mountain, Play, ExternalLink } from "lucide-react";
import { ProductImage } from "@/components/common/ProductImage";
import { parseVideoUrl, getVideoThumbnailUrl } from "@/lib/utils/video-url.util";

export interface GalleryImage {
  id: string;
  url: string;
  altText?: string | null;
}

type GalleryMediaItem =
  | { type: "image"; id: string; url: string; altText?: string | null }
  | {
      type: "video";
      id: string;
      url: string;
      embedUrl?: string;
      isFile: boolean;
      thumbnailUrl: string | null;
    };

interface ProductGalleryProps {
  images: GalleryImage[];
  videoUrl?: string | null;
  productName: string;
  className?: string;
  isVeg?: boolean;
  isInStock?: boolean;
}

function ProductGallery({
  images,
  videoUrl,
  productName,
  className,
  isVeg = true,
  isInStock = true,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const validImages = (images || []).filter((img) => img && img.url && img.url.trim() !== "");

  const parsedVideo = useMemo(() => parseVideoUrl(videoUrl), [videoUrl]);

  const mediaItems: GalleryMediaItem[] = useMemo(() => {
    const items: GalleryMediaItem[] = validImages.map((img) => ({
      type: "image",
      id: img.id,
      url: img.url,
      altText: img.altText,
    }));

    if (parsedVideo) {
      items.push({
        type: "video",
        id: "video",
        url: parsedVideo.url,
        embedUrl: parsedVideo.embedUrl,
        isFile: parsedVideo.kind === "file",
        thumbnailUrl: getVideoThumbnailUrl(videoUrl),
      });
    }

    return items;
  }, [validImages, parsedVideo, videoUrl]);

  const photoCount = mediaItems.filter((item) => item.type === "image").length;
  const videoCount = mediaItems.filter((item) => item.type === "video").length;

  const renderThumb = (item: GalleryMediaItem, index: number) => (
    <button
      key={`${item.id || index}-${index}`}
      type="button"
      onClick={() => setSelectedIndex(index)}
      className={cn(
        "relative h-18 w-18 shrink-0 overflow-hidden rounded-xl border-2 transition-all p-0.5 bg-white",
        selectedIndex === index
          ? "border-[#007F06] ring-2 ring-[#007F06]/20 shadow-xs scale-102"
          : "border-neutral-200 hover:border-neutral-400 opacity-70 hover:opacity-100"
      )}
    >
      {item.type === "image" ? (
        <ProductImage
          src={item.url}
          alt={item.altText || `${productName} ${index + 1}`}
          containerClassName="w-full h-full rounded-lg"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="relative h-full w-full overflow-hidden rounded-lg bg-neutral-800">
          {item.thumbnailUrl && (
            <ProductImage
              src={item.thumbnailUrl}
              alt={`${productName} video`}
              containerClassName="w-full h-full rounded-lg"
              className="w-full h-full object-cover"
            />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-neutral-900">
              <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
            </span>
          </span>
        </div>
      )}
    </button>
  );

  const topBadges = (
    <>
      <div className="absolute top-3.5 left-3.5 z-20 flex flex-wrap gap-2">
        {isVeg && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary-50 text-secondary-800 border border-secondary-200/80 shadow-2xs backdrop-blur-xs">
            <Mountain className="w-3 h-3" />
            Hill-grown
          </span>
        )}
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shadow-2xs backdrop-blur-xs",
            isInStock
              ? "bg-white/90 text-neutral-700 border-neutral-200/80"
              : "bg-rose-50 text-rose-700 border-rose-200/80"
          )}
        >
          {isInStock ? "In Stock" : "Out of Stock"}
        </span>
      </div>
    </>
  );

  if (mediaItems.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-primary-200/50 bg-gradient-to-br from-[#FFFFFF] to-[#FAFAFA] shadow-xs group">
          {topBadges}

          <ProductImage
            src={null}
            alt={productName}
            fallbackText={productName}
            containerClassName="w-full h-full aspect-square"
            className="w-full h-full"
          />
        </div>
      </div>
    );
  }

  const selected = mediaItems[selectedIndex] || mediaItems[0];

  const mainViewer = (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-50 shadow-xs group">
      {topBadges}

      {selected.type === "image" ? (
        <ProductImage
          src={selected.url}
          alt={selected.altText || productName}
          fallbackText={productName}
          priority={true}
          containerClassName="w-full h-full aspect-square"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : selected.embedUrl ? (
        <iframe
          src={selected.embedUrl}
          title={`${productName} video`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : selected.isFile ? (
        <video src={selected.url} controls className="w-full h-full object-contain bg-black" />
      ) : (
        <a
          href={selected.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-full w-full flex-col items-center justify-center gap-2 bg-black text-white"
        >
          <Play className="h-10 w-10" />
          <span className="inline-flex items-center gap-1 text-xs font-medium underline">
            <ExternalLink className="h-3 w-3" /> Open video link
          </span>
        </a>
      )}

      {mediaItems.length > 1 && (
        <>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-neutral-700 shadow-md h-9 w-9 rounded-full border border-neutral-200 transition-transform active:scale-95"
            onClick={() => setSelectedIndex((i) => (i > 0 ? i - 1 : mediaItems.length - 1))}
            aria-label="Previous item"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-neutral-700 shadow-md h-9 w-9 rounded-full border border-neutral-200 transition-transform active:scale-95"
            onClick={() => setSelectedIndex((i) => (i < mediaItems.length - 1 ? i + 1 : 0))}
            aria-label="Next item"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}
    </div>
  );

  const mediaCountLabel =
    mediaItems.length > 1
      ? [
          photoCount > 0 ? `${photoCount} PHOTO${photoCount > 1 ? "S" : ""}` : null,
          videoCount > 0 ? `${videoCount} VIDEO${videoCount > 1 ? "S" : ""}` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : null;

  return (
    <div className={cn("flex flex-col sm:flex-row gap-4", className)}>
      {/* Vertical thumbnail rail (desktop) */}
      {mediaItems.length > 1 && (
        <div className="hidden sm:flex sm:flex-col sm:w-20 sm:shrink-0 gap-2.5">
          <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[27rem] scrollbar-thin">
            {mediaItems.map((item, index) => renderThumb(item, index))}
          </div>
          {mediaCountLabel && (
            <p className="text-[10px] font-semibold tracking-wide text-neutral-400 uppercase text-center">
              {mediaCountLabel}
            </p>
          )}
        </div>
      )}

      <div className="flex-1 min-w-0 space-y-4">
        {mainViewer}

        {/* Horizontal thumbnail strip (mobile) */}
        {mediaItems.length > 1 && (
          <div className="sm:hidden space-y-1.5">
            <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
              {mediaItems.map((item, index) => renderThumb(item, index))}
            </div>
            {mediaCountLabel && (
              <p className="text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">
                {mediaCountLabel}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export { ProductGallery };
