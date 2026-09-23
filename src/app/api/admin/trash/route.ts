import { db } from "@/lib/db/prisma";
import { apiSuccess } from "@/lib/api/api-response";
import { createApiHandler } from "@/lib/api/api-handler";
import { productRepository } from "@/features/products/repositories/product.repository";
import { variantRepository } from "@/features/variants/repositories/variant.repository";

async function getTrash(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim() || undefined;

  // Build a simple deleted categories query inline (avoids paginated wrapper)
  const catWhere: any = { deleted_at: { not: null } };
  if (search) {
    catWhere.AND = [
      { deleted_at: { not: null } },
      { OR: [{ name: { contains: search } }, { slug: { contains: search } }] },
    ];
    delete catWhere.deleted_at;
  }

  const [rawCategories, products, variants] = await Promise.all([
    db.productCategory.findMany({
      where: catWhere,
      orderBy: { deleted_at: "desc" },
      take: 100,
    }),
    productRepository.findDeletedAll({ search }),
    variantRepository.findDeletedAll({ search }),
  ]);

  // Lookup category names for products
  const categoryIds = products
    .map((p) => p.categoryId)
    .filter((id): id is bigint => id !== null && id !== undefined);

  const categoriesForProducts =
    categoryIds.length > 0
      ? await db.productCategory.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : [];

  const categoryNameMap = new Map<string, string>();
  for (const cat of categoriesForProducts) {
    categoryNameMap.set(String(cat.id), cat.name);
  }

  return apiSuccess(
    {
      categories: rawCategories.map((c) => ({
        id: String(c.id),
        uuid: c.uuid,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        deletedAt: c.deleted_at,
        type: "category" as const,
      })),
      products: products.map((p) => ({
        id: String(p.id),
        uuid: p.uuid,
        name: p.name,
        slug: p.slug,
        image: p.images?.[0]?.image_url ?? null,
        categoryName: p.categoryId ? categoryNameMap.get(String(p.categoryId)) ?? null : null,
        deletedAt: p.deleted_at,
        type: "product" as const,
      })),
      variants: variants.map((v) => ({
        id: String(v.id),
        uuid: v.uuid,
        name: v.variant_name,
        sku: v.variant_unit_prices?.[0]?.sku ?? null,
        image: v.product_variant_images?.[0]?.image_url ?? null,
        productName: v.product?.name ?? null,
        productUuid: v.product?.uuid ?? null,
        parentDeleted: v.product?.deleted_at != null,
        deletedAt: v.deleted_at,
        type: "variant" as const,
      })),
    },
    "Trash fetched successfully"
  );
}

export const GET = createApiHandler(
  { GET: async (request) => getTrash(request) },
  { requireAuth: true, requiredRole: ["ADMIN"] }
);
