"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { LOGOS } from "@/constants/storefront";
import { useCustomerBanners } from "@/features/banners/hooks";

export function Banner() {
  const { data: offerBanners } = useCustomerBanners({ position: "home-offer" });

  if (!offerBanners || offerBanners.length === 0) {
    return (
      <div className="w-full">
        <Image
          src={LOGOS.banner}
          alt="banner"
          width={1400}
          height={400}
          className="w-full h-auto"
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      {offerBanners.map((banner) => {
        const image = (
          <Image
            src={banner.imageUrl}
            alt={banner.title || "Offer banner"}
            width={1400}
            height={400}
            className="w-full h-auto"
          />
        );
        return (
          <div key={banner.id} className="w-full">
            {banner.linkUrl ? <Link href={banner.linkUrl}>{image}</Link> : image}
          </div>
        );
      })}
    </div>
  );
}

export default Banner;
