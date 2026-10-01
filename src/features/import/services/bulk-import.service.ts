import * as XLSX from "xlsx";
import { db } from "@/lib/db/prisma";
import { slugify } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImportRowResult {
  row: number;
  sheet: string;
  status: "success" | "rejected";
  name: string;
  reason?: string;
  data?: Record<string, unknown>;
}

export interface ImportPreviewItem {
  categoryName: string;
  productName: string;
  sku: string;
  variants: {
    variantName: string;
    unit: string;
    unitValue: number;
    variantSku: string;
    price: number;
    stockQty: number;
    isDefault: boolean;
  }[];
}

export interface ImportResult {
  totalRows: number;
  successCount: number;
  rejectedCount: number;
  preview: ImportPreviewItem[];
  rejected: ImportRowResult[];
  importedCategories: string[];
  importedProducts: string[];
}

// ─── Raw Excel Row Types ──────────────────────────────────────────────────────

interface RawCategoryRow {
  category_name?: string;
  parent_category?: string;
  description?: string;
  sort_order?: number | string;
}

interface RawProductRow {
  category_name?: string;
  product_name?: string;
  sku?: string;
  base_price?: number | string;
  sale_price?: number | string;
  description?: string;
  brand?: string;
  hsn_code?: string;
}

interface RawVariantRow {
  product_sku?: string;
  variant_name?: string;
  unit?: string;
  unit_value?: number | string;
  variant_sku?: string;
  price?: number | string;
  stock_qty?: number | string;
  reorder_level?: number | string;
  is_default?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeStr(v: unknown): string {
  return v != null ? String(v).trim() : "";
}

function safeNum(v: unknown, fallback = 0): number {
  const n = parseFloat(String(v ?? fallback));
  return isNaN(n) ? fallback : n;
}

function safeBool(v: unknown): boolean {
  const s = safeStr(v).toUpperCase();
  return s === "YES" || s === "TRUE" || s === "1";
}

function makeUniqueSlug(base: string, existing: Set<string>): string {
  let slug = slugify(base).slice(0, 160);
  let attempt = slug;
  let i = 2;
  while (existing.has(attempt)) {
    attempt = `${slug}-${i++}`;
  }
  existing.add(attempt);
  return attempt;
}

// ─── Parse Excel ─────────────────────────────────────────────────────────────

function parseExcelBuffer(buffer: Buffer): {
  categories: RawCategoryRow[];
  products: RawProductRow[];
  variants: RawVariantRow[];
} {
  const workbook = XLSX.read(buffer, { type: "buffer" });

  const parseSheet = <T>(name: string): T[] => {
    const sheet = workbook.Sheets[name];
    if (!sheet) return [];
    return XLSX.utils.sheet_to_json<T>(sheet, { defval: "" });
  };

  return {
    categories: parseSheet<RawCategoryRow>("Categories"),
    products: parseSheet<RawProductRow>("Products"),
    variants: parseSheet<RawVariantRow>("Variants"),
  };
}

// ─── Main Import Service ──────────────────────────────────────────────────────

export const bulkImportService = {
  /**
   * Parse, validate, preview and import Excel data.
   * All inserts wrapped in a single DB transaction (all-or-nothing per run).
   */
  async importFromBuffer(
    buffer: Buffer,
    adminUserId?: bigint | null,
    dryRun = false
  ): Promise<ImportResult> {
    const { categories: rawCats, products: rawProds, variants: rawVars } =
      parseExcelBuffer(buffer);

    const rejected: ImportRowResult[] = [];
    const preview: ImportPreviewItem[] = [];
    const importedCategories: string[] = [];
    const importedProducts: string[] = [];

    // ── 1. Validate & Deduplicate Categories ──
    const categoryMap = new Map<string, bigint>(); // name (lower) → DB id
    const usedCatSlugs = new Set<string>();
    const validCats: { name: string; slug: string; parentName?: string; description?: string; sortOrder: number }[] = [];

    // Pre-load existing categories
    const existingCats = await db.productCategory.findMany({
      where: { deleted_at: null },
      select: { id: true, name: true, slug: true },
    });
    for (const cat of existingCats) {
      categoryMap.set(cat.name.toLowerCase(), cat.id);
      usedCatSlugs.add(cat.slug);
    }

    const seenCatNames = new Set<string>();
    for (let i = 0; i < rawCats.length; i++) {
      const row = rawCats[i];
      const name = safeStr(row.category_name);
      if (!name) {
        rejected.push({ row: i + 2, sheet: "Categories", status: "rejected", name: "(empty)", reason: "category_name is required" });
        continue;
      }
      if (categoryMap.has(name.toLowerCase())) {
        // Already exists — just record it (not an error)
        continue;
      }
      if (seenCatNames.has(name.toLowerCase())) {
        rejected.push({ row: i + 2, sheet: "Categories", status: "rejected", name, reason: "Duplicate category name in sheet" });
        continue;
      }
      seenCatNames.add(name.toLowerCase());
      validCats.push({
        name,
        slug: makeUniqueSlug(name, usedCatSlugs),
        parentName: safeStr(row.parent_category) || undefined,
        description: safeStr(row.description) || undefined,
        sortOrder: safeNum(row.sort_order, 0),
      });
    }

    // ── 2. Validate Products ──
    const productSkuToName = new Map<string, string>();
    const existingSkus = new Set<string>();
    const existingProductSkus = await db.product.findMany({
      where: { deleted_at: null },
      select: { sku: true },
    });
    for (const p of existingProductSkus) {
      if (p.sku) existingSkus.add(p.sku.toUpperCase());
    }

    const usedProdSlugs = new Set<string>();
    const existingProductSlugs = await db.product.findMany({
      where: { deleted_at: null },
      select: { slug: true },
    });
    for (const p of existingProductSlugs) usedProdSlugs.add(p.slug);

    type ValidProduct = {
      sku: string;
      name: string;
      slug: string;
      categoryName: string;
      basePrice: number;
      salePrice?: number;
      description?: string;
    };
    const validProds: ValidProduct[] = [];
    const seenProdSkus = new Set<string>();

    for (let i = 0; i < rawProds.length; i++) {
      const row = rawProds[i];
      const name = safeStr(row.product_name);
      const sku = safeStr(row.sku).toUpperCase();
      const categoryName = safeStr(row.category_name);
      const basePrice = safeNum(row.base_price);

      if (!name) { rejected.push({ row: i + 2, sheet: "Products", status: "rejected", name: sku || "(empty)", reason: "product_name is required" }); continue; }
      if (!sku) { rejected.push({ row: i + 2, sheet: "Products", status: "rejected", name, reason: "sku is required" }); continue; }
      if (!categoryName) { rejected.push({ row: i + 2, sheet: "Products", status: "rejected", name, reason: "category_name is required" }); continue; }
      if (basePrice <= 0) { rejected.push({ row: i + 2, sheet: "Products", status: "rejected", name, reason: "base_price must be > 0" }); continue; }
      if (existingSkus.has(sku)) { rejected.push({ row: i + 2, sheet: "Products", status: "rejected", name, reason: `SKU "${sku}" already exists in database` }); continue; }
      if (seenProdSkus.has(sku)) { rejected.push({ row: i + 2, sheet: "Products", status: "rejected", name, reason: `Duplicate SKU "${sku}" in sheet` }); continue; }

      seenProdSkus.add(sku);
      existingSkus.add(sku);
      productSkuToName.set(sku, name);
      validProds.push({
        sku,
        name,
        slug: makeUniqueSlug(name, usedProdSlugs),
        categoryName,
        basePrice,
        salePrice: safeNum(row.sale_price, 0) > 0 ? safeNum(row.sale_price) : undefined,
        description: safeStr(row.description) || undefined,
      });
    }

    // ── 3. Validate Variants ──
    type ValidVariant = {
      productSku: string;
      variantName: string;
      unit: string;
      unitValue: number;
      variantSku: string;
      price: number;
      stockQty: number;
      reorderLevel: number;
      isDefault: boolean;
    };
    const validVars: ValidVariant[] = [];
    const existingVarSkus = new Set<string>();
    const existingVariantSkus = await db.variantUnitPrice.findMany({
      select: { sku: true },
    });
    for (const v of existingVariantSkus) existingVarSkus.add(v.sku.toUpperCase());

    // Pre-load valid unit codes from DB for early validation
    const dbUnits = await db.product_units.findMany({
      where: { is_active: true },
      select: { id: true, name: true, code: true },
    });
    const validUnitCodes = new Set(dbUnits.map((u) => u.code.toLowerCase()));
    const validUnitNames = new Set(dbUnits.map((u) => u.name.toLowerCase()));
    const validUnitList = dbUnits.map((u) => u.code).join(", ");

    const seenVarSkus = new Set<string>();
    const defaultSetFor = new Set<string>(); // product SKUs that already have a default

    for (let i = 0; i < rawVars.length; i++) {
      const row = rawVars[i];
      const productSku = safeStr(row.product_sku).toUpperCase();
      const variantName = safeStr(row.variant_name);
      const unit = safeStr(row.unit).toLowerCase();
      const unitValue = safeNum(row.unit_value);
      const variantSku = safeStr(row.variant_sku).toUpperCase();
      const price = safeNum(row.price);
      const stockQty = safeNum(row.stock_qty, 0);
      const reorderLevel = safeNum(row.reorder_level, 10);
      const isDefault = safeBool(row.is_default);

      if (!productSku) { rejected.push({ row: i + 2, sheet: "Variants", status: "rejected", name: variantSku || "(empty)", reason: "product_sku is required" }); continue; }
      if (!seenProdSkus.has(productSku) && !existingSkus.has(productSku)) { rejected.push({ row: i + 2, sheet: "Variants", status: "rejected", name: variantSku, reason: `product_sku "${productSku}" not found in Products sheet or DB` }); continue; }
      if (!variantName) { rejected.push({ row: i + 2, sheet: "Variants", status: "rejected", name: variantSku || "(empty)", reason: "variant_name is required" }); continue; }
      if (!unit) { rejected.push({ row: i + 2, sheet: "Variants", status: "rejected", name: variantSku, reason: `unit is required. Valid codes: ${validUnitList}` }); continue; }
      if (!validUnitCodes.has(unit) && !validUnitNames.has(unit)) {
        rejected.push({ row: i + 2, sheet: "Variants", status: "rejected", name: variantSku, reason: `Unknown unit "${unit}". Valid unit codes in DB: ${validUnitList}` });
        continue;
      }
      if (unitValue <= 0) { rejected.push({ row: i + 2, sheet: "Variants", status: "rejected", name: variantSku, reason: "unit_value must be > 0" }); continue; }
      if (!variantSku) { rejected.push({ row: i + 2, sheet: "Variants", status: "rejected", name: "(empty)", reason: "variant_sku is required" }); continue; }
      if (price <= 0) { rejected.push({ row: i + 2, sheet: "Variants", status: "rejected", name: variantSku, reason: "price must be > 0" }); continue; }
      if (existingVarSkus.has(variantSku)) { rejected.push({ row: i + 2, sheet: "Variants", status: "rejected", name: variantSku, reason: `Variant SKU "${variantSku}" already exists in database` }); continue; }
      if (seenVarSkus.has(variantSku)) { rejected.push({ row: i + 2, sheet: "Variants", status: "rejected", name: variantSku, reason: `Duplicate variant_sku "${variantSku}" in sheet` }); continue; }

      seenVarSkus.add(variantSku);
      existingVarSkus.add(variantSku);
      if (isDefault) defaultSetFor.add(productSku);

      validVars.push({ productSku, variantName, unit, unitValue, variantSku, price, stockQty, reorderLevel, isDefault });
    }

    // ── 4. Build Preview ──
    const varsByProductSku = new Map<string, typeof validVars>();
    for (const v of validVars) {
      if (!varsByProductSku.has(v.productSku)) varsByProductSku.set(v.productSku, []);
      varsByProductSku.get(v.productSku)!.push(v);
    }

    for (const prod of validProds) {
      const vars = varsByProductSku.get(prod.sku) ?? [];
      preview.push({
        categoryName: prod.categoryName,
        productName: prod.name,
        sku: prod.sku,
        variants: vars.map((v) => ({
          variantName: v.variantName,
          unit: v.unit,
          unitValue: v.unitValue,
          variantSku: v.variantSku,
          price: v.price,
          stockQty: v.stockQty,
          isDefault: v.isDefault,
        })),
      });
    }

    const totalRows = rawCats.length + rawProds.length + rawVars.length;
    const successCount = validCats.length + validProds.length + validVars.length;

    // Return early if dry run (preview only)
    if (dryRun) {
      return {
        totalRows,
        successCount,
        rejectedCount: rejected.length,
        preview,
        rejected,
        importedCategories: [],
        importedProducts: [],
      };
    }

    // ── 5. Commit to DB ──
    await db.$transaction(async (tx) => {
      // 5a. Insert categories
      for (const cat of validCats) {
        let parentId: bigint | undefined;
        if (cat.parentName) {
          parentId = categoryMap.get(cat.parentName.toLowerCase());
        }
        const created = await tx.productCategory.create({
          data: {
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            parentId: parentId ?? null,
            sortOrder: cat.sortOrder,
            isActive: true,
            status: true,
            created_by: adminUserId ?? null,
            updated_by: adminUserId ?? null,
          },
        });
        categoryMap.set(cat.name.toLowerCase(), created.id);
        importedCategories.push(cat.name);
      }

      // 5b. Fetch all units from DB once
      const units = await tx.product_units.findMany({ select: { id: true, name: true, code: true } });
      const unitMap = new Map<string, bigint>();
      for (const u of units) {
        unitMap.set(u.code.toLowerCase(), u.id);
        unitMap.set(u.name.toLowerCase(), u.id);
      }

      // 5c. Insert products + variants
      for (const prod of validProds) {
        const catId = categoryMap.get(prod.categoryName.toLowerCase());
        const createdProd = await tx.product.create({
          data: {
            name: prod.name,
            slug: prod.slug,
            sku: prod.sku,
            base_price: prod.basePrice,
            sale_price: prod.salePrice ?? null,
            categoryId: catId ? catId : null,
            isActive: true,
            status: true,
            created_by: adminUserId ?? null,
            updated_by: adminUserId ?? null,
          },
        });
        importedProducts.push(prod.name);

        // Variants for this product
        const vars = varsByProductSku.get(prod.sku) ?? [];

        // Ensure at least one is_default
        if (vars.length > 0 && !vars.some((v) => v.isDefault)) {
          vars[0].isDefault = true;
        }

        for (const v of vars) {
          const unitId = unitMap.get(v.unit);
          if (!unitId) continue; // Skip if unit not found in DB

          const variantSlug = slugify(`${prod.slug}-${v.variantName}`).slice(0, 250);

          const createdVariant = await tx.productVariant.create({
            data: {
              productId: createdProd.id,
              variant_name: v.variantName,
              slug: variantSlug,
              is_default: v.isDefault,
              isActive: true,
              created_by: adminUserId ?? null,
              updated_by: adminUserId ?? null,
            },
          });

          const createdVup = await tx.variantUnitPrice.create({
            data: {
              variant_id: createdVariant.id,
              unit_id: unitId,
              unit_value: v.unitValue,
              sku: v.variantSku,
              base_price: v.price,
              is_default: v.isDefault,
              isActive: true,
              created_by: adminUserId ?? null,
              updated_by: adminUserId ?? null,
            },
          });

          await tx.inventory.create({
            data: {
              variantUnitPriceId: createdVup.id,
              quantity_available: v.stockQty,
              quantity_reserved: 0,
              reorderLevel: v.reorderLevel,
              is_active: true,
              created_by: adminUserId ?? null,
              updated_by: adminUserId ?? null,
            },
          });
        }
      }
    });

    return {
      totalRows,
      successCount,
      rejectedCount: rejected.length,
      preview,
      rejected,
      importedCategories,
      importedProducts,
    };
  },
};
