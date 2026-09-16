import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  serverExternalPackages: [
    "@prisma/adapter-mariadb",
    "mariadb",
    "@whiskeysockets/baileys",
    "pino",
    "razorpay",
  ],
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@tanstack/react-table",
      "@tanstack/react-query",
    ],
  },
};

export default nextConfig;
