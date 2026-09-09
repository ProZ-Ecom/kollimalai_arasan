"use client";

import Image from "next/image";

const features = [
  {
    icon: "/icons/fresh_icon.svg",
    title: "100%",
    subtitle: "Fresh",
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

export default function AuthBanner() {
  return (
    <div
      className="relative hidden h-screen overflow-hidden lg:flex"
      style={{
        backgroundImage: 'url("/images/login_banner.jpg")',
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
              className="text-[40px] font-bold leading-[60px]"
              style={{ fontFamily: "var(--font-hanken)" }}
            >
              Indulge in Heritage
            </h1>

            <p
              className="mt-5 text-[18px] leading-8 text-white/90"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Premium snacks for the modern palate, crafted with
              traditional recipes and the finest ingredients.
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