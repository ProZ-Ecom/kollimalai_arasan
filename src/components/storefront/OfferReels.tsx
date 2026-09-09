"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCustomerBanners } from "@/features/banners/hooks";
import { parseVideoUrl } from "@/lib/utils/video-url.util";
import type { CustomerBannerDto } from "@/features/banners/types";

const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";

/**
 * True on pointer-precise (desktop) devices. Server-rendered as false so the
 * markup matches on hydration, then resolved in the browser.
 */
function useFinePointer(): boolean {
  return React.useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(FINE_POINTER_QUERY);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(FINE_POINTER_QUERY).matches,
    () => false
  );
}

/**
 * Floating reel player pinned to the bottom-right of the page.
 *
 * Reels come from the `home-reels` banner position, so the active flag and the
 * start/end window configured in the admin are already applied by
 * /api/customer/banners - anything returned here is live.
 *
 * It sits at z-40: above page content, but below the sticky header and the
 * mobile bottom navigation (both z-50) so it can never cover them.
 */
export function OfferReels() {
  const { data: reels } = useCustomerBanners({ position: "home-reels" });
  const isFinePointer = useFinePointer();
  const [isClosed, setIsClosed] = React.useState(false);
  const [index, setIndex] = React.useState(0);

  // Only video reels with a link we can actually render are shown; a broken or
  // unsupported URL is skipped rather than left as an empty black box.
  const playableReels = React.useMemo(
    () =>
      (reels ?? []).filter(
        (reel): reel is CustomerBannerDto =>
          reel.mediaType === "video" && Boolean(parseVideoUrl(reel.videoUrl))
      ),
    [reels]
  );

  const safeIndex = playableReels.length ? index % playableReels.length : 0;
  const reel = playableReels[safeIndex];
  const source = parseVideoUrl(reel?.videoUrl);

  if (isClosed || !reel || !source) return null;

  const hasMultiple = playableReels.length > 1;

  // YouTube's mobile embed paints a black frame when autoplay is requested, so
  // only ask for it on desktop - phones get the normal thumbnail + play button.
  // Looping a single YouTube video also needs its id as a one-item playlist.
  const embedParams =
    source.kind === "youtube"
      ? [
          isFinePointer ? "autoplay=1" : "",
          "mute=1",
          "loop=1",
          "playsinline=1",
          "rel=0",
          `playlist=${source.id ?? ""}`,
        ]
          .filter(Boolean)
          .join("&")
      : [isFinePointer ? "autoplay=1" : "", "muted=1", "loop=1"]
          .filter(Boolean)
          .join("&");

  return (
    <div
      className="
        fixed z-40 isolate
        right-3 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)]
        lg:right-5 lg:bottom-5
        w-[7.5rem] sm:w-[8.5rem] lg:w-[10rem]
        animate-in fade-in slide-in-from-bottom-4 duration-300
      "
      role="complementary"
      aria-label="Offer reel"
    >
      {/* Close sits outside the clipped video frame so it never collides with
          the embedded player's own top-right controls. */}
      <button
        type="button"
        onClick={() => setIsClosed(true)}
        aria-label="Close offer reel"
        className="absolute -right-1.5 -top-1.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-neutral-900)] text-white shadow-lg ring-2 ring-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary-500)] cursor-pointer"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-black shadow-xl shadow-black/25 ring-1 ring-black/10">
        {source.embedUrl ? (
          <iframe
            key={source.url}
            src={`${source.embedUrl}?${embedParams}`}
            title={reel.title || "Offer reel"}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            key={source.url}
            src={source.url}
            poster={reel.imageUrl || undefined}
            className="absolute inset-0 h-full w-full object-cover"
            controls
            autoPlay
            muted
            loop
            playsInline
          />
        )}

        {reel.title && (
          <p className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-6 text-[11px] font-medium text-white">
            {reel.title}
          </p>
        )}
      </div>

      {hasMultiple && (
        <div className="mt-1.5 flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              setIndex(
                (current) =>
                  (current - 1 + playableReels.length) % playableReels.length
              )
            }
            aria-label="Previous reel"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-[11px] font-medium text-[var(--color-neutral-600)]">
            {safeIndex + 1}/{playableReels.length}
          </span>
          <button
            type="button"
            onClick={() =>
              setIndex((current) => (current + 1) % playableReels.length)
            }
            aria-label="Next reel"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 cursor-pointer"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default OfferReels;
