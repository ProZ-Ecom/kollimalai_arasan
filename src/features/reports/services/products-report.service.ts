import { Prisma } from "@/generated/prisma";
import { db } from "@/lib/db/prisma";
import {
  SOLD_ORDER,
  inRange,
  num,
  ratio,
  resolveRange,
  round2,
} from "../lib/report-range";
import { resolveBrandFilter, resolveCategoryFilter } from "../lib/report-filters";

export interface ProductsFilters {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  brand?: string;
}

export interface ProductsTotals {
  skusSold: number;
  units: number;
  revenue: number;
  discounts: number;
  tax: number;
  returnedUnits: number;
  returnRate: number;
  zeroSaleSkus: number;
}

export interface SkuRow {
  key: string;
  sku: string;
  product: string;
  variant: string;
  packSize: string;
  category: string;
  brand: string;
  units: number;
  orders: number;
  revenue: number;
  discounts: number;
  tax: number;
  returnedUnits: number;
  stock: number;
}

export interface GroupRow {
  key: string;
  label: string;
  skus: number;
  units: number;
  revenue: number;
  share: number;
}

export interface ProductsReport {
  range: { from: string; to: string; days: number };
  totals: ProductsTotals;
  skus: SkuRow[];
  skusTruncated: boolean;
  byCategory: GroupRow[];
  byBrand: GroupRow[];
  bestSellers: SkuRow[];
  slowMovers: SkuRow[];
  zeroSale: SkuRow[];
  zeroSaleTruncated: boolean;
}

const SKU_LIMIT = 1000;
const ZERO_SALE_LIMIT = 100;

export const productsReportService = {
  async summary(filters: ProductsFilters): Promise<ProductsReport> {
    const range = resolveRange(filters);
    const [categoryId, brandId] = await Promise.all([
      resolveCategoryFilter(filters.category),
      resolveBrandFilter(filters.brand),
    ]);

    const productWhere: Prisma.ProductWhereInput = {
      ...(categoryId !== null ? { categoryId } : {}),
      ...(brandId !== null ? { brandId } : {}),
    };
    const hasProductFilter = categoryId !== null || brandId !== null;

    const items = await db.orderItem.findMany({
      where: {
        is_active: true,
        order: { ...SOLD_ORDER, createdAt: inRange(range) },
        ...(hasProductFilter ? { product: productWhere } : {}),
      },
      select: {
        orderId: true,
        productId: true,
        variantUnitPriceId: true,
        product_name_snapshot: true,
        variant_snapshot: true,
        sku_snapshot: true,
        quantity: true,
        discount_amount: true,
        tax_amount: true,
        total_price: true,
        product: {
          select: {
            categoryId: true,
            brandId: true,
            brand: { select: { name: true } },
          },
        },
        variant_unit_price: {
          select: {
            unit_value: true,
            product_units: { select: { code: true } },
          },
        },
      },
    });

    type Acc = {
      sku: string;
      product: string;
      variant: string;
      packSize: string;
      categoryId: string | null;
      brandId: string | null;
      brand: string;
      units: number;
      orders: Set<string>;
      revenue: number;
      discounts: number;
      tax: number;
      vupId: string | null;
    };

    const bySku = new Map<string, Acc>();
    const categoryIds = new Set<bigint>();

    for (const item of items) {
      const catId = item.product?.categoryId ?? null;
      if (catId != null) categoryIds.add(catId);

      const key =
        item.variantUnitPriceId != null
          ? `vup-${item.variantUnitPriceId}`
          : `sku-${item.sku_snapshot}`;

      const packSize = item.variant_unit_price
        ? `${num(item.variant_unit_price.unit_value)} ${item.variant_unit_price.product_units?.code ?? ""}`.trim()
        : "—";

      const acc = bySku.get(key) ?? {
        sku: item.sku_snapshot,
        product: item.product_name_snapshot,
        variant: item.variant_snapshot || "—",
        packSize,
        categoryId: catId != null ? String(catId) : null,
        brandId: item.product?.brandId != null ? String(item.product.brandId) : null,
        brand: item.product?.brand?.name ?? "No brand",
        units: 0,
        orders: new Set<string>(),
        revenue: 0,
        discounts: 0,
        tax: 0,
        vupId: item.variantUnitPriceId != null ? String(item.variantUnitPriceId) : null,
      };

      acc.units += item.quantity;
      acc.orders.add(String(item.orderId));
      acc.revenue = round2(acc.revenue + num(item.total_price));
      acc.discounts = round2(acc.discounts + num(item.discount_amount));
      acc.tax = round2(acc.tax + num(item.tax_amount));
      bySku.set(key, acc);
    }

    const vupIds = [...bySku.values()]
      .map((v) => v.vupId)
      .filter((id): id is string => id != null)
      .map((id) => BigInt(id));

    const [stockByVup, returnedByVup, zeroSaleAll] = await Promise.all([
      vupIds.length
        ? db.inventory.findMany({
            where: { variantUnitPriceId: { in: vupIds }, is_active: true },
            select: { variantUnitPriceId: true, quantity_available: true },
          })
        : Promise.resolve([]),
      returnsByVup(range, hasProductFilter ? productWhere : undefined),
      zeroSaleSkus(
        new Set(vupIds.map(String)),
        hasProductFilter ? productWhere : undefined
      ),
    ]);

    for (const z of zeroSaleAll) {
      if (z.categoryId != null) categoryIds.add(BigInt(z.categoryId));
    }

    const categoryNames = categoryIds.size
      ? new Map(
          (
            await db.productCategory.findMany({
              where: { id: { in: [...categoryIds] } },
              select: { id: true, name: true },
            })
          ).map((c) => [String(c.id), c.name])
        )
      : new Map<string, string>();

    const stockMap = new Map(
      stockByVup.map((s) => [String(s.variantUnitPriceId), s.quantity_available])
    );

    const skus: SkuRow[] = [...bySku.entries()]
      .map(([key, v]) => ({
        key,
        sku: v.sku,
        product: v.product,
        variant: v.variant,
        packSize: v.packSize,
        category:
          (v.categoryId ? categoryNames.get(v.categoryId) : null) ??
          "Uncategorised",
        brand: v.brand,
        units: v.units,
        orders: v.orders.size,
        revenue: v.revenue,
        discounts: v.discounts,
        tax: v.tax,
        returnedUnits: v.vupId ? (returnedByVup.get(v.vupId) ?? 0) : 0,
        stock: v.vupId ? (stockMap.get(v.vupId) ?? 0) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = round2(skus.reduce((s, r) => s + r.revenue, 0));
    const totalUnits = skus.reduce((s, r) => s + r.units, 0);
    const totalDiscounts = round2(skus.reduce((s, r) => s + r.discounts, 0));
    const totalTax = round2(skus.reduce((s, r) => s + r.tax, 0));
    const totalReturned = skus.reduce((s, r) => s + r.returnedUnits, 0);

    const groupBy = (field: "category" | "brand"): GroupRow[] => {
      const map = new Map<
        string,
        { label: string; skus: number; units: number; revenue: number }
      >();
      for (const s of skus) {
        const label = s[field];
        const acc = map.get(label) ?? { label, skus: 0, units: 0, revenue: 0 };
        acc.skus += 1;
        acc.units += s.units;
        acc.revenue = round2(acc.revenue + s.revenue);
        map.set(label, acc);
      }
      return [...map.values()]
        .map((g) => ({
          key: g.label,
          ...g,
          share: ratio(g.revenue, totalRevenue),
        }))
        .sort((a, b) => b.revenue - a.revenue);
    };

    const zeroSaleRows: SkuRow[] = zeroSaleAll
      .slice(0, ZERO_SALE_LIMIT)
      .map((z) => ({
        key: z.key,
        sku: z.sku,
        product: z.product,
        variant: z.variant,
        packSize: z.packSize,
        category:
          (z.categoryId ? categoryNames.get(z.categoryId) : null) ??
          "Uncategorised",
        brand: z.brand,
        units: 0,
        orders: 0,
        revenue: 0,
        discounts: 0,
        tax: 0,
        returnedUnits: 0,
        stock: z.stock,
      }));

    return {
      range: { from: range.fromISO, to: range.toISO, days: range.days },
      totals: {
        skusSold: skus.length,
        units: totalUnits,
        revenue: totalRevenue,
        discounts: totalDiscounts,
        tax: totalTax,
        returnedUnits: totalReturned,
        returnRate: ratio(totalReturned, totalUnits),
        zeroSaleSkus: zeroSaleAll.length,
      },
      skus: skus.slice(0, SKU_LIMIT),
      skusTruncated: skus.length > SKU_LIMIT,
      byCategory: groupBy("category"),
      byBrand: groupBy("brand"),
      bestSellers: skus.slice(0, 10),
      slowMovers: [...skus].sort((a, b) => a.units - b.units).slice(0, 10),
      zeroSale: zeroSaleRows,
      zeroSaleTruncated: zeroSaleAll.length > ZERO_SALE_LIMIT,
    };
  },
};

async function returnsByVup(
  range: { from: Date; to: Date },
  productWhere?: Prisma.ProductWhereInput
): Promise<Map<string, number>> {
  const rows = await db.return_items.findMany({
    where: {
      is_active: true,
      return_requests: { is_active: true, requested_at: inRange(range) },
      ...(productWhere ? { order_items: { product: productWhere } } : {}),
    },
    select: {
      quantity: true,
      order_items: { select: { variantUnitPriceId: true } },
    },
  });

  const map = new Map<string, number>();
  for (const r of rows) {
    const id = r.order_items.variantUnitPriceId;
    if (id != null) {
      map.set(String(id), (map.get(String(id)) ?? 0) + r.quantity);
    }
  }
  return map;
}

async function zeroSaleSkus(
  soldVupIds: Set<string>,
  productWhere?: Prisma.ProductWhereInput
) {
  const allActive = await db.variantUnitPrice.findMany({
    where: {
      isActive: true,
      deleted_at: null,
      variant: {
        isActive: true,
        deleted_at: null,
        product: {
          isActive: true,
          deleted_at: null,
          ...(productWhere ?? {}),
        },
      },
    },
    select: {
      id: true,
      sku: true,
      unit_value: true,
      product_units: { select: { code: true } },
      inventories: { select: { quantity_available: true } },
      variant: {
        select: {
          variant_name: true,
          product: {
            select: {
              name: true,
              categoryId: true,
              brand: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { id: "asc" },
  });

  return allActive
    .filter((v) => !soldVupIds.has(String(v.id)))
    .map((v) => ({
      key: `zero-${v.id}`,
      sku: v.sku,
      product: v.variant.product.name,
      variant: v.variant.variant_name || "—",
      packSize: `${num(v.unit_value)} ${v.product_units?.code ?? ""}`.trim(),
      categoryId:
        v.variant.product.categoryId != null
          ? String(v.variant.product.categoryId)
          : null,
      brand: v.variant.product.brand?.name ?? "No brand",
      stock: v.inventories?.quantity_available ?? 0,
    }));
}
