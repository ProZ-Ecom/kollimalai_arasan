import { generateMetadata as generateProductMetadata } from "./src/app/(store)/products/[slug]/page";
import { generateMetadata as generateCategoryMetadata } from "./src/app/(store)/categories/[slug]/page";

async function run() {
  console.log("=== Testing Dynamic Product Metadata ===");
  const productMeta = await generateProductMetadata({
    params: Promise.resolve({ slug: "kolli-hills-black-pepper" }),
  });
  console.log("Product Title:      ", productMeta.title);
  console.log("Product Description:", productMeta.description);
  console.log("Product Canonical:  ", productMeta.alternates?.canonical);
  console.log("Product OG Image:   ", productMeta.openGraph?.images);

  console.log("\n=== Testing Dynamic Product 404 Fallback ===");
  const missingProductMeta = await generateProductMetadata({
    params: Promise.resolve({ slug: "non-existent-product-slug" }),
  });
  console.log("Fallback Title:     ", missingProductMeta.title);
  console.log("Fallback Robots:    ", missingProductMeta.robots);

  console.log("\n=== Testing Dynamic Category Metadata (all) ===");
  const catAllMeta = await generateCategoryMetadata({
    params: Promise.resolve({ slug: "all" }),
  });
  console.log("Category 'all' Title:      ", catAllMeta.title);
  console.log("Category 'all' Description:", catAllMeta.description);
  console.log("Category 'all' Canonical:  ", catAllMeta.alternates?.canonical);

  console.log("\n=== Testing Dynamic Category Metadata (specific category) ===");
  const catMeta = await generateCategoryMetadata({
    params: Promise.resolve({ slug: "black-pepper-pepper-spices" }),
  });
  console.log("Category Title:      ", catMeta.title);
  console.log("Category Description:", catMeta.description);
  console.log("Category Canonical:  ", catMeta.alternates?.canonical);
  console.log("Category OG Image:   ", catMeta.openGraph?.images);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

