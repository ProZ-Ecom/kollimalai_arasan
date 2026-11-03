import { cache } from "react";
import type { Metadata } from "next";
import { categoryRepository } from "@/features/categories/repositories/category.repository";
import {
  SITE_NAME,
  absoluteUrl,
  cleanDescription,
  DEFAULT_OG_IMAGE,
} from "@/lib/seo/site";
import {
  JsonLd,
  buildBreadcrumbSchema,
} from "@/lib/seo/structured-data";
import { CategoryProductsClient } from "./CategoryProductsClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Cache category lookup per request to prevent duplicate queries between
 * generateMetadata and the server component render.
 */
const getCategoryBySlugOrId = cache(async (slugOrId: string) => {
  if (slugOrId === "all") return null;
  try {
    return await categoryRepository.findBySlugOrId(slugOrId);
  } catch (error) {
    console.error(`Failed to fetch category for SEO [${slugOrId}]:`, error);
    return null;
  }
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  if (slug === "all") {
    const title = `Shop Spices & Natural Products Online | ${SITE_NAME}`;
    const description =
      "Explore our collection of authentic Kolli Hills spices and natural products. Discover black pepper, cardamom, cloves, natural honey and traditional food products.";
    const canonicalPath = "/categories/all";

    return {
      title,
      description,
      alternates: {
        canonical: canonicalPath,
      },
      openGraph: {
        title,
        description,
        url: absoluteUrl(canonicalPath),
        siteName: SITE_NAME,
        locale: "en_IN",
        type: "website",
        images: [
          {
            url: absoluteUrl(DEFAULT_OG_IMAGE),
            alt: `${SITE_NAME} Products`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [absoluteUrl(DEFAULT_OG_IMAGE)],
      },
    };
  }

  const category = await getCategoryBySlugOrId(slug);

  if (!category) {
    return {
      title: `Category Not Found | ${SITE_NAME}`,
      description: "The requested category could not be found.",
      robots: { index: false, follow: true },
    };
  }

  const canonicalPath = `/categories/${category.slug || slug}`;
  const title = `${category.name} | Authentic Kolli Hills Products | ${SITE_NAME}`;
  const description = cleanDescription(
    category.description,
    `Explore authentic ${category.name} from Kolli Hills at ${SITE_NAME}. Pure, farm-fresh spices and traditional natural products directly to your doorstep.`
  );

  const categoryImage =
    (category as { product_category_images?: Array<{ image_url?: string }> })
      ?.product_category_images?.[0]?.image_url ||
    category.icon ||
    DEFAULT_OG_IMAGE;
  const ogImageUrl = absoluteUrl(categoryImage);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(canonicalPath),
      siteName: SITE_NAME,
      locale: "en_IN",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          alt: category.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlugOrId(slug);

  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Categories", path: "/categories/all" },
  ];

  if (category) {
    breadcrumbs.push({
      name: category.name,
      path: `/categories/${category.slug || slug}`,
    });
  } else if (slug === "all") {
    breadcrumbs.push({
      name: "All Products",
      path: "/categories/all",
    });
  }

  const collectionSchema = category
    ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${category.name} - ${SITE_NAME}`,
        description: cleanDescription(
          category.description,
          `Explore authentic ${category.name} from Kolli Hills at ${SITE_NAME}.`
        ),
        url: absoluteUrl(`/categories/${category.slug || slug}`),
      }
    : null;

  return (
    <>
      <JsonLd data={buildBreadcrumbSchema(breadcrumbs)} />
      {collectionSchema && <JsonLd data={collectionSchema} />}
      <CategoryProductsClient slug={slug} />
    </>
  );
}
