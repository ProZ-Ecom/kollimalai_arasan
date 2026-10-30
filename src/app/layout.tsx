import type { Metadata } from "next";
import { Inter, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
});


export const metadata: Metadata = {
  title: "Kollimalai Arasan - Pure Spices & Natural Products",

  description:
    "Explore Kollimalai Arasan for authentic spices and natural products sourced from the Kolli Hills. Shop premium black pepper, cardamom, cloves, natural honey and traditional food products, delivered fresh to your doorstep.",

  keywords: [
    "Kollimalai Arasan",
    "Kollimalai products",
    "Kolli Hills products",
    "Kolli Hills spices",
    "Kolli Hills black pepper",
    "Kolli Hills cardamom",
    "Kolli Hills cloves",
    "Kolli Hills natural honey",
    "pure spices online",
    "natural products online",
    "traditional food products",
    "buy black pepper online",
    "buy cardamom online",
    "buy cloves online",
    "natural honey online",
    "Tamil Nadu spices",
    "Indian spices online",
    "farm fresh products",
  ],

  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.className} ${inter.variable} ${hanken.variable}`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

