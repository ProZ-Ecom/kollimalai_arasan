"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import {
  LOGOS,
  ICONS,
  contacts as defaultContacts,
  footerSocialIcons,
  readyToAssist,
} from "@/constants/storefront";
import type { ContactItem } from "@/components/storefront/cards/ContactCard";
import { FooterLinks } from "@/components/storefront/footer/FooterLinks";
import { useCustomerCompany } from "@/features/customers/hooks/use-customer-company";
import { useMainNavigation } from "@/hooks/use-main-navigation";
import { getImageUrl } from "@/lib/utils";

export function Footer() {

  const { data: company } = useCustomerCompany();
  const { items: navItems } = useMainNavigation();


  // Dynamic Contact Cards based on Company API
  const dynamicContacts: ContactItem[] = React.useMemo(() => {
    const phone = company?.phone?.trim();

    const formatPhoneDisplay = (
      rawPhone: string | null | undefined,
      defaultVal: string
    ): string => {
      const target = rawPhone?.trim() || defaultVal;
      if (!target) return "";

      const digits = target.replace(/\D/g, "");
      if (digits.length === 12 && digits.startsWith("91")) {
        return `+91 ${digits.slice(2)}`;
      }
      if (digits.length === 10) {
        return `+91 ${digits}`;
      }
      if (digits.length > 10 && digits.startsWith("91")) {
        return `+91 ${digits.slice(2)}`;
      }

      // Fallback for other international formats
      const match = target.match(/^(\+\d{1,3})\s*(.*)$/);
      if (match) {
        const countryCode = match[1];
        const numberPart = match[2].replace(/\s+/g, "");
        return numberPart ? `${countryCode} ${numberPart}` : countryCode;
      }

      return target;
    };

    // 1. Call
    const defaultCallVal = defaultContacts[0]?.value || "+91 7418188950";
    const callValue = formatPhoneDisplay(phone, defaultCallVal);
    const callDigits = (phone || defaultCallVal).replace(/\D/g, "");
    const cleanCallNumber = callDigits.length === 10 ? `91${callDigits}` : callDigits;
    const callLink = cleanCallNumber ? `tel:+${cleanCallNumber}` : "tel:+917418188950";

    // 2. WhatsApp (uses phonenumber field value as specified)
    const defaultWaVal = defaultContacts[1]?.value || "+91 7418188950";
    const waValue = formatPhoneDisplay(phone, defaultWaVal);
    const waDigits = (phone || defaultWaVal).replace(/\D/g, "");
    const cleanWaNumber = waDigits.length === 10 ? `91${waDigits}` : waDigits;
    const waLink = cleanWaNumber
      ? `https://wa.me/${cleanWaNumber}`
      : "https://wa.me/917418188950";

    // 3. Mail
    const companyEmail = company?.email?.trim();
    const mailValue =
      companyEmail || defaultContacts[2]?.value || "contact@kollimalaiarasan.com";
    const mailLink = companyEmail
      ? `mailto:${companyEmail}`
      : defaultContacts[2]?.link || "mailto:contact@kollimalaiarasan.com";

    return [
      {
        id: 1,
        icon: ICONS.call,
        title: "Contact Us",
        value: callValue,
        link: callLink,
      },
      {
        id: 2,
        icon: ICONS.whatsapp,
        title: "WhatsApp",
        value: waValue,
        link: waLink,
      },
      {
        id: 3,
        icon: ICONS.mail,
        title: "Mail",
        value: mailValue,
        link: mailLink,
      },
    ];
  }, [company]);

  // WhatsApp Link for Social Links
  const waLink = React.useMemo(() => {
    return dynamicContacts.find((c) => c.id === 2)?.link || "https://wa.me/917418188950";
  }, [dynamicContacts]);

  // Company Name
  const companyName =
    company?.companyName?.trim() || "Kollimalai Arasan";

  // Company Logo
  const companyLogo = company?.logo ? getImageUrl(company.logo) : LOGOS.logo;

  // Formatted Location Address
  const formattedLocation = React.useMemo(() => {
    if (!company) {
      return "Kollimalai Arasan, Thuraiyur Road, N Kosavampatti, Namakkal 637002";
    }

    const parts: string[] = [];
    if (company.address?.trim()) parts.push(company.address.trim());
    if (company.city?.trim()) parts.push(company.city.trim());

    const statePinParts: string[] = [];
    if (company.state?.trim()) statePinParts.push(company.state.trim());
    if (company.pincode?.trim()) statePinParts.push(company.pincode.trim());

    if (statePinParts.length > 0) {
      parts.push(statePinParts.join(" - "));
    }

    if (parts.length === 0) {
      return "Kollimalai Arasan, Thuraiyur Road, N Kosavampatti, Namakkal 637002";
    }

    return parts.join(", ");
  }, [company]);

  const mapsUrl = React.useMemo(() => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formattedLocation)}`;
  }, [formattedLocation]);

  return (
    <footer className="header-font">
      {/* ================================================================ */}
      {/* Main panel - brand, link columns, contact details                */}
      {/* ================================================================ */}
      <div className="bg-footer-bg">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10 lg:py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand, address, socials */}
            <div>
              <Link href="/" className="inline-block" aria-label="Home">
                <Image
                  src={companyLogo}
                  alt={companyName}
                  width={160}
                  height={110}
                  className="w-[130px] h-auto rounded-lg object-contain"
                />
              </Link>

              <h3 className="mt-5 text-lg font-bold text-secondary-500">
                MKT &amp; Packed By :
              </h3>

              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-start gap-2 max-w-[240px] text-sm leading-relaxed text-theme-text-primary hover:text-secondary-500 transition-colors"
              >
                <MapPin
                  className="w-4 h-4 mt-0.5 shrink-0 text-secondary-500"
                  strokeWidth={1.75}
                />
                <span>{formattedLocation}</span>
              </a>

              <div className="mt-5 flex items-center gap-3">
                {footerSocialIcons.map((item) => {
                  const href =
                    item.name === "whatsapp" ? waLink : (item.href ?? "#");
                  return (
                    <a
                      key={item.id}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.name}
                      className="grid place-items-center w-8 h-8 rounded-md bg-secondary-500 hover:bg-secondary-600 transition-colors"
                    >
                      <Image
                        src={item.icon}
                        alt=""
                        aria-hidden="true"
                        width={16}
                        height={16}
                        className="w-4 h-4 brightness-0 invert"
                      />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Quick Links - same source as the header nav, so they cannot drift */}
            <FooterLinks title="Quick Links" items={navItems} />

            {/* Here to Help */}
            <FooterLinks title="Here to Help" items={readyToAssist} />

            {/* Contact details */}
            <div className="space-y-5">
              {dynamicContacts.map((contact) => (
                <a
                  key={contact.id}
                  href={contact.link}
                  target={contact.link.startsWith("http") ? "_blank" : undefined}
                  rel={
                    contact.link.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="flex items-start gap-3 group"
                >
                  <span className="grid place-items-center w-9 h-9 rounded-lg border-2 border-secondary-500 shrink-0 transition-colors group-hover:bg-secondary-50">
                    <Image
                      src={contact.icon}
                      alt=""
                      aria-hidden="true"
                      width={18}
                      height={18}
                      className="w-[18px] h-[18px]"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold text-secondary-500 leading-tight">
                      {contact.title}
                    </span>
                    <span className="block text-sm text-theme-text-primary break-words">
                      {contact.value}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Bottom bar                                                       */}
      {/* ================================================================ */}
      <div className="bg-theme-primary text-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-4 flex flex-col gap-2 text-xs sm:text-sm text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>
            Copyright &copy; {new Date().getFullYear()} {companyName}. All
            Rights Reserved.
          </p>
          <p>
            Design and Developed By{" "}
            <a
              href="https://prozsolutions.in"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              ProZ Solutions LLP.
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;