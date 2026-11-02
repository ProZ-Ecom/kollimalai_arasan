import type { MetadataRoute } from "next";
import { db } from "@/lib/db/prisma";
import { SITE_URL } from "@/lib/seo/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Core static public pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/categories/all`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/bulk-order`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/faqs`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms-and-conditions`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/return-refund-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/disclaimer`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  let categoryRoutes: MetadataRoute.Sitemap = [];

  try {
    const products = await db.product.findMany({
      where: {
        isActive: true,
        deleted_at: null,
      },
      select: {
        slug: true,
        uuid: true,
        updatedAt: true,
      },
    });

    productRoutes = products
      .map((p) => {
        const identifier = p.slug || p.uuid;
        if (!identifier) return null;
        return {
          url: `${SITE_URL}/products/${identifier}`,
          lastModified: p.updatedAt || now,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  } catch (error) {
    console.warn("Sitemap: Failed to load dynamic products from database:", error);
  }

  try {
    const categories = await db.productCategory.findMany({
      where: {
        isActive: true,
        deleted_at: null,
      },
      select: {
        slug: true,
        uuid: true,
        updatedAt: true,
      },
    });

    categoryRoutes = categories
      .map((c) => {
        const identifier = c.slug || c.uuid;
        if (!identifier || identifier === "all") return null;
        return {
          url: `${SITE_URL}/categories/${identifier}`,
          lastModified: c.updatedAt || now,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  } catch (error) {
    console.warn("Sitemap: Failed to load dynamic categories from database:", error);
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}

