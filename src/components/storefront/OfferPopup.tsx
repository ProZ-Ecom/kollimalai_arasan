"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useCustomerBanners } from "@/features/banners/hooks";

const STORAGE_KEY = "offerPopupLastShown";

function hasBeenShownToday(bannerId: string): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const { id, date } = JSON.parse(stored) as { id: string; date: string };
    return id === bannerId && date === new Date().toDateString();
  } catch {
    return false;
  }
}

function markShownToday(bannerId: string) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ id: bannerId, date: new Date().toDateString() })
    );
  } catch {
    // localStorage unavailable (private browsing, etc.) - skip persisting
  }
}

export function OfferPopup() {
  const { data: popupBanners } = useCustomerBanners({
    position: "home-popup-offer",
  });
  const [isOpen, setIsOpen] = React.useState(false);

  const banner = popupBanners?.[0] ?? null;

  React.useEffect(() => {
    if (!banner) return;
    if (hasBeenShownToday(banner.id)) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
      markShownToday(banner.id);
    }, 800);

    return () => clearTimeout(timer);
  }, [banner]);

  if (!isOpen || !banner) return null;

  const image = (
    <Image
      src={banner.imageUrl}
      alt={banner.title || "Special offer"}
      width={800}
      height={800}
      className="w-full h-auto rounded-2xl"
    />
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md animate-in zoom-in-95 duration-200"
      >
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute -top-3 -right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-700 shadow-lg hover:text-neutral-900 cursor-pointer"
          aria-label="Close offer"
        >
          <X className="h-5 w-5" />
        </button>

        {banner.linkUrl ? <Link href={banner.linkUrl}>{image}</Link> : image}
      </div>
    </div>,
    document.body
  );
}

export default OfferPopup;
