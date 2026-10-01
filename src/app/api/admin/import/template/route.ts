import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

/**
 * GET /api/admin/import/template
 * Returns a ready-to-fill Excel template with 3 sheets and sample data rows.
 */
export async function GET() {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Categories ──
  const categoryData = [
    // Headers
    ["category_name", "parent_category", "description", "sort_order"],
    // Sample rows
    ["Spices", "", "Fresh ground and whole spices from Kolli Hills", 1],
    ["Millets", "", "Nutritious whole millets and millet flour", 2],
    ["Herbal Powders", "", "Sun-dried herbal leaf and root powders", 3],
    ["Honey & Oils", "", "Raw forest honey and cold-pressed oils", 4],
    ["Masala Blends", "Spices", "Pre-mixed masala powders", 1],
  ];
  const wsCategories = XLSX.utils.aoa_to_sheet(categoryData);
  wsCategories["!cols"] = [{ wch: 20 }, { wch: 20 }, { wch: 45 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsCategories, "Categories");

  // ── Sheet 2: Products ──
  const productData = [
    ["category_name", "product_name", "sku", "base_price", "sale_price", "description", "brand", "hsn_code"],
    ["Spices", "Turmeric Powder", "KA-TUR-001", 85, "", "Pure sun-dried Kolli Hills turmeric", "", "0910"],
    ["Spices", "Red Chilli Powder", "KA-RCP-002", 90, 80, "Stone-ground red chilli", "", "0904"],
    ["Spices", "Coriander Powder", "KA-COR-003", 75, "", "Aromatic coriander seed powder", "", "0909"],
    ["Millets", "Foxtail Millet", "KA-FOX-004", 120, 110, "Whole grain foxtail millet (Thinai)", "", "1008"],
    ["Millets", "Little Millet", "KA-LIT-005", 130, "", "Organic little millet (Saamai)", "", "1008"],
    ["Herbal Powders", "Moringa Leaf Powder", "KA-MOR-006", 180, 160, "100% pure drumstick leaf powder", "", "1212"],
    ["Honey & Oils", "Raw Forest Honey", "KA-HON-007", 350, 320, "Unprocessed Kolli Hills wild honey", "", "0409"],
    ["Honey & Oils", "Cold-Pressed Sesame Oil", "KA-SES-008", 280, "", "Chekku pressed gingelly oil", "", "1515"],
    ["Masala Blends", "Sambar Powder", "KA-SAM-009", 110, "", "Traditional sambar masala blend", "", "2103"],
  ];
  const wsProducts = XLSX.utils.aoa_to_sheet(productData);
  wsProducts["!cols"] = [
    { wch: 18 }, { wch: 25 }, { wch: 16 }, { wch: 12 }, { wch: 12 },
    { wch: 40 }, { wch: 20 }, { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, wsProducts, "Products");

  // ── Sheet 3: Variants ──
  const variantData = [
    ["product_sku", "variant_name", "unit", "unit_value", "variant_sku", "price", "stock_qty", "reorder_level", "is_default"],
    // Turmeric
    ["KA-TUR-001", "100g Pack", "g", 100, "KA-TUR-001-100G", 85, 200, 30, "YES"],
    ["KA-TUR-001", "250g Pack", "g", 250, "KA-TUR-001-250G", 200, 150, 20, "NO"],
    ["KA-TUR-001", "500g Pack", "g", 500, "KA-TUR-001-500G", 380, 100, 15, "NO"],
    // Red Chilli
    ["KA-RCP-002", "100g Pack", "g", 100, "KA-RCP-002-100G", 90, 180, 25, "YES"],
    ["KA-RCP-002", "250g Pack", "g", 250, "KA-RCP-002-250G", 210, 120, 20, "NO"],
    // Coriander
    ["KA-COR-003", "100g Pack", "g", 100, "KA-COR-003-100G", 75, 220, 30, "YES"],
    ["KA-COR-003", "250g Pack", "g", 250, "KA-COR-003-250G", 180, 140, 20, "NO"],
    // Foxtail Millet
    ["KA-FOX-004", "500g Pack", "g", 500, "KA-FOX-004-500G", 120, 300, 40, "YES"],
    ["KA-FOX-004", "1kg Pack", "kg", 1, "KA-FOX-004-1KG", 230, 200, 30, "NO"],
    // Little Millet
    ["KA-LIT-005", "500g Pack", "g", 500, "KA-LIT-005-500G", 130, 250, 35, "YES"],
    ["KA-LIT-005", "1kg Pack", "kg", 1, "KA-LIT-005-1KG", 250, 180, 25, "NO"],
    // Moringa
    ["KA-MOR-006", "100g Pack", "g", 100, "KA-MOR-006-100G", 180, 160, 20, "YES"],
    ["KA-MOR-006", "200g Pack", "g", 200, "KA-MOR-006-200G", 340, 100, 15, "NO"],
    // Honey
    ["KA-HON-007", "250ml Jar", "ml", 250, "KA-HON-007-250ML", 350, 80, 10, "YES"],
    ["KA-HON-007", "500ml Jar", "ml", 500, "KA-HON-007-500ML", 680, 60, 8, "NO"],
    // Sesame Oil
    ["KA-SES-008", "500ml Bottle", "ml", 500, "KA-SES-008-500ML", 280, 120, 15, "YES"],
    ["KA-SES-008", "1L Bottle", "L", 1, "KA-SES-008-1L", 530, 80, 10, "NO"],
    // Sambar Powder
    ["KA-SAM-009", "100g Pack", "g", 100, "KA-SAM-009-100G", 110, 200, 30, "YES"],
    ["KA-SAM-009", "250g Pack", "g", 250, "KA-SAM-009-250G", 260, 150, 20, "NO"],
  ];
  const wsVariants = XLSX.utils.aoa_to_sheet(variantData);
  wsVariants["!cols"] = [
    { wch: 16 }, { wch: 16 }, { wch: 8 }, { wch: 12 },
    { wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsVariants, "Variants");

  // ── Instructions Sheet ──
  const instructionData = [
    ["KOLLIMALAI ARASAN — Bulk Import Template"],
    [""],
    ["HOW TO USE THIS FILE"],
    ["1. Fill in the 'Categories' sheet first"],
    ["2. Fill 'Products' sheet — category_name must match exactly from Categories sheet"],
    ["3. Fill 'Variants' sheet — product_sku must match SKU from Products sheet"],
    ["4. Upload this file in Admin → Bulk Import"],
    ["5. Click 'Preview Import' to validate before saving"],
    ["6. Click 'Confirm Import' to save to database"],
    [""],
    ["RULES"],
    ["• SKUs must be unique — duplicates will be rejected"],
    ["• unit must be: g, kg, ml, L, or pcs"],
    ["• is_default must be YES for exactly 1 variant per product"],
    ["• price and base_price must be greater than 0"],
    ["• Leave optional columns blank — do NOT delete them"],
    ["• category_name in Products must exactly match a row in Categories"],
  ];
  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionData);
  wsInstructions["!cols"] = [{ wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

  const xlBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(xlBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="kollimalai_import_template.xlsx"',
    },
  });
}
