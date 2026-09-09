"use client";

import * as React from "react";
import Image from "next/image";

export interface ContactItem {
  id: number;
  icon: string;
  title: string;
  value: string;
  link: string;
}

export interface ContactCardProps {
  contact: ContactItem;
}

export function ContactCard({ contact }: ContactCardProps) {
  return (
    <a
      href={contact.link}
      target={contact.title === "WhatsApp" ? "_blank" : undefined}
      rel={contact.title === "WhatsApp" ? "noopener noreferrer" : undefined}
      className="block"
    >
      <div
        className="
          group
          bg-white
          shadow-md
          py-8
          px-6
          h-[150px]
          flex
          flex-col
          items-center
          justify-center
          cursor-pointer
          transition-all
          duration-300
          hover:-translate-y-2
          hover:shadow-xl
        "
      >
        <Image
          src={contact.icon}
          alt={contact.title}
          width={40}
          height={40}
          className="
            transition-transform
            duration-300
            group-hover:scale-110
          "
        />

        <h6
          className="
            mt-3
            text-[20px]
            font-semibold
            transition-colors
            duration-300
            text-hover-primary
            text-[var(--brown-800)]
          "
        >
          {contact.title}
        </h6>

        <p className="mt-2 text-sm header-font text-hover-primary text-[var(--brown-600)]">
          {contact.value}
        </p>
      </div>
    </a>
  );
}

export default ContactCard;
