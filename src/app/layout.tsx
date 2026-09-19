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
  description: "Authentic Kolli Hills spices and natural products: Black pepper, cardamom, cloves, and traditional harvest delivered to your doorstep.",
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

