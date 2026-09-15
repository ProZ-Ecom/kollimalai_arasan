import Image from "next/image";
import { ReactNode } from "react";

interface AuthFormLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  showLogo?: boolean;
  bottomContent?: ReactNode;
  showFooter?: boolean;
  /** Ready-made badge/pill element rendered above the title (e.g. "User Login" / "Admin Portal"). */
  eyebrow?: ReactNode;
  /** Ready-made icon/illustration element rendered above the title. */
  icon?: ReactNode;
  /** Small link rendered near the top for switching between User and Admin login. */
  switchLink?: ReactNode;
  /** "admin" and "card" both wrap the form in a bordered card with a gradient accent bar for a more polished feel. */
  variant?: "default" | "admin" | "card";
  /** Tailwind gradient classes for the card's top accent bar. Defaults to the brand green scale. */
  accentGradient?: string;
}

export default function AuthFormLayout({
  title,
  subtitle,
  children,
  showLogo = false,
  bottomContent,
  showFooter = false,
  eyebrow,
  icon,
  switchLink,
  variant = "default",
  accentGradient = "from-secondary-600 via-secondary-500 to-secondary-300",
}: AuthFormLayoutProps) {
  const isCardVariant = variant === "admin" || variant === "card";
  return (
    <div className="mx-auto flex w-full max-w-[300px] flex-col justify-center sm:max-w-[420px] lg:max-w-[420px]">
      {/* Logo */}
      {showLogo && (
        <div className="mb-1.5 flex justify-center">
          <Image
            src="/logos/logo.svg"
            alt="Kollimalai Arasan"
            width={56}
            height={56}
            className="h-9 w-9 md:h-10 md:w-10 lg:h-11 lg:w-11"
            priority
          />
        </div>
      )}

      {/* Switch link + eyebrow badge, on one row to avoid stacked whitespace */}
      {(switchLink || eyebrow) && (
        <div className="mb-2 flex items-center justify-center gap-2.5">
          {switchLink}
          {eyebrow}
        </div>
      )}

      {/* Icon / illustration */}
      {/* {icon && <div className="mb-2 flex justify-center">{icon}</div>} */}

      {/* Heading */}
      <div className="text-center">
        <h1
          className="text-2xl font-bold leading-tight text-neutral-900 md:text-3xl"
          style={{ fontFamily: "var(--font-hanken)" }}
        >
          {title}
        </h1>

        <p className="pb-2 pt-1 text-sm leading-6 text-neutral-600 md:text-base">
          {subtitle}
        </p>
      </div>

      {/* Form */}
      {isCardVariant ? (
        <div className="relative mt-2 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg shadow-neutral-900/5 md:p-6">
          <div
            className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentGradient}`}
          />
          {children}
        </div>
      ) : (
        <div>{children}</div>
      )}

      {/* Bottom Content */}
      {bottomContent && (
        <div className="mt-4 text-center">
          {bottomContent}
        </div>
      )}

      {/* Footer */}
      {showFooter && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-neutral-500 md:text-sm">
          <a
            href="/privacy-policy"
            className="transition-colors hover:text-secondary-600"
          >
            Privacy Policy
          </a>

          <span>•</span>

          <a
            href="/terms-and-conditions"
            className="transition-colors hover:text-secondary-600"
          >
            Terms & Conditions
          </a>

          <span>•</span>

          <a
            href="/contact"
            className="transition-colors hover:text-secondary-600"
          >
            Contact Us
          </a>
        </div>
      )}
    </div>
  );
}