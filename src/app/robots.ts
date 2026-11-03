import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/checkout",
          "/cart",
          "/orders",
          "/orders/",
          "/profile",
          "/profile/",
          "/search",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

