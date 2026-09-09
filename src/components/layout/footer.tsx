"use client";

import * as React from "react";
import Image from "next/image";
import {
  LOGOS,
  ICONS,
  contacts as defaultContacts,
  footerSocialIcons,
  readyToAssist,
  mainMenu,
} from "@/constants/storefront";
import { ContactCard, ContactItem } from "@/components/storefront/cards/ContactCard";
import { FooterLinks } from "@/components/storefront/footer/FooterLinks";
import { IconButton } from "@/components/storefront/buttons/IconButton";
import { useCustomerCompany } from "@/features/customers/hooks/use-customer-company";
import { getImageUrl } from "@/lib/utils";

export function Footer() {
  const [email, setEmail] = React.useState("");
  const [isSubscribed, setIsSubscribed] = React.useState(false);

  const { data: company } = useCustomerCompany();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubscribed(true);
      setTimeout(() => {
        setEmail("");
        setIsSubscribed(false);
      }, 3000);
    }
  };

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
    const defaultCallVal = defaultContacts[0]?.value || "+91 9486150579";
    const callValue = formatPhoneDisplay(phone, defaultCallVal);
    const callDigits = (phone || defaultCallVal).replace(/\D/g, "");
    const cleanCallNumber = callDigits.length === 10 ? `91${callDigits}` : callDigits;
    const callLink = cleanCallNumber ? `tel:+${cleanCallNumber}` : "tel:+919486150579";

    // 2. WhatsApp (uses phonenumber field value as specified)
    const defaultWaVal = defaultContacts[1]?.value || "+91 8667380899";
    const waValue = formatPhoneDisplay(phone, defaultWaVal);
    const waDigits = (phone || defaultWaVal).replace(/\D/g, "");
    const cleanWaNumber = waDigits.length === 10 ? `91${waDigits}` : waDigits;
    const waLink = cleanWaNumber
      ? `https://wa.me/${cleanWaNumber}`
      : "https://wa.me/918667380899";

    // 3. Mail
    const companyEmail = company?.email?.trim();
    const mailValue =
      companyEmail || defaultContacts[2]?.value || "rithanyafoods@gmail.com";
    const mailLink = companyEmail
      ? `mailto:${companyEmail}`
      : defaultContacts[2]?.link || "mailto:rithanyafoods@gmail.com";

    return [
      {
        id: 1,
        icon: ICONS.call,
        title: "Call",
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

  // Company Name
  const companyName =
    company?.companyName?.trim() || "Rithanya Food Products and Exports";

  // Company Logo
  const companyLogo = company?.logo ? getImageUrl(company.logo) : LOGOS.logo;

  // Formatted Location Address
  const formattedLocation = React.useMemo(() => {
    if (!company) {
      return "6/1033, Thillai Nagar Trichy Road, Namakkal - 637 002.";
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
      return "6/1033, Thillai Nagar Trichy Road, Namakkal - 637 002.";
    }

    return parts.join(", ");
  }, [company]);

  const mapsUrl = React.useMemo(() => {
    if (!company?.address && !company?.city) {
      return "https://www.google.com/maps/place/RITHU'S+SNACKS/@11.1971509,78.1334803,13.77z/data=!4m6!3m5!1s0x3babcf3326ff1e47:0xafbe7c7cb1da0dd4!8m2!3d11.1995895!4d78.1815903!16s%2Fg%2F11vlt_cxvy?entry=ttu";
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formattedLocation)}`;
  }, [company, formattedLocation]);

  return (
    <footer className="relative pt-12">
      {/* Floating Contact Cards */}
      <div className="relative z-10 lg:translate-y-12 mb-6 lg:mb-0">
        <div className="grid md:grid-cols-3 gap-5 max-w-[1100px] mx-auto px-4">
          {dynamicContacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      </div>

      {/* Main Brown Footer Area */}
      <div className="bg-[var(--brown-700)] min-h-[350px] pt-10 lg:pt-24 text-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col gap-10 lg:justify-between lg:flex-row">
            {/* Column 1: Ready to Assist */}
            <FooterLinks
              title="Ready to Assist"
              items={readyToAssist}
              className="mb-2"
            />

            {/* Column 2: Main Menu */}
            <FooterLinks
              title="Main Menu"
              items={mainMenu}
              className="mb-2"
            />

            {/* Column 3: Newsletter Sign Up */}
            <div>
              <h3 className="text-[24px] sm:text-[28px] lg:text-xl font-semibold mb-6">
                Sign Up and Save
              </h3>

              <p className="text-gray-200 header-font">
                Join Our Newsletter for Updates & Offers
              </p>

              {isSubscribed ? (
                <div className="mt-8 py-2 text-sm text-amber-300 font-medium header-font">
                  ✓ Thank you for subscribing!
                </div>
              ) : (
                <form
                  onSubmit={handleSubscribe}
                  className="mt-8 border-b border-gray-300 flex items-center pb-3 header-font max-w-[300px] lg:max-w-none transition-colors duration-300 hover:border-white"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Your Email"
                    className="flex-1 bg-transparent outline-hidden text-white placeholder:text-gray-300 text-sm"
                  />

                  {email.trim() ? (
                    <button
                      type="submit"
                      className="bg-[var(--brown-600)] text-white px-4 py-1 rounded-md text-sm transition-all duration-300 hover:bg-[var(--brown-500)] cursor-pointer"
                    >
                      Submit
                    </button>
                  ) : (
                    <Image
                      src={ICONS.mail}
                      alt="mail"
                      width={20}
                      height={20}
                      className="invert transition-all duration-300"
                    />
                  )}
                </form>
              )}

              {/* Social Icons */}
              <div className="flex mt-7 gap-5">
                {footerSocialIcons.map((item) => (
                  <IconButton
                    key={item.id}
                    icon={item.icon}
                    alt={item.name}
                    imageClassName="w-[30px] h-[30px]"
                    className="hover:-translate-y-1"
                  />
                ))}
              </div>
            </div>

            {/* Column 4: Brand Logo & Address */}
            <div className="mt-2 lg:mt-0">
              <div className="flex justify-center">
                <Image
                  src={companyLogo}
                  alt={companyName}
                  width={90}
                  height={90}
                  className="transition-transform duration-300 hover:scale-105 object-contain"
                />
              </div>

              <h3 className="text-xl lg:text-2xl font-semibold mt-5 text-center">
                {companyName}
              </h3>

              <div className="flex gap-2 mt-4 justify-center lg:justify-start">
                <Image
                  src={ICONS.location}
                  alt="location_icon"
                  width={25}
                  height={25}
                />
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="header-font text-sm hover:underline text-gray-200"
                >
                  {formattedLocation}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className="mt-8 h-[3px] bg-[var(--brown-600)]" />

        {/* Copyright Bar */}
        <div className="flex flex-col gap-2 py-5 text-sm text-gray-200 header-font text-center lg:flex-row lg:justify-between lg:items-center lg:text-left lg:px-8 max-w-[1400px] mx-auto">
          <p className="header-font">
            Copyright © {new Date().getFullYear()} {companyName}. All Rights Reserved.
          </p>

          <p className="header-font">
            Design and Developed By ProZ Solutions LLP.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

