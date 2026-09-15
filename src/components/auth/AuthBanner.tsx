"use client";

import Image from "next/image";
import { ShieldCheck, LayoutDashboard, KeyRound } from "lucide-react";

const features = [
  {
    icon: "/icons/fresh_icon.svg",
    title: "100%",
    subtitle: "Pure",
  },
  {
    icon: "/icons/checkout_icon.svg",
    title: "Secure",
    subtitle: "Checkout",
  },
  {
    icon: "/icons/delivery_icon.svg",
    title: "Fast",
    subtitle: "Delivery",
  },
];

const adminFeatures = [
  { icon: ShieldCheck, title: "Secure", subtitle: "Access" },
  { icon: LayoutDashboard, title: "Live", subtitle: "Dashboard" },
  { icon: KeyRound, title: "Role", subtitle: "Based Access" },
];

interface AuthBannerProps {
  /** "admin" renders a professional, dashboard-style portal banner instead of the storefront banner. */
  variant?: "user" | "admin";
}

export default function AuthBanner({ variant = "user" }: AuthBannerProps) {
  if (variant === "admin") {
    return (
      <div
        className="relative hidden h-screen overflow-hidden lg:flex"
        style={{
          backgroundImage: 'url("/images/admin_banner.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Light professional scrim so the photo stays visible while text on top stays readable */}
        <div className="absolute inset-0 bg-neutral-900/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/90 via-neutral-900/25 to-transparent" />

        {/* Subtle radial accent */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(0,127,6,0.22),transparent_55%)]" />

        {/* Content */}
        <div className="absolute inset-0 flex items-end">
          <div className="w-full px-12 pb-12 text-white">
            <div className="max-w-md">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
                <ShieldCheck size={28} className="text-secondary-300" />
              </div>

              <h1
                className="text-[30px] font-bold leading-[34px]"
                style={{ fontFamily: "var(--font-hanken)" }}
              >
                Manage Kollimalai Arasan with confidence.
              </h1>

              <p
                className="mt-5 text-[12px] leading-5 text-white/70"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                A secure, role-based portal for the Kollimalai Arasan team to
                manage orders, catalog, and customers.
              </p>

              {/* Feature Cards */}
              <div className="mt-10 flex gap-4">
                {adminFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.subtitle}
                      className="flex h-[54px] w-[150px] items-center gap-3 rounded-xl bg-white/10 px-4 ring-1 ring-white/10 backdrop-blur-sm"
                    >
                      <Icon size={20} className="shrink-0 text-secondary-300" />

                      <div>
                        <p className="text-[12px] font-semibold leading-none text-white">
                          {feature.title}
                        </p>
                        <p className="mt-1 text-[12px] font-semibold text-white/80">
                          {feature.subtitle}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative hidden h-screen overflow-hidden lg:flex"
      style={{
        backgroundImage: 'url("/images/login_banner.png")',
        backgroundSize: "cover",
        backgroundPosition: "30% center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/35" />

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex items-end">
        <div className="w-full px-12 pb-12 text-white">
          <div className="max-w-md">
            <h1
              className="text-[30px] font-bold leading-[30px]"
              style={{ fontFamily: "var(--font-hanken)" }}
            >
              Farm-Fresh Spices &
Mountain Millets Direct to Kitchen.
            </h1>

            <p
              className="mt-5 text-[12px] leading-4 text-white/90"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Grown at 1,300m elevation in the nutrient-dense red soil of Kollimalai. Unpolished, chemical-free, sun-dried, and aromatic spice batches milled fresh every week.
            </p>

            {/* Feature Cards */}
            <div className="mt-10 flex gap-4">
              {features.map((feature) => (
                <div
                  key={feature.subtitle}
                  className="flex h-[54px] w-[150px] items-center gap-3 rounded-xl bg-white px-4 shadow-xl"
                >
                  <Image
                    src={feature.icon}
                    alt={feature.subtitle}
                    width={22}
                    height={22}
                  />

                  <div>
                    <p
                      className="text-[12px] font-semibold leading-none"
                      style={{ color: "var(--secondary-base)" }}
                    >
                      {feature.title}
                    </p>

                    <p 
                      className="mt-1 text-[12px] font-semibold"
                      style={{ color: "var(--secondary-base)" }}
                      >
                      {feature.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}