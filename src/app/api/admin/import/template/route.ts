import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

/**
 * GET /api/admin/import/template
 * Returns a ready-to-fill Single Unified Excel template with sample catalog rows and instructions.
 */
export async function GET() {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Catalog Import (Single Unified Sheet) ──
  const catalogHeaders = [
    "category",
    "product_name",
    "product_sku",
    "product_description",
    "variant_name",
    "unit_value",
    "unit",
    "variant_sku",
    "price",
    "stock_qty",
    "reorder_level",
    "is_default",
    "hsn_code",
  ];

  const sampleRows = [
    // Turmeric: 2 Variants (Standard Pouch & Pet Jar), multiple sizes
    [
      "Spices",
      "Turmeric Powder",
      "KA-TUR-001",
      "Pure sun-dried Kolli Hills turmeric",
      "Standard Pouch",
      100,
      "g",
      "KA-TUR-P100",
      85,
      200,
      30,
      "YES",
      "0910",
    ],
    [
      "Spices",
      "Turmeric Powder",
      "KA-TUR-001",
      "Pure sun-dried Kolli Hills turmeric",
      "Standard Pouch",
      250,
      "g",
      "KA-TUR-P250",
      200,
      150,
      20,
      "NO",
      "0910",
    ],
    [
      "Spices",
      "Turmeric Powder",
      "KA-TUR-001",
      "Pure sun-dried Kolli Hills turmeric",
      "Standard Pouch",
      500,
      "g",
      "KA-TUR-P500",
      380,
      100,
      15,
      "NO",
      "0910",
    ],
    [
      "Spices",
      "Turmeric Powder",
      "KA-TUR-001",
      "Pure sun-dried Kolli Hills turmeric",
      "Pet Jar",
      250,
      "g",
      "KA-TUR-J250",
      220,
      80,
      15,
      "NO",
      "0910",
    ],
    [
      "Spices",
      "Turmeric Powder",
      "KA-TUR-001",
      "Pure sun-dried Kolli Hills turmeric",
      "Pet Jar",
      500,
      "g",
      "KA-TUR-J500",
      410,
      60,
      10,
      "NO",
      "0910",
    ],

    // Red Chilli: Standard Pouch with 2 sizes
    [
      "Spices",
      "Red Chilli Powder",
      "KA-RCP-002",
      "Stone-ground fiery red chilli",
      "Standard Pouch",
      100,
      "g",
      "KA-RCP-P100",
      90,
      180,
      25,
      "YES",
      "0904",
    ],
    [
      "Spices",
      "Red Chilli Powder",
      "KA-RCP-002",
      "Stone-ground fiery red chilli",
      "Standard Pouch",
      250,
      "g",
      "KA-RCP-P250",
      210,
      120,
      20,
      "NO",
      "0904",
    ],

    // Green Cardamom: 2 Grades (Grade A Bold & Grade B Regular)
    [
      "Spices",
      "Green Cardamom",
      "KA-CARD-003",
      "Aromatic whole green cardamom from Kolli Hills",
      "Grade A Bold (8mm)",
      100,
      "g",
      "KA-CARD-A100",
      350,
      100,
      20,
      "YES",
      "0908",
    ],
    [
      "Spices",
      "Green Cardamom",
      "KA-CARD-003",
      "Aromatic whole green cardamom from Kolli Hills",
      "Grade A Bold (8mm)",
      250,
      "g",
      "KA-CARD-A250",
      800,
      80,
      15,
      "NO",
      "0908",
    ],
    [
      "Spices",
      "Green Cardamom",
      "KA-CARD-003",
      "Aromatic whole green cardamom from Kolli Hills",
      "Grade B Regular (7mm)",
      100,
      "g",
      "KA-CARD-B100",
      280,
      120,
      20,
      "NO",
      "0908",
    ],
    [
      "Spices",
      "Green Cardamom",
      "KA-CARD-003",
      "Aromatic whole green cardamom from Kolli Hills",
      "Grade B Regular (7mm)",
      250,
      "g",
      "KA-CARD-B250",
      650,
      90,
      15,
      "NO",
      "0908",
    ],

    // Foxtail Millet: 2 sizes
    [
      "Millets",
      "Foxtail Millet (Thinai)",
      "KA-FOX-004",
      "Whole grain unpolished foxtail millet",
      "Standard Pack",
      500,
      "g",
      "KA-FOX-500G",
      120,
      300,
      40,
      "YES",
      "1008",
    ],
    [
      "Millets",
      "Foxtail Millet (Thinai)",
      "KA-FOX-004",
      "Whole grain unpolished foxtail millet",
      "Standard Pack",
      1,
      "kg",
      "KA-FOX-1KG",
      230,
      200,
      30,
      "NO",
      "1008",
    ],

    // Honey: 2 Variants (Glass Jar & Squeeze Bottle)
    [
      "Honey & Oils",
      "Raw Forest Honey",
      "KA-HON-005",
      "100% pure unprocessed wild honey",
      "Glass Jar",
      250,
      "ml",
      "KA-HON-J250",
      350,
      80,
      10,
      "YES",
      "0409",
    ],
    [
      "Honey & Oils",
      "Raw Forest Honey",
      "KA-HON-005",
      "100% pure unprocessed wild honey",
      "Glass Jar",
      500,
      "ml",
      "KA-HON-J500",
      680,
      60,
      8,
      "NO",
      "0409",
    ],
    [
      "Honey & Oils",
      "Raw Forest Honey",
      "KA-HON-005",
      "100% pure unprocessed wild honey",
      "Squeeze Bottle",
      250,
      "ml",
      "KA-HON-B250",
      370,
      50,
      10,
      "NO",
      "0409",
    ],
    [
      "Honey & Oils",
      "Raw Forest Honey",
      "KA-HON-005",
      "100% pure unprocessed wild honey",
      "Squeeze Bottle",
      500,
      "ml",
      "KA-HON-B500",
      710,
      40,
      8,
      "NO",
      "0409",
    ],

    // Sesame Oil: 2 sizes
    [
      "Honey & Oils",
      "Cold-Pressed Sesame Oil",
      "KA-SES-006",
      "Traditional wood-pressed gingelly oil",
      "Bottle",
      500,
      "ml",
      "KA-SES-500ML",
      280,
      120,
      15,
      "YES",
      "1515",
    ],
    [
      "Honey & Oils",
      "Cold-Pressed Sesame Oil",
      "KA-SES-006",
      "Traditional wood-pressed gingelly oil",
      "Bottle",
      1,
      "L",
      "KA-SES-1L",
      530,
      80,
      10,
      "NO",
      "1515",
    ],

    // Moringa Powder: 2 sizes
    [
      "Herbal Powders",
      "Moringa Leaf Powder",
      "KA-MOR-007",
      "Sun-dried organic drumstick leaf powder",
      "Standard Pouch",
      100,
      "g",
      "KA-MOR-100G",
      180,
      160,
      20,
      "YES",
      "1212",
    ],
    [
      "Herbal Powders",
      "Moringa Leaf Powder",
      "KA-MOR-007",
      "Sun-dried organic drumstick leaf powder",
      "Standard Pouch",
      200,
      "g",
      "KA-MOR-200G",
      340,
      100,
      15,
      "NO",
      "1212",
    ],
  ];

  const wsCatalog = XLSX.utils.aoa_to_sheet([catalogHeaders, ...sampleRows]);
  wsCatalog["!cols"] = [
    { wch: 18 }, // category
    { wch: 26 }, // product_name
    { wch: 16 }, // product_sku
    { wch: 38 }, // product_description
    { wch: 22 }, // variant_name
    { wch: 12 }, // unit_value
    { wch: 8 },  // unit
    { wch: 18 }, // variant_sku
    { wch: 10 }, // price
    { wch: 12 }, // stock_qty
    { wch: 14 }, // reorder_level
    { wch: 12 }, // is_default
    { wch: 12 }, // hsn_code
  ];
  XLSX.utils.book_append_sheet(wb, wsCatalog, "Catalog Import");

  // ── Sheet 2: Instructions & Reference ──
  const instructionData = [
    ["KOLLIMALAI ARASAN — Unified Bulk Import Template"],
    [""],
    ["1. EVERYTHING IN ONE SHEET"],
    ["• You no longer need to switch between tabs! Enter all product and variant details directly in the 'Catalog Import' sheet."],
    [""],
    ["2. 3-TIER ARCHITECTURE EXPLAINED"],
    ["• Tier 1 (Product): category, product_name, product_sku, product_description"],
    ["• Tier 2 (Variant): variant_name (packaging type or grade, e.g. 'Standard Pouch', 'Glass Jar', 'Grade A Bold')"],
    ["• Tier 3 (Subvariant / Size): unit_value, unit, variant_sku, price, stock_qty"],
    [""],
    ["3. HOW TO ENTER MULTIPLE SIZES FOR A PRODUCT"],
    ["• To attach multiple package sizes (e.g. 100g, 250g, 500g) under the SAME variant:"],
    ["  Repeat the same 'product_sku' and 'variant_name', and specify different 'unit_value', 'variant_sku', and 'price'."],
    ["  The system will automatically group them under one variant with multiple sellable sizes!"],
    [""],
    ["4. VALID UNIT CODES IN DATABASE"],
    ["• g   → Grams (e.g. 100, 250, 500)"],
    ["• kg  → Kilograms (e.g. 1, 2, 5)"],
    ["• ml  → Milliliters (e.g. 250, 500)"],
    ["• L   → Liters (e.g. 1, 2)"],
    ["• pcs → Pieces"],
    [""],
    ["5. RULES & BEST PRACTICES"],
    ["• SKUs: 'product_sku' and 'variant_sku' must each be unique."],
    ["• is_default: Set 'YES' for the primary sellable size shown first on the storefront."],
    ["• Prices: Must be greater than 0."],
    ["• Subcategories: Use '>' in category (e.g. 'Spices > Whole Spices') to create subcategories automatically."],
    ["• Optional fields: If left empty on subsequent rows of the same product, they are automatically inherited."],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionData);
  wsInstructions["!cols"] = [{ wch: 95 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

  const xlBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(xlBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="kollimalai_catalog_import_template.xlsx"',
    },
  });
}
