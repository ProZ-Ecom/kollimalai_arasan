import { cache } from "react";
import type { Metadata } from "next";
import { catalogRepository } from "@/features/customers/repositories/catalog.repository";
import { db } from "@/lib/db/prisma";
import {
  SITE_NAME,
  absoluteUrl,
  cleanDescription,
  DEFAULT_OG_IMAGE,
} from "@/lib/seo/site";
import {
  JsonLd,
  buildBreadcrumbSchema,
  buildProductSchema,
} from "@/lib/seo/structured-data";
import { ProductDetailClient } from "./ProductDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Cache product lookup per request to prevent duplicate queries between
 * generateMetadata and the server component render.
 */
const getProductBySlugOrId = cache(async (identifier: string) => {
  try {
    const product = await catalogRepository.findCustomerProductByUuid(identifier);
    if (!product) return null;

    // Resolve persistent canonical slug from the product record
    const dbProduct = await db.product.findFirst({
      where: {
        OR: [{ uuid: identifier }, { slug: identifier }],
      },
      select: { slug: true },
    });

    return {
      product,
      canonicalSlug: dbProduct?.slug || identifier,
    };
  } catch (error) {
    console.error(`Failed to fetch product for SEO [${identifier}]:`, error);
    return null;
  }
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProductBySlugOrId(slug);

  if (!data || !data.product) {
    return {
      title: `Product Not Found | ${SITE_NAME}`,
      description: "The requested product could not be found.",
      robots: { index: false, follow: true },
    };
  }

  const { product, canonicalSlug } = data;
  const canonicalPath = `/products/${canonicalSlug}`;
  const title = `Buy ${product.name} Online | ${SITE_NAME}`;

  const rawDescription =
    product.description ||
    product.variants?.[0]?.shortDescription ||
    `Buy authentic ${product.name} online from Kollimalai Arasan. Sourced directly from Kolli Hills farmers.`;
  const description = cleanDescription(
    rawDescription,
    `Buy authentic ${product.name} online from Kollimalai Arasan. Sourced directly from Kolli Hills.`
  );

  const ogImage =
    product.images?.[0]?.imageUrl || product.image || DEFAULT_OG_IMAGE;
  const ogImageUrl = absoluteUrl(ogImage);

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
          alt: product.name,
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

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getProductBySlugOrId(slug);

  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
  ];

  if (data?.product.category) {
    breadcrumbs.push({
      name: data.product.category.name,
      path: `/categories/${data.product.category.id}`,
    });
  }

  if (data?.product) {
    breadcrumbs.push({
      name: data.product.name,
      path: `/products/${data.canonicalSlug}`,
    });
  }

  return (
    <>
      {data?.product && (
        <>
          <JsonLd
            data={buildProductSchema(
              data.product,
              `/products/${data.canonicalSlug}`
            )}
          />
          <JsonLd data={buildBreadcrumbSchema(breadcrumbs)} />
        </>
      )}
      <ProductDetailClient slug={slug} />
    </>
  );
}
