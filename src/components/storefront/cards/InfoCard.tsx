"use client";

import * as React from "react";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";

export interface InfoCardProps {
  image: string;
  alt: string;
  title: string;
  subtitle?: string;
  cardClassName?: string;
  imageWrapperClassName?: string;
  imageClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  imageWidth?: number;
  imageHeight?: number;
}

export function InfoCard({
  image,
  alt,
  title,
  subtitle,
  cardClassName = "",
  imageWrapperClassName = "",
  imageClassName = "",
  titleClassName = "",
  subtitleClassName = "",
  imageWidth = 140,
  imageHeight = 140,
}: InfoCardProps) {
  return (
    <div className={`group cursor-pointer ${cardClassName}`}>
      <div className={imageWrapperClassName}>
        <Image
          src={getImageUrl(image)}
          alt={alt}
          width={imageWidth}
          height={imageHeight}
          className={imageClassName}
        />
      </div>

      <p className={titleClassName}>{title}</p>

      {subtitle && <p className={subtitleClassName}>{subtitle}</p>}
    </div>
  );
}

export default InfoCard;
