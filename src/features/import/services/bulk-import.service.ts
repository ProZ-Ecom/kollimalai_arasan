import crypto from "crypto";
import * as XLSX from "xlsx";
import { db } from "@/lib/db/prisma";
import { slugify, formatTitleCase } from "@/lib/utils";
import { handlePrismaError, extractPrismaDuplicateDetails, ApiError } from "@/lib/api/api-error";

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
  brand?: string;
  variants: {
    variantName: string;
    itemCode?: string;
    unit: string;
    unitValue: number;
    variantSku: string;
    price: number;
    salePrice?: number;
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
  name?: string;
  category?: string;
  category_code?: string;
  category_slug?: string;
  slug?: string;
  parent_category?: string;
  parent?: string;
  description?: string;
  category_description?: string;
  sort_order?: number | string;
}

interface RawProductRow {
  category_name?: string;
  category?: string;
  category_code?: string;
  category_slug?: string;
  category_description?: string;
  product_name?: string;
  name?: string;
  product?: string;
  sku?: string;
  product_sku?: string;
  product_code?: string;
  base_price?: number | string;
  price?: number | string;
  sale_price?: number | string;
  description?: string;
  product_description?: string;
  brand?: string;
  brand_name?: string;
  hsn_code?: string;
  hsn?: string;
}

interface RawItemRow {
  product_sku?: string;
  product_code?: string;
  sku?: string;
  item_name?: string;
  item?: string;
  item_group?: string;
  name?: string;
  variant_name?: string;
  variant?: string;
  item_code?: string;
  item_slug?: string;
  variant_code?: string;
  variant_slug?: string;
  short_description?: string;
  short_desc?: string;
  description?: string;
  item_description?: string;
  product_description?: string;
  video_url?: string;
  video?: string;
  is_featured?: string | boolean;
  featured?: string | boolean;
  unit?: string;
  unit_code?: string;
  measurement_unit?: string;
  uom?: string;
  unit_value?: number | string;
  pack_size?: number | string;
  size?: number | string;
  item_sku?: string;
  variant_sku?: string;
  price?: number | string;
  base_price?: number | string;
  unit_price?: number | string;
  rate?: number | string;
  sale_price?: number | string;
  offer_price?: number | string;
  stock_qty?: number | string;
  stock?: number | string;
  quantity?: number | string;
  qty?: number | string;
  reorder_level?: number | string;
  reorder_qty?: number | string;
  min_stock?: number | string;
  is_default?: string | boolean;
  default?: string | boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeStr(v: unknown): string {
  return v != null ? String(v).trim() : "";
}

function safeBool(v: unknown): boolean {
  const s = safeStr(v).toUpperCase();
  return s === "YES" || s === "TRUE" || s === "1";
}

function isRowEmpty(row: Record<string, unknown>): boolean {
  return Object.values(row).every(
    (v) => v === undefined || v === null || String(v).trim() === ""
  );
}

function normalizeRowKeys(rawRow: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rawRow)) {
    const cleanKey = key.trim().toLowerCase().replace(/[\s-]+/g, "_");
    normalized[cleanKey] = value;
  }
  return normalized;
}

function makeUniqueSlug(base: string, existing: Set<string>): string {
  let slug = slugify(base).slice(0, 160);
  if (!slug) slug = "item";
  let attempt = slug;
  let i = 2;
  while (existing.has(attempt.toLowerCase()) || existing.has(attempt)) {
    attempt = `${slug}-${i++}`;
  }
  existing.add(attempt.toLowerCase());
  existing.add(attempt);
  return attempt;
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
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetNames = workbook.SheetNames;

    const parseSheet = (name: string): Record<string, unknown>[] => {
      const sheet = workbook.Sheets[name];
      if (!sheet) return [];
      return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    };

    const isMultiSheet =
      sheetNames.includes("Categories") &&
      sheetNames.includes("Products") &&
      (sheetNames.includes("Items") || sheetNames.includes("Variants"));

    // ── Load Reference Data from DB for Validation ──
    const dbUnits = await db.product_units.findMany({
      where: { is_active: true },
      select: { id: true, name: true, code: true },
    });
    const validUnitCodes = new Set(dbUnits.map((u) => u.code.toLowerCase()));
    const validUnitNames = new Set(dbUnits.map((u) => u.name.toLowerCase()));
    const validUnitList = dbUnits.map((u) => u.code).join(", ");

    const categoryMap = new Map<string, bigint>(); // name (lower) → DB id
    const categorySlugMap = new Map<string, { id: bigint; name: string }>(); // slug (lower) → DB info
    const usedCatSlugs = new Set<string>();
    // Query ALL categories (including soft-deleted) to prevent unique slug collisions in MariaDB
    const existingCats = await db.productCategory.findMany({
      select: { id: true, name: true, slug: true, deleted_at: true },
    });
    for (const cat of existingCats) {
      usedCatSlugs.add(cat.slug.toLowerCase());
      usedCatSlugs.add(cat.slug);
      if (!cat.deleted_at) {
        categoryMap.set(cat.name.toLowerCase(), cat.id);
        categorySlugMap.set(cat.slug.toLowerCase(), { id: cat.id, name: cat.name });
      }
    }

    const existingProductSkus = new Set<string>();
    const usedProdSlugs = new Set<string>();
    // Query ALL products (including soft-deleted) to avoid unique slug and SKU collisions
    const existingProducts = await db.product.findMany({
      select: { id: true, sku: true, slug: true, deleted_at: true },
    });
    for (const p of existingProducts) {
      if (p.sku) {
        existingProductSkus.add(p.sku.toUpperCase());
        existingProductSkus.add(p.sku);
      }
      if (p.slug) {
        usedProdSlugs.add(p.slug.toLowerCase());
        usedProdSlugs.add(p.slug);
      }
    }

    const existingVariantSkus = new Set<string>();
    const usedVarSlugs = new Set<string>();
    // Query ALL variants (including soft-deleted) to avoid unique variant slug collisions
    const existingVariants = await db.productVariant.findMany({
      select: { slug: true },
    });
    for (const v of existingVariants) {
      if (v.slug) {
        usedVarSlugs.add(v.slug.toLowerCase());
        usedVarSlugs.add(v.slug);
      }
    }

    const existingUnitPrices = await db.variantUnitPrice.findMany({
      select: { sku: true },
    });
    for (const v of existingUnitPrices) {
      if (v.sku) {
        existingVariantSkus.add(v.sku.toUpperCase());
        existingVariantSkus.add(v.sku);
      }
    }

    // Pre-cache ALL brands (including soft-deleted for slugs)
    const existingBrands = await db.productBrand.findMany({
      select: { id: true, name: true, slug: true, deleted_at: true },
    });
    const brandMap = new Map<string, bigint>();
    const usedBrandSlugs = new Set<string>();
    for (const b of existingBrands) {
      if (!b.deleted_at) {
        brandMap.set(b.name.toLowerCase(), b.id);
        brandMap.set(b.slug.toLowerCase(), b.id);
      }
      usedBrandSlugs.add(b.slug.toLowerCase());
      usedBrandSlugs.add(b.slug);
    }
    const defaultBrandId =
      existingBrands.find((b) => !b.deleted_at)?.id ?? existingBrands[0]?.id ?? null;

    // Pre-cache ALL HSN codes (fetch all to prevent duplicate key insertion)
    const existingHsns = await db.product_hsn_codes.findMany({
      select: { id: true, code: true },
    });
    const hsnMap = new Map<string, bigint>();
    for (const h of existingHsns) {
      hsnMap.set(h.code.toLowerCase(), h.id);
      hsnMap.set(h.code.toUpperCase(), h.id);
    }

    const rejected: ImportRowResult[] = [];
    const preview: ImportPreviewItem[] = [];
    const importedCategories: string[] = [];
    const importedProducts: string[] = [];

    // Track state for insertion
    type ValidCategory = {
      name: string;
      slug: string;
      parentName?: string;
      description?: string;
      sortOrder: number;
    };
    const validCatsToCreate: ValidCategory[] = [];

    type ValidVariantItem = {
      productSku: string;
      variantName: string;
      itemCode?: string;
      shortDescription?: string;
      description?: string;
      videoUrl?: string;
      isFeatured: boolean;
      unit: string;
      unitValue: number;
      variantSku: string;
      price: number;
      salePrice?: number;
      stockQty: number;
      reorderLevel: number;
      isDefault: boolean;
    };

    type ValidProductItem = {
      sku: string;
      name: string;
      slug: string;
      categoryName: string;
      categoryCode?: string;
      categoryDesc?: string;
      basePrice: number;
      salePrice?: number;
      brand?: string;
      hsnCode?: string;
      variants: ValidVariantItem[];
    };

    const validProductsMap = new Map<string, ValidProductItem>();

    let totalSourceRows = 0;

    if (!isMultiSheet) {
      // ══════════════════════════════════════════════════════════════════════════
      // ── UNIFIED SINGLE SHEET MODE ──
      // ══════════════════════════════════════════════════════════════════════════
      let dataSheetName = sheetNames.find((n: string) => {
        const lower = n.toLowerCase();
        return (
          (lower.includes("catalog") || lower.includes("product") || lower.includes("item")) &&
          !lower.includes("instruction")
        );
      });

      if (!dataSheetName) {
        dataSheetName =
          sheetNames.find((n: string) => !n.toLowerCase().includes("instruction")) ||
          sheetNames[0];
      }

      const rawRows = parseSheet(dataSheetName);

      const seenCatNames = new Set<string>();
      const seenProdSkus = new Set<string>();
      const seenVarSkus = new Set<string>();
      const seenVarUnitValue = new Set<string>();
      const invalidProductSkus = new Set<string>();

      // Inheritance trackers
      let lastProductSku = "";
      let lastProductName = "";
      let lastCategory = "";
      let lastCatCode = "";
      let lastCatDesc = "";
      let lastBrand = "";
      let lastHsn = "";

      let lastItemName = "";
      let lastItemCode = "";
      let lastShortDesc = "";
      let lastItemDesc = "";
      let lastVideoUrl = "";
      let lastIsFeatured = "";

      for (let idx = 0; idx < rawRows.length; idx++) {
        const rawRow = rawRows[idx];
        const excelRow = idx + 2;

        if (isRowEmpty(rawRow)) {
          continue;
        }
        totalSourceRows++;

        const row = normalizeRowKeys(rawRow);

        // ── Extract Raw Fields (Aligned with Form Modals) ──
        // 1. Category Form Fields
        const rawCategory = safeStr(row.category || row.category_name);
        const rawCatCode = safeStr(
          row.category_code || row.category_slug || row.cat_code || row.category_sku
        );
        const rawCatDesc = safeStr(
          row.category_description || row.cat_desc
        );

        // 2. Product Form Fields
        const rawProdName = safeStr(row.product_name || row.product || row.name);
        const rawProdSku = safeStr(
          row.product_sku || row.product_code || row.prod_sku || row.sku
        ).toUpperCase();
        const rawBrand = safeStr(row.brand || row.brand_name);
        const rawHsn = safeStr(row.hsn_code || row.hsn);

        // 3. Item (Variant) Form Fields
        const rawItemName = safeStr(
          row.item_name || row.item || row.variant_name || row.variant
        );
        const rawItemCode = safeStr(
          row.item_code || row.item_slug || row.variant_code || row.variant_slug
        );
        const rawShortDesc = safeStr(row.short_description || row.short_desc);
        const rawItemDesc = safeStr(
          row.item_description || row.product_description || row.description
        );
        const rawIsFeatured = safeStr(row.is_featured || row.featured);
        const rawVideoUrl = safeStr(row.video_url || row.video);

        // 4. Pack Size, Pricing & Inventory Fields
        const rawUnit = safeStr(
          row.unit || row.unit_code || row.measurement_unit || row.uom
        );
        const rawUnitVal =
          row.unit_value !== "" && row.unit_value !== undefined
            ? row.unit_value
            : row.pack_size !== "" && row.pack_size !== undefined
            ? row.pack_size
            : row.size !== "" && row.size !== undefined
            ? row.size
            : "";

        const rawItemSku = safeStr(
          row.item_sku || row.variant_sku || (row.sku && row.sku !== row.product_sku ? row.sku : "")
        ).toUpperCase();

        const rawPrice =
          row.price !== "" && row.price !== undefined
            ? row.price
            : row.base_price !== "" && row.base_price !== undefined
            ? row.base_price
            : row.unit_price !== "" && row.unit_price !== undefined
            ? row.unit_price
            : row.rate !== "" && row.rate !== undefined
            ? row.rate
            : "";

        const rawSalePrice =
          row.sale_price !== "" && row.sale_price !== undefined
            ? row.sale_price
            : row.offer_price !== "" && row.offer_price !== undefined
            ? row.offer_price
            : "";

        const rawStock =
          row.stock_qty !== "" && row.stock_qty !== undefined
            ? row.stock_qty
            : row.stock !== "" && row.stock !== undefined
            ? row.stock
            : row.quantity !== "" && row.quantity !== undefined
            ? row.quantity
            : row.qty !== "" && row.qty !== undefined
            ? row.qty
            : "";

        const rawReorder =
          row.reorder_level !== "" && row.reorder_level !== undefined
            ? row.reorder_level
            : row.reorder_qty !== "" && row.reorder_qty !== undefined
            ? row.reorder_qty
            : row.min_stock !== "" && row.min_stock !== undefined
            ? row.min_stock
            : "";

        const rawIsDefault = safeStr(row.is_default || row.default);

        // ── Handle Product & Item Inheritance ──
        let currentProdSku = "";
        let currentProdName = "";
        let currentCategory = "";
        let currentCatCode = "";
        let currentCatDesc = "";
        let currentBrand = "";
        let currentHsn = "";

        if (rawProdSku) {
          if (rawProdSku !== lastProductSku) {
            // New product encounter
            currentProdSku = rawProdSku;
            currentProdName = rawProdName;
            currentCategory = rawCategory;
            currentCatCode = rawCatCode;
            currentCatDesc = rawCatDesc;
            currentBrand = rawBrand;
            currentHsn = rawHsn;

            lastProductSku = currentProdSku;
            lastProductName = currentProdName;
            lastCategory = currentCategory;
            lastCatCode = currentCatCode;
            lastCatDesc = currentCatDesc;
            lastBrand = currentBrand;
            lastHsn = currentHsn;

            lastItemName = "";
            lastItemCode = "";
            lastShortDesc = "";
            lastItemDesc = "";
            lastVideoUrl = "";
            lastIsFeatured = "";
          } else {
            // Continuation of same product
            currentProdSku = rawProdSku;
            currentProdName = rawProdName || lastProductName;
            currentCategory = rawCategory || lastCategory;
            currentCatCode = rawCatCode || lastCatCode;
            currentCatDesc = rawCatDesc || lastCatDesc;
            currentBrand = rawBrand || lastBrand;
            currentHsn = rawHsn || lastHsn;
          }
        } else if (lastProductSku) {
          // Inherit from preceding product
          currentProdSku = lastProductSku;
          currentProdName = rawProdName || lastProductName;
          currentCategory = rawCategory || lastCategory;
          currentCatCode = rawCatCode || lastCatCode;
          currentCatDesc = rawCatDesc || lastCatDesc;
          currentBrand = rawBrand || lastBrand;
          currentHsn = rawHsn || lastHsn;
        } else {
          // First row has no SKU at all
          currentProdSku = "";
          currentProdName = rawProdName;
          currentCategory = rawCategory;
          currentCatCode = rawCatCode;
          currentCatDesc = rawCatDesc;
          currentBrand = rawBrand;
          currentHsn = rawHsn;
        }

        // Handle item-level inheritance
        let currentItemName = "";
        let currentItemCode = "";
        let currentShortDesc = "";
        let currentItemDesc = "";
        let currentVideoUrl = "";
        let currentIsFeatured = "";

        if (rawItemName) {
          if (rawItemName !== lastItemName) {
            currentItemName = rawItemName;
            currentItemCode = rawItemCode;
            currentShortDesc = rawShortDesc;
            currentItemDesc = rawItemDesc;
            currentVideoUrl = rawVideoUrl;
            currentIsFeatured = rawIsFeatured;

            lastItemName = currentItemName;
            lastItemCode = currentItemCode;
            lastShortDesc = currentShortDesc;
            lastItemDesc = currentItemDesc;
            lastVideoUrl = currentVideoUrl;
            lastIsFeatured = currentIsFeatured;
          } else {
            currentItemName = rawItemName;
            currentItemCode = rawItemCode || lastItemCode;
            currentShortDesc = rawShortDesc || lastShortDesc;
            currentItemDesc = rawItemDesc || lastItemDesc;
            currentVideoUrl = rawVideoUrl || lastVideoUrl;
            currentIsFeatured = rawIsFeatured || lastIsFeatured;
          }
        } else if (lastItemName) {
          currentItemName = lastItemName;
          currentItemCode = rawItemCode || lastItemCode;
          currentShortDesc = rawShortDesc || lastShortDesc;
          currentItemDesc = rawItemDesc || lastItemDesc;
          currentVideoUrl = rawVideoUrl || lastVideoUrl;
          currentIsFeatured = rawIsFeatured || lastIsFeatured;
        } else {
          currentItemName = "";
          currentItemCode = rawItemCode;
          currentShortDesc = rawShortDesc;
          currentItemDesc = rawItemDesc;
          currentVideoUrl = rawVideoUrl;
          currentIsFeatured = rawIsFeatured;
        }

        // ── Comprehensive Field Validations (Exact Form Modal Rules) ──
        const rowErrors: string[] = [];

        // 1. Category Field Validation (Both Category Name and Category Code are required in form)
        if (!rawCategory) {
          rowErrors.push("Category is required");
        } else if (rawCategory.length > 150) {
          rowErrors.push("Category name cannot exceed 150 characters");
        }

        if (!rawCatCode) {
          rowErrors.push("Category code is required");
        } else if (rawCatCode.length > 170) {
          rowErrors.push("Category code cannot exceed 170 characters");
        } else if (!/^[A-Za-z0-9_]+$/.test(rawCatCode)) {
          rowErrors.push(
            "Category code can only contain letters, numbers, and underscores (no spaces)"
          );
        } else if (
          categorySlugMap.has(rawCatCode.toLowerCase()) &&
          rawCategory &&
          categorySlugMap.get(rawCatCode.toLowerCase())!.name.toLowerCase() !== rawCategory.toLowerCase()
        ) {
          const conflict = categorySlugMap.get(rawCatCode.toLowerCase())!;
          rowErrors.push(
            `Category code "${rawCatCode}" already exists for category "${conflict.name}" in database`
          );
        }

        if (currentCatDesc && currentCatDesc.length > 2000) {
          rowErrors.push("Category description cannot exceed 2000 characters");
        }

        // 2. Product Field Validation (Both Product Name and Product SKU are required in form)
        if (!rawProdName) {
          rowErrors.push("Product name is required");
        } else if (rawProdName.length > 100) {
          rowErrors.push("Product name cannot exceed 100 characters");
        }

        if (!rawProdSku) {
          rowErrors.push("Product SKU is required");
        } else if (rawProdSku.length > 100) {
          rowErrors.push("Product SKU cannot exceed 100 characters");
        }

        if (currentBrand && currentBrand.length > 100) {
          rowErrors.push("Brand cannot exceed 100 characters");
        }

        if (currentHsn && currentHsn.length > 20) {
          rowErrors.push("HSN code cannot exceed 20 characters");
        }

        // Check product SKU in DB / duplicates if newly seen
        const isFirstProductOccurrence =
          rawProdSku && !seenProdSkus.has(rawProdSku);
        if (isFirstProductOccurrence) {
          if (existingProductSkus.has(rawProdSku)) {
            rowErrors.push(`Product SKU "${rawProdSku}" already exists in database`);
          }
        }

        if (rawProdSku && invalidProductSkus.has(rawProdSku)) {
          rowErrors.push(`Product "${rawProdSku}" has validation errors`);
        }

        // 3. Item (Variant) Field Validation (Both Item Name and Item Code are required in form)
        if (!rawItemName) {
          rowErrors.push("Item name is required");
        } else if (rawItemName.length > 100) {
          rowErrors.push("Item name cannot exceed 100 characters");
        }

        if (!rawItemCode) {
          rowErrors.push("Item code is required");
        } else if (rawItemCode.length > 255) {
          rowErrors.push("Item code cannot exceed 255 characters");
        }

        if (currentShortDesc && currentShortDesc.length > 500) {
          rowErrors.push("Short description cannot exceed 500 characters");
        }

        if (currentItemDesc && currentItemDesc.length > 5000) {
          rowErrors.push("Item description cannot exceed 5000 characters");
        }

        if (currentVideoUrl && currentVideoUrl.length > 500) {
          rowErrors.push("Video URL cannot exceed 500 characters");
        }

        // 4. Pack Size & Pricing Validation
        // Unit
        let validatedUnitCode = "";
        if (!rawUnit) {
          rowErrors.push(`Unit is required. Valid units: ${validUnitList}`);
        } else {
          const lowerUnit = rawUnit.toLowerCase();
          const matchedUnit = dbUnits.find(
            (u) => u.code.toLowerCase() === lowerUnit || u.name.toLowerCase() === lowerUnit
          );
          if (!matchedUnit) {
            rowErrors.push(
              `Unknown unit "${rawUnit}". Valid units: ${validUnitList}`
            );
          } else {
            validatedUnitCode = matchedUnit.code.toLowerCase();
          }
        }

        // Unit Value (Pack Size)
        let validatedUnitValue = 0;
        if (rawUnitVal === "" || rawUnitVal === undefined || rawUnitVal === null) {
          rowErrors.push("Pack size (unit value) is required");
        } else {
          const num = Number(rawUnitVal);
          if (isNaN(num) || num <= 0) {
            rowErrors.push("Pack size (unit value) must be greater than 0");
          } else if (num > 1000000) {
            rowErrors.push("Pack size (unit value) cannot exceed 1,000,000");
          } else {
            validatedUnitValue = num;
          }
        }

        // Item SKU
        if (!rawItemSku) {
          rowErrors.push("Item SKU is required");
        } else {
          if (rawItemSku.length > 100) {
            rowErrors.push("Item SKU cannot exceed 100 characters");
          }
          if (existingVariantSkus.has(rawItemSku)) {
            rowErrors.push(`Item SKU "${rawItemSku}" already exists in database`);
          }
          if (seenVarSkus.has(rawItemSku)) {
            rowErrors.push(`Duplicate item SKU "${rawItemSku}" in sheet`);
          }
        }

        // Price
        let validatedPrice = 0;
        if (rawPrice === "" || rawPrice === undefined || rawPrice === null) {
          rowErrors.push("Price is required and must be greater than 0");
        } else {
          const num = Number(rawPrice);
          if (isNaN(num) || num <= 0) {
            rowErrors.push("Price must be greater than 0");
          } else if (num > 10000000) {
            rowErrors.push("Price cannot exceed 10,000,000");
          } else {
            validatedPrice = num;
          }
        }

        // Sale Price (Optional)
        let validatedSalePrice: number | undefined = undefined;
        if (rawSalePrice !== "" && rawSalePrice !== undefined && rawSalePrice !== null) {
          const sNum = Number(rawSalePrice);
          if (isNaN(sNum) || sNum <= 0) {
            rowErrors.push("Sale price must be greater than 0");
          } else if (validatedPrice > 0 && sNum > validatedPrice) {
            rowErrors.push("Sale price cannot be greater than base price");
          } else {
            validatedSalePrice = sNum;
          }
        }

        // Stock Quantity (Optional, non-negative integer)
        let validatedStock = 0;
        if (rawStock !== "" && rawStock !== undefined && rawStock !== null) {
          const sNum = Number(rawStock);
          if (isNaN(sNum) || !Number.isInteger(sNum) || sNum < 0) {
            rowErrors.push("Stock quantity must be a non-negative whole number (integer >= 0)");
          } else {
            validatedStock = sNum;
          }
        }

        // Reorder Level (Optional, non-negative integer)
        let validatedReorder = 10;
        if (rawReorder !== "" && rawReorder !== undefined && rawReorder !== null) {
          const rNum = Number(rawReorder);
          if (isNaN(rNum) || !Number.isInteger(rNum) || rNum < 0) {
            rowErrors.push("Reorder level must be a non-negative whole number (integer >= 0)");
          } else {
            validatedReorder = rNum;
          }
        }

        // Duplicate measurement check under same item
        if (currentProdSku && currentItemName && validatedUnitCode && validatedUnitValue > 0) {
          const unitValKey = `${currentProdSku}::${currentItemName.toLowerCase()}::${validatedUnitCode}::${validatedUnitValue}`;
          if (seenVarUnitValue.has(unitValKey)) {
            rowErrors.push(
              `Duplicate pack size ${validatedUnitValue}${validatedUnitCode} for item "${currentItemName}" under product "${currentProdSku}"`
            );
          } else {
            seenVarUnitValue.add(unitValKey);
          }
        }

        // ── Record Result ──
        if (rowErrors.length > 0) {
          if (currentProdSku && (!currentProdName || isFirstProductOccurrence)) {
            invalidProductSkus.add(currentProdSku);
          }

          rejected.push({
            row: excelRow,
            sheet: dataSheetName,
            status: "rejected",
            name: rawItemSku || currentProdSku || currentProdName || `Row ${excelRow}`,
            reason: rowErrors.join("; "),
          });
          continue;
        }

        // ── Passed All Validations! ──
        seenProdSkus.add(currentProdSku);
        if (rawItemSku) seenVarSkus.add(rawItemSku);

        // 1. Process Category
        const formattedCat = formatTitleCase(currentCategory);
        let catName = formattedCat;
        let parentCat: string | undefined = undefined;
        if (formattedCat.includes(">")) {
          const parts = formattedCat.split(">").map((s) => formatTitleCase(s.trim()));
          parentCat = parts[0];
          catName = parts[1];
          if (parentCat && !seenCatNames.has(parentCat.toLowerCase())) {
            seenCatNames.add(parentCat.toLowerCase());
            if (!categoryMap.has(parentCat.toLowerCase())) {
              validCatsToCreate.push({
                name: parentCat,
                slug: makeUniqueSlug(parentCat, usedCatSlugs),
                sortOrder: validCatsToCreate.length + 1,
              });
            }
          }
        }

        if (!seenCatNames.has(catName.toLowerCase())) {
          seenCatNames.add(catName.toLowerCase());
          if (!categoryMap.has(catName.toLowerCase())) {
            const catSlugToUse = currentCatCode
              ? makeUniqueSlug(currentCatCode.toUpperCase(), usedCatSlugs)
              : makeUniqueSlug(catName, usedCatSlugs);

            validCatsToCreate.push({
              name: catName,
              slug: catSlugToUse,
              parentName: parentCat,
              description: currentCatDesc || undefined,
              sortOrder: validCatsToCreate.length + 1,
            });
          }
        }

        // 2. Process Product
        const formattedProdName = formatTitleCase(currentProdName);
        if (!validProductsMap.has(currentProdSku)) {
          validProductsMap.set(currentProdSku, {
            sku: currentProdSku,
            name: formattedProdName,
            slug: makeUniqueSlug(formattedProdName, usedProdSlugs),
            categoryName: catName,
            categoryCode: currentCatCode || undefined,
            categoryDesc: currentCatDesc || undefined,
            basePrice: validatedPrice,
            salePrice: validatedSalePrice,
            brand: currentBrand || undefined,
            hsnCode: currentHsn || undefined,
            variants: [],
          });
        }

        // 3. Process Item
        const formattedItemName = formatTitleCase(currentItemName);
        const prod = validProductsMap.get(currentProdSku)!;
        prod.variants.push({
          productSku: currentProdSku,
          variantName: formattedItemName,
          itemCode: currentItemCode || undefined,
          shortDescription: currentShortDesc || undefined,
          description: currentItemDesc || undefined,
          videoUrl: currentVideoUrl || undefined,
          isFeatured: safeBool(currentIsFeatured),
          unit: validatedUnitCode,
          unitValue: validatedUnitValue,
          variantSku: rawItemSku,
          price: validatedPrice,
          salePrice: validatedSalePrice,
          stockQty: validatedStock,
          reorderLevel: validatedReorder,
          isDefault: safeBool(rawIsDefault),
        });
      }
    } else {
      // ══════════════════════════════════════════════════════════════════════════
      // ── MULTI-SHEET MODE (Categories, Products, Items/Variants) ──
      // ══════════════════════════════════════════════════════════════════════════
      const rawCats = parseSheet("Categories");
      const rawProds = parseSheet("Products");
      const rawItems = sheetNames.includes("Items")
        ? parseSheet("Items")
        : parseSheet("Variants");

      totalSourceRows = rawCats.length + rawProds.length + rawItems.length;

      const seenCatNames = new Set<string>();
      const seenProdSkus = new Set<string>();
      const seenVarSkus = new Set<string>();
      const seenVarUnitValue = new Set<string>();
      const validProductSkuSet = new Set<string>();

      // 1. Validate Categories Sheet
      for (let i = 0; i < rawCats.length; i++) {
        const rawRow = rawCats[i];
        const excelRow = i + 2;
        if (isRowEmpty(rawRow)) continue;

        const row = normalizeRowKeys(rawRow) as RawCategoryRow;
        const name = safeStr(row.category_name || row.name || row.category);
        const code = safeStr(row.category_code || row.category_slug || row.slug);
        const parent = safeStr(row.parent_category || row.parent);
        const desc = safeStr(row.category_description || row.description);
        const rawSort = row.sort_order;

        const catErrors: string[] = [];

        if (!name) {
          catErrors.push("Category name is required");
        } else if (name.length > 150) {
          catErrors.push("Category name cannot exceed 150 characters");
        }

        if (!code) {
          catErrors.push("Category code is required");
        } else if (code.length > 170) {
          catErrors.push("Category code cannot exceed 170 characters");
        } else if (!/^[A-Za-z0-9_]+$/.test(code)) {
          catErrors.push(
            "Category code can only contain letters, numbers, and underscores (no spaces)"
          );
        } else if (
          categorySlugMap.has(code.toLowerCase()) &&
          name &&
          categorySlugMap.get(code.toLowerCase())!.name.toLowerCase() !== name.toLowerCase()
        ) {
          const conflict = categorySlugMap.get(code.toLowerCase())!;
          catErrors.push(
            `Category code "${code}" already exists for category "${conflict.name}" in database`
          );
        }

        if (desc && desc.length > 2000) {
          catErrors.push("Category description cannot exceed 2000 characters");
        }

        let sortOrder = 0;
        if (rawSort !== "" && rawSort !== undefined && rawSort !== null) {
          const sNum = Number(rawSort);
          if (isNaN(sNum) || !Number.isInteger(sNum) || sNum < 0 || sNum > 100) {
            catErrors.push("Sort order must be an integer between 0 and 100");
          } else {
            sortOrder = sNum;
          }
        }

        if (name && seenCatNames.has(name.toLowerCase())) {
          catErrors.push(`Duplicate category name "${name}" in sheet`);
        }

        if (catErrors.length > 0) {
          rejected.push({
            row: excelRow,
            sheet: "Categories",
            status: "rejected",
            name: name || `Row ${excelRow}`,
            reason: catErrors.join("; "),
          });
          continue;
        }

        seenCatNames.add(name.toLowerCase());
        const formattedCat = formatTitleCase(name);
        if (!categoryMap.has(formattedCat.toLowerCase())) {
          const catSlugToUse = code
            ? makeUniqueSlug(code.toUpperCase(), usedCatSlugs)
            : makeUniqueSlug(formattedCat, usedCatSlugs);

          validCatsToCreate.push({
            name: formattedCat,
            slug: catSlugToUse,
            parentName: parent ? formatTitleCase(parent) : undefined,
            description: desc || undefined,
            sortOrder,
          });
        }
      }

      // 2. Validate Products Sheet
      for (let i = 0; i < rawProds.length; i++) {
        const rawRow = rawProds[i];
        const excelRow = i + 2;
        if (isRowEmpty(rawRow)) continue;

        const row = normalizeRowKeys(rawRow) as RawProductRow;
        const name = safeStr(row.product_name || row.name || row.product);
        const sku = safeStr(row.sku || row.product_sku || row.product_code).toUpperCase();
        const catName = safeStr(row.category_name || row.category);
        const brand = safeStr(row.brand || row.brand_name);
        const hsn = safeStr(row.hsn_code || row.hsn);
        const rawBasePrice = row.base_price ?? row.price;
        const rawSalePrice = row.sale_price;

        const prodErrors: string[] = [];

        if (!name) {
          prodErrors.push("Product name is required");
        } else if (name.length > 100) {
          prodErrors.push("Product name cannot exceed 100 characters");
        }

        if (!sku) {
          prodErrors.push("Product SKU is required");
        } else if (sku.length > 100) {
          prodErrors.push("Product SKU cannot exceed 100 characters");
        } else {
          if (existingProductSkus.has(sku)) {
            prodErrors.push(`SKU "${sku}" already exists in database`);
          }
          if (seenProdSkus.has(sku)) {
            prodErrors.push(`Duplicate SKU "${sku}" in sheet`);
          }
        }

        if (!catName) {
          prodErrors.push("Category is required");
        } else if (catName.length > 150) {
          prodErrors.push("Category name cannot exceed 150 characters");
        }

        if (brand && brand.length > 100) {
          prodErrors.push("Brand cannot exceed 100 characters");
        }

        if (hsn && hsn.length > 20) {
          prodErrors.push("HSN code cannot exceed 20 characters");
        }

        let basePrice = 0;
        if (rawBasePrice !== "" && rawBasePrice !== undefined && rawBasePrice !== null) {
          const pNum = Number(rawBasePrice);
          if (isNaN(pNum) || pNum <= 0) {
            prodErrors.push("Base price must be greater than 0");
          } else {
            basePrice = pNum;
          }
        }

        let salePrice: number | undefined = undefined;
        if (rawSalePrice !== "" && rawSalePrice !== undefined && rawSalePrice !== null) {
          const sNum = Number(rawSalePrice);
          if (isNaN(sNum) || sNum <= 0) {
            prodErrors.push("Sale price must be greater than 0");
          } else if (basePrice > 0 && sNum > basePrice) {
            prodErrors.push("Sale price cannot be greater than base price");
          } else {
            salePrice = sNum;
          }
        }

        if (prodErrors.length > 0) {
          rejected.push({
            row: excelRow,
            sheet: "Products",
            status: "rejected",
            name: sku || name || `Row ${excelRow}`,
            reason: prodErrors.join("; "),
          });
          continue;
        }

        seenProdSkus.add(sku);
        validProductSkuSet.add(sku);

        const formattedProdName = formatTitleCase(name);
        const formattedCatName = formatTitleCase(catName);

        validProductsMap.set(sku, {
          sku,
          name: formattedProdName,
          slug: makeUniqueSlug(formattedProdName, usedProdSlugs),
          categoryName: formattedCatName,
          basePrice,
          salePrice,
          brand: brand || undefined,
          hsnCode: hsn || undefined,
          variants: [],
        });
      }

      // 3. Validate Items Sheet
      const itemSheetName = sheetNames.includes("Items") ? "Items" : "Variants";
      for (let i = 0; i < rawItems.length; i++) {
        const rawRow = rawItems[i];
        const excelRow = i + 2;
        if (isRowEmpty(rawRow)) continue;

        const row = normalizeRowKeys(rawRow) as RawItemRow;
        const pSku = safeStr(row.product_sku || row.product_code || row.sku).toUpperCase();
        const itemName = safeStr(
          row.item_name || row.item || row.variant_name || row.variant || row.name
        );
        const itemCode = safeStr(
          row.item_code || row.item_slug || row.variant_code || row.variant_slug
        );
        const shortDesc = safeStr(row.short_description || row.short_desc);
        const itemDesc = safeStr(
          row.item_description || row.product_description || row.description
        );
        const isFeatured = safeStr(row.is_featured || row.featured);
        const videoUrl = safeStr(row.video_url || row.video);

        const unit = safeStr(row.unit || row.unit_code || row.measurement_unit || row.uom);
        const rawUnitVal = row.unit_value ?? row.pack_size ?? row.size;
        const itemSku = safeStr(
          row.item_sku || row.item_code || row.variant_sku || row.sku
        ).toUpperCase();
        const rawPrice = row.price ?? row.base_price ?? row.unit_price ?? row.rate;
        const rawSalePrice = row.sale_price ?? row.offer_price;
        const rawStock = row.stock_qty ?? row.stock ?? row.quantity ?? row.qty;
        const rawReorder = row.reorder_level ?? row.reorder_qty ?? row.min_stock;
        const rawIsDefault = safeStr(row.is_default || row.default);

        const itemErrors: string[] = [];

        if (!pSku) {
          itemErrors.push("Product SKU is required");
        } else if (!validProductSkuSet.has(pSku) && !existingProductSkus.has(pSku)) {
          itemErrors.push(`Product SKU "${pSku}" not found in Products sheet or database`);
        }

        if (!itemName) {
          itemErrors.push("Item name is required");
        } else if (itemName.length > 100) {
          itemErrors.push("Item name cannot exceed 100 characters");
        }

        if (!itemCode) {
          itemErrors.push("Item code is required");
        } else if (itemCode.length > 255) {
          itemErrors.push("Item code cannot exceed 255 characters");
        }

        if (shortDesc && shortDesc.length > 500) {
          itemErrors.push("Short description cannot exceed 500 characters");
        }

        if (itemDesc && itemDesc.length > 5000) {
          itemErrors.push("Item description cannot exceed 5000 characters");
        }

        if (videoUrl && videoUrl.length > 500) {
          itemErrors.push("Video URL cannot exceed 500 characters");
        }

        let validatedUnitCode = "";
        if (!unit) {
          itemErrors.push(`Unit is required. Valid units: ${validUnitList}`);
        } else {
          const lowerUnit = unit.toLowerCase();
          const matchedUnit = dbUnits.find(
            (u) => u.code.toLowerCase() === lowerUnit || u.name.toLowerCase() === lowerUnit
          );
          if (!matchedUnit) {
            itemErrors.push(`Unknown unit "${unit}". Valid units: ${validUnitList}`);
          } else {
            validatedUnitCode = matchedUnit.code.toLowerCase();
          }
        }

        let unitValue = 0;
        if (rawUnitVal === "" || rawUnitVal === undefined || rawUnitVal === null) {
          itemErrors.push("Pack size (unit value) is required");
        } else {
          const num = Number(rawUnitVal);
          if (isNaN(num) || num <= 0) {
            itemErrors.push("Pack size (unit value) must be greater than 0");
          } else {
            unitValue = num;
          }
        }

        if (!itemSku) {
          itemErrors.push("Item SKU is required");
        } else {
          if (itemSku.length > 100) {
            itemErrors.push("Item SKU cannot exceed 100 characters");
          }
          if (existingVariantSkus.has(itemSku)) {
            itemErrors.push(`Item SKU "${itemSku}" already exists in database`);
          }
          if (seenVarSkus.has(itemSku)) {
            itemErrors.push(`Duplicate item SKU "${itemSku}" in sheet`);
          }
        }

        let price = 0;
        if (rawPrice === "" || rawPrice === undefined || rawPrice === null) {
          itemErrors.push("Price is required and must be greater than 0");
        } else {
          const num = Number(rawPrice);
          if (isNaN(num) || num <= 0) {
            itemErrors.push("Price must be greater than 0");
          } else {
            price = num;
          }
        }

        let salePrice: number | undefined = undefined;
        if (rawSalePrice !== "" && rawSalePrice !== undefined && rawSalePrice !== null) {
          const sNum = Number(rawSalePrice);
          if (isNaN(sNum) || sNum <= 0) {
            itemErrors.push("Sale price must be greater than 0");
          } else if (price > 0 && sNum > price) {
            itemErrors.push("Sale price cannot be greater than base price");
          } else {
            salePrice = sNum;
          }
        }

        let stockQty = 0;
        if (rawStock !== "" && rawStock !== undefined && rawStock !== null) {
          const sNum = Number(rawStock);
          if (isNaN(sNum) || !Number.isInteger(sNum) || sNum < 0) {
            itemErrors.push("Stock quantity must be a non-negative whole number (integer >= 0)");
          } else {
            stockQty = sNum;
          }
        }

        let reorderLevel = 10;
        if (rawReorder !== "" && rawReorder !== undefined && rawReorder !== null) {
          const rNum = Number(rawReorder);
          if (isNaN(rNum) || !Number.isInteger(rNum) || rNum < 0) {
            itemErrors.push("Reorder level must be a non-negative whole number (integer >= 0)");
          } else {
            reorderLevel = rNum;
          }
        }

        if (pSku && itemName && validatedUnitCode && unitValue > 0) {
          const unitValKey = `${pSku}::${itemName.toLowerCase()}::${validatedUnitCode}::${unitValue}`;
          if (seenVarUnitValue.has(unitValKey)) {
            itemErrors.push(
              `Duplicate pack size ${unitValue}${validatedUnitCode} for item "${itemName}" under product "${pSku}"`
            );
          } else {
            seenVarUnitValue.add(unitValKey);
          }
        }

        if (itemErrors.length > 0) {
          rejected.push({
            row: excelRow,
            sheet: itemSheetName,
            status: "rejected",
            name: itemSku || `Row ${excelRow}`,
            reason: itemErrors.join("; "),
          });
          continue;
        }

        seenVarSkus.add(itemSku);

        const prod = validProductsMap.get(pSku);
        if (prod) {
          prod.variants.push({
            productSku: pSku,
            variantName: formatTitleCase(itemName),
            itemCode: itemCode || undefined,
            shortDescription: shortDesc || undefined,
            description: itemDesc || undefined,
            videoUrl: videoUrl || undefined,
            isFeatured: safeBool(isFeatured),
            unit: validatedUnitCode,
            unitValue,
            variantSku: itemSku,
            price,
            salePrice,
            stockQty,
            reorderLevel,
            isDefault: safeBool(rawIsDefault),
          });
        }
      }
    }

    // ── Build Valid Products List & Preview ──
    const validProds: ValidProductItem[] = [];
    let totalValidVariantsCount = 0;

    for (const prod of validProductsMap.values()) {
      if (prod.variants.length > 0) {
        validProds.push(prod);
        totalValidVariantsCount += prod.variants.length;
        preview.push({
          categoryName: prod.categoryName,
          productName: prod.name,
          sku: prod.sku,
          brand: prod.brand,
          variants: prod.variants.map((v) => ({
            variantName: v.variantName,
            itemCode: v.itemCode,
            unit: v.unit,
            unitValue: v.unitValue,
            variantSku: v.variantSku,
            price: v.price,
            salePrice: v.salePrice,
            stockQty: v.stockQty,
            isDefault: v.isDefault,
          })),
        });
      }
    }

    const successCount = !isMultiSheet
      ? totalValidVariantsCount
      : validCatsToCreate.length + validProds.length + totalValidVariantsCount;

    // Return early if preview / dry run
    if (dryRun) {
      return {
        totalRows: totalSourceRows,
        successCount,
        rejectedCount: rejected.length,
        preview,
        rejected,
        importedCategories: [],
        importedProducts: [],
      };
    }

    // ── Commit Valid Data to Database (Atomic Transaction) ──
    try {
      await db.$transaction(async (tx) => {
        // 1. Insert Categories
        for (const cat of validCatsToCreate) {
          let parentId: bigint | undefined;
          if (cat.parentName) {
            parentId = categoryMap.get(cat.parentName.toLowerCase());
          }
          const created = await tx.productCategory.create({
            data: {
              uuid: crypto.randomUUID(),
              name: cat.name,
              slug: cat.slug,
              description: cat.description ?? null,
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

        // 2. Fetch all unit IDs
        const units = await tx.product_units.findMany({
          select: { id: true, name: true, code: true },
        });
        const unitMap = new Map<string, bigint>();
        for (const u of units) {
          unitMap.set(u.code.toLowerCase(), u.id);
          unitMap.set(u.name.toLowerCase(), u.id);
        }

        // 3. Insert Products + Brands + Items + Unit Prices + Inventory
        for (const prod of validProds) {
          const catId = categoryMap.get(prod.categoryName.toLowerCase());

          // Resolve or create Brand
          let prodBrandId = defaultBrandId;
          if (prod.brand) {
            const bLower = prod.brand.toLowerCase();
            if (brandMap.has(bLower)) {
              prodBrandId = brandMap.get(bLower)!;
            } else {
              const newBrandSlug = makeUniqueSlug(prod.brand, usedBrandSlugs);
              const createdBrand = await tx.productBrand.create({
                data: {
                  uuid: crypto.randomUUID(),
                  name: formatTitleCase(prod.brand),
                  slug: newBrandSlug,
                  status: true,
                  isActive: true,
                  created_by: adminUserId ?? null,
                  updated_by: adminUserId ?? null,
                },
              });
              prodBrandId = createdBrand.id;
              brandMap.set(bLower, createdBrand.id);
              brandMap.set(newBrandSlug.toLowerCase(), createdBrand.id);
            }
          }

          // Resolve or create HSN Code
          let prodHsnId: bigint | null = null;
          if (prod.hsnCode) {
            const hKey = prod.hsnCode.trim();
            const hUpper = hKey.toUpperCase();
            const hLower = hKey.toLowerCase();
            if (hsnMap.has(hUpper) || hsnMap.has(hLower)) {
              prodHsnId = (hsnMap.get(hUpper) || hsnMap.get(hLower))!;
            } else {
              const createdHsn = await tx.product_hsn_codes.create({
                data: {
                  uuid: crypto.randomUUID(),
                  code: hUpper,
                  status: true,
                  is_active: true,
                  created_by: adminUserId ?? null,
                  updated_by: adminUserId ?? null,
                },
              });
              prodHsnId = createdHsn.id;
              hsnMap.set(hUpper, createdHsn.id);
              hsnMap.set(hLower, createdHsn.id);
            }
          }

          const createdProd = await tx.product.create({
            data: {
              uuid: crypto.randomUUID(),
              name: prod.name,
              slug: prod.slug,
              sku: prod.sku,
              base_price: prod.basePrice,
              sale_price: prod.salePrice ?? null,
              categoryId: catId ? catId : null,
              brandId: prodBrandId,
              hsn_code_id: prodHsnId,
              isActive: true,
              status: true,
              created_by: adminUserId ?? null,
              updated_by: adminUserId ?? null,
            },
          });
          importedProducts.push(prod.name);

          // Group items by item_name (3-tier architecture: Product -> Item -> UnitPrice)
          const variantsByName = new Map<string, ValidVariantItem[]>();
          for (const v of prod.variants) {
            const key = v.variantName.toLowerCase();
            if (!variantsByName.has(key)) variantsByName.set(key, []);
            variantsByName.get(key)!.push(v);
          }

          let isFirstVariant = true;
          for (const [, subvariants] of variantsByName) {
            const first = subvariants[0];
            const variantSlug = first.itemCode
              ? makeUniqueSlug(first.itemCode.toUpperCase(), usedVarSlugs)
              : makeUniqueSlug(`${prod.slug}-${first.variantName}`, usedVarSlugs);

            let isVariantDefault = subvariants.some((sv) => sv.isDefault);
            if (isFirstVariant && !prod.variants.some((v) => v.isDefault)) {
              isVariantDefault = true;
            }
            isFirstVariant = false;

            const createdVariant = await tx.productVariant.create({
              data: {
                uuid: crypto.randomUUID(),
                productId: createdProd.id,
                variant_name: first.variantName,
                slug: variantSlug,
                short_description: first.shortDescription ?? null,
                description: first.description ?? null,
                video_url: first.videoUrl ?? null,
                is_featured: first.isFeatured ?? false,
                is_default: isVariantDefault,
                isActive: true,
                out_of_stock: false,
                created_by: adminUserId ?? null,
                updated_by: adminUserId ?? null,
              },
            });

            // Ensure at least one subvariant in this item is marked default
            if (!subvariants.some((sv) => sv.isDefault)) {
              subvariants[0].isDefault = true;
            }

            for (const sv of subvariants) {
              const unitId = unitMap.get(sv.unit);
              if (!unitId) continue;

              const createdVup = await tx.variantUnitPrice.create({
                data: {
                  uuid: crypto.randomUUID(),
                  variant_id: createdVariant.id,
                  unit_id: unitId,
                  unit_value: sv.unitValue,
                  sku: sv.variantSku,
                  base_price: sv.price,
                  is_default: sv.isDefault,
                  isActive: true,
                  created_by: adminUserId ?? null,
                  updated_by: adminUserId ?? null,
                },
              });

              await tx.inventory.create({
                data: {
                  variantUnitPriceId: createdVup.id,
                  quantity_available: sv.stockQty,
                  quantity_reserved: 0,
                  reorderLevel: sv.reorderLevel,
                  is_active: true,
                  created_by: adminUserId ?? null,
                  updated_by: adminUserId ?? null,
                },
              });
            }
          }
        }
      });
    } catch (error: any) {
      const details = extractPrismaDuplicateDetails(error);
      if (details?.value || details?.field) {
        throw ApiError.conflict(details.message);
      }
      const prismaResult = handlePrismaError(error);
      if (prismaResult && prismaResult.message !== "A database error occurred") {
        throw prismaResult;
      }
      throw error;
    }

    return {
      totalRows: totalSourceRows,
      successCount,
      rejectedCount: rejected.length,
      preview,
      rejected,
      importedCategories,
      importedProducts,
    };
  },
};
