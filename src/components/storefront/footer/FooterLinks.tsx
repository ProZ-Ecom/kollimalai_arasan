"use client";

import * as React from "react";

export interface FooterLinksProps {
  title: string;
  items: string[];
  className?: string;
}

export function FooterLinks({
  title,
  items,
  className = "",
}: FooterLinksProps) {
  const footerLinkClass =
    "cursor-pointer transition-colors duration-300 hover:text-white";

  return (
    <div className={className}>
      <h3 className="text-[24px] sm:text-[28px] lg:text-xl font-semibold mb-6">
        {title}
      </h3>

      <ul className="space-y-3 text-gray-200 header-font">
        {items.map((item) => (
          <li key={item} className={footerLinkClass}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FooterLinks;
