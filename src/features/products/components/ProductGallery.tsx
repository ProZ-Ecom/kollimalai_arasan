"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  ExternalLink,
  Heart,
  Sparkles,
} from "lucide-react";
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

export interface ProductGalleryProps {
  images: GalleryImage[];
  videoUrl?: string | null;
  productName: string;
  className?: string;
  isVeg?: boolean;
  isInStock?: boolean;
  isWishlisted?: boolean;
  onWishlistToggle?: (e?: React.MouseEvent) => void;
}

export function ProductGallery({
  images,
  videoUrl,
  productName,
  className,
  isVeg = true,
  isInStock = true,
  isWishlisted = false,
  onWishlistToggle,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const validImages = useMemo(() => {
    return (images || []).filter((img) => img && img.url && img.url.trim() !== "");
  }, [images]);

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

  // Derived index so changing variant/images never goes out of bounds
  const activeIndex = selectedIndex < mediaItems.length ? selectedIndex : 0;

  const topBadges = (
    <div className="absolute top-3.5 left-3.5 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
      {isVeg && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white/95 text-emerald-800 border border-emerald-300/80 shadow-2xs backdrop-blur-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-emerald-200" />
          100% Veg
        </span>
      )}
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-neutral-800 border border-neutral-200 shadow-2xs backdrop-blur-xs">
        <Sparkles className="w-3 h-3 text-[#F8BE15]" />
        Traditional Recipe
      </span>
      {!isInStock && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs backdrop-blur-xs">
          Out of Stock
        </span>
      )}
    </div>
  );

  const wishlistButton = onWishlistToggle && (
    <button
      type="button"
      onClick={onWishlistToggle}
      className={cn(
        "absolute top-3.5 right-3.5 z-20 h-9 w-9 rounded-full flex items-center justify-center transition-all shadow-md backdrop-blur-xs cursor-pointer active:scale-90 border",
        isWishlisted
          ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
          : "bg-white/90 text-neutral-600 hover:text-rose-600 hover:bg-white border-neutral-200/80"
      )}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart className={cn("w-4.5 h-4.5 transition-colors", isWishlisted && "fill-rose-600 text-rose-600")} />
    </button>
  );

  if (mediaItems.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-neutral-200/80 bg-neutral-50 shadow-xs group">
          {topBadges}
          {wishlistButton}

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

  const selected = mediaItems[activeIndex] || mediaItems[0];

  const mainViewer = (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-50 shadow-xs group">
      {topBadges}
      {wishlistButton}

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
        <div className="relative w-full h-full bg-black flex items-center justify-center">
          <iframe
            src={`${selected.embedUrl}${selected.embedUrl.includes("?") ? "&" : "?"}autoplay=1`}
            title={`${productName} video`}
            className="w-full h-full rounded-2xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : selected.isFile ? (
        <video
          src={selected.url}
          controls
          autoPlay
          playsInline
          className="w-full h-full object-contain bg-black rounded-2xl"
        />
      ) : (
        <a
          href={selected.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-full w-full flex-col items-center justify-center gap-3 bg-neutral-950 text-white p-6 text-center"
        >
          <div className="w-14 h-14 rounded-full bg-[#007F06] flex items-center justify-center shadow-lg">
            <Play className="h-7 w-7 fill-current ml-1 text-white" />
          </div>
          <span className="text-sm font-bold">Watch Video on External Player</span>
          <span className="inline-flex items-center gap-1.5 text-xs text-neutral-300 underline hover:text-white">
            <ExternalLink className="h-3.5 w-3.5" /> Open link in new tab
          </span>
        </a>
      )}

      {/* Prev / Next Slide Arrows */}
      {mediaItems.length > 1 && (
        <>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-neutral-700 shadow-md h-9 w-9 rounded-full border border-neutral-200 transition-transform active:scale-95 cursor-pointer z-10"
            onClick={() => setSelectedIndex(activeIndex > 0 ? activeIndex - 1 : mediaItems.length - 1)}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-neutral-700 shadow-md h-9 w-9 rounded-full border border-neutral-200 transition-transform active:scale-95 cursor-pointer z-10"
            onClick={() => setSelectedIndex(activeIndex < mediaItems.length - 1 ? activeIndex + 1 : 0)}
            aria-label="Next image"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}
    </div>
  );

  const renderThumb = (item: GalleryMediaItem, index: number) => {
    const isSelected = activeIndex === index;
    return (
      <button
        key={`${item.id || index}-${index}`}
        type="button"
        onClick={() => setSelectedIndex(index)}
        className={cn(
          "relative h-18 w-18 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all p-0.5 bg-white cursor-pointer select-none",
          isSelected
            ? "border-[#007F06] ring-2 ring-[#007F06]/20 shadow-xs scale-102"
            : "border-neutral-200 hover:border-neutral-400 opacity-75 hover:opacity-100 hover:scale-101"
        )}
        aria-label={`View ${item.type === "video" ? "product video" : `image ${index + 1}`}`}
      >
        {item.type === "image" ? (
          <ProductImage
            src={item.url}
            alt={item.altText || `${productName} thumbnail ${index + 1}`}
            containerClassName="w-full h-full rounded-lg"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="relative h-full w-full overflow-hidden rounded-lg bg-neutral-900 flex items-center justify-center">
            {item.thumbnailUrl ? (
              <ProductImage
                src={item.thumbnailUrl}
                alt={`${productName} video thumbnail`}
                containerClassName="w-full h-full rounded-lg"
                className="w-full h-full object-cover opacity-80"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-950" />
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-[#007F06] text-white shadow-xs">
                <Play className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current ml-0.5" />
              </span>
            </span>
            <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[8px] font-black text-white uppercase tracking-wider">
              Video
            </span>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* 1. Main Large Viewer on top */}
      {mainViewer}

      {/* 2. Horizontal Thumbnails Row placed UNDER the main image (matching requested design) */}
      {mediaItems.length > 1 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-2 pt-1 px-0.5 scrollbar-thin">
            {mediaItems.map((item, index) => renderThumb(item, index))}
          </div>

          <p className="text-[11px] font-medium text-neutral-400">
            {activeIndex + 1} of {mediaItems.length} media
          </p>
        </div>
      )}
    </div>
  );
}

export default ProductGallery;
