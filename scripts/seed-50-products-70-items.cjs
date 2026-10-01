const mariadb = require("mariadb");
const crypto = require("crypto");
require("dotenv").config();

// 50 Products definition across categories with 70 items (variants)
const SEED_DATA = [
  // --- Category: Spices (id: 18) ---
  {
    categoryName: "Spices",
    categorySlug: "spices",
    name: "Kolli Hills Black Pepper",
    slug: "KOLLI_BLACK_PEPPER",
    variants: [
      { name: "Whole Peppercorns", slug: "KOLLI_BLACK_PEPPER_WHOLE", price: 280, unit: "g", value: 250 },
      { name: "Coarse Ground Powder", slug: "KOLLI_BLACK_PEPPER_POWDER", price: 300, unit: "g", value: 250 },
    ],
  },
  {
    categoryName: "Spices",
    categorySlug: "spices",
    name: "Kolli Hills White Pepper",
    slug: "KOLLI_WHITE_PEPPER",
    variants: [
      { name: "White Peppercorns Whole", slug: "KOLLI_WHITE_PEPPER_WHOLE", price: 380, unit: "g", value: 200 },
      { name: "White Pepper Powder", slug: "KOLLI_WHITE_PEPPER_POWDER", price: 410, unit: "g", value: 200 },
    ],
  },
  {
    categoryName: "Spices",
    categorySlug: "spices",
    name: "Kolli Hills Green Cardamom",
    slug: "KOLLI_GREEN_CARDAMOM",
    variants: [
      { name: "Jumbo 8mm Pods", slug: "KOLLI_GREEN_CARDAMOM_8MM", price: 450, unit: "g", value: 100 },
      { name: "Cardamom Seeds", slug: "KOLLI_GREEN_CARDAMOM_SEEDS", price: 420, unit: "g", value: 100 },
    ],
  },
  {
    categoryName: "Spices",
    categorySlug: "spices",
    name: "Wild Kolli Hills Cloves",
    slug: "KOLLI_CLOVES",
    variants: [
      { name: "Whole Cloves (Kirambu)", slug: "KOLLI_CLOVES_WHOLE", price: 290, unit: "g", value: 100 },
    ],
  },
  {
    categoryName: "Spices",
    categorySlug: "spices",
    name: "Hill Cinnamon Quills",
    slug: "HILL_CINNAMON",
    variants: [
      { name: "Ceylon Cinnamon Sticks", slug: "HILL_CINNAMON_STICKS", price: 240, unit: "g", value: 100 },
      { name: "Fine Cinnamon Powder", slug: "HILL_CINNAMON_POWDER", price: 260, unit: "g", value: 100 },
    ],
  },
  {
    categoryName: "Spices",
    categorySlug: "spices",
    name: "Kolli Star Anise",
    slug: "KOLLI_STAR_ANISE",
    variants: [
      { name: "Whole Star Anise (Thakkolam)", slug: "KOLLI_STAR_ANISE_WHOLE", price: 190, unit: "g", value: 100 },
    ],
  },
  {
    categoryName: "Spices",
    categorySlug: "spices",
    name: "Kolli Hills Nutmeg & Mace",
    slug: "KOLLI_NUTMEG_MACE",
    variants: [
      { name: "Whole Nutmeg with Shell", slug: "KOLLI_NUTMEG_WHOLE", price: 220, unit: "g", value: 100 },
      { name: "Golden Mace Blades (Jadhipathri)", slug: "KOLLI_MACE_BLADES", price: 340, unit: "g", value: 50 },
    ],
  },
  {
    categoryName: "Spices",
    categorySlug: "spices",
    name: "Kolli Native Cumin Seeds",
    slug: "KOLLI_CUMIN_SEEDS",
    variants: [
      { name: "Native Cumin (Jeeragam)", slug: "KOLLI_CUMIN_WHOLE", price: 160, unit: "g", value: 250 },
    ],
  },
  {
    categoryName: "Spices",
    categorySlug: "spices",
    name: "Hill Country Coriander Seeds",
    slug: "HILL_CORIANDER_SEEDS",
    variants: [
      { name: "Native Dhaniya Seeds", slug: "HILL_CORIANDER_WHOLE", price: 110, unit: "g", value: 500 },
      { name: "Fresh Ground Dhaniya Powder", slug: "HILL_CORIANDER_POWDER", price: 130, unit: "g", value: 500 },
    ],
  },
  {
    categoryName: "Spices",
    categorySlug: "spices",
    name: "High Curcumin Turmeric",
    slug: "CURCUMIN_TURMERIC",
    variants: [
      { name: "Whole Turmeric Fingers", slug: "CURCUMIN_TURMERIC_FINGERS", price: 140, unit: "g", value: 250 },
      { name: "High Curcumin Powder (5%+)", slug: "CURCUMIN_TURMERIC_POWDER", price: 160, unit: "g", value: 250 },
    ],
  },
  {
    categoryName: "Spices",
    categorySlug: "spices",
    name: "Kolli Dry Ginger (Sukku)",
    slug: "KOLLI_SUKKU",
    variants: [
      { name: "Whole Dried Sukku", slug: "KOLLI_SUKKU_WHOLE", price: 170, unit: "g", value: 200 },
      { name: "Finely Milled Sukku Powder", slug: "KOLLI_SUKKU_POWDER", price: 190, unit: "g", value: 200 },
    ],
  },
  {
    categoryName: "Spices",
    categorySlug: "spices",
    name: "Wild Fennel Seeds (Sombu)",
    slug: "WILD_FENNEL_SEEDS",
    variants: [
      { name: "Small Sweet Fennel Seeds", slug: "WILD_FENNEL_SMALL", price: 150, unit: "g", value: 250 },
    ],
  },
  {
    categoryName: "Spices",
    categorySlug: "spices",
    name: "Kolli Long Pepper (Thippili)",
    slug: "KOLLI_THIPPILI",
    variants: [
      { name: "Arisi Thippili Whole", slug: "KOLLI_THIPPILI_ARISI", price: 180, unit: "g", value: 100 },
      { name: "Kanda Thippili Roots", slug: "KOLLI_THIPPILI_KANDA", price: 210, unit: "g", value: 100 },
    ],
  },
  {
    categoryName: "Spices",
    categorySlug: "spices",
    name: "Organic Fenugreek (Vendhayam)",
    slug: "ORGANIC_FENUGREEK",
    variants: [
      { name: "Native Vendhayam Seeds", slug: "ORGANIC_FENUGREEK_WHOLE", price: 95, unit: "g", value: 500 },
    ],
  },
  {
    categoryName: "Spices",
    categorySlug: "spices",
    name: "Kolli Black Mustard Seeds",
    slug: "KOLLI_MUSTARD_SEEDS",
    variants: [
      { name: "Small Mustard (Kadugu)", slug: "KOLLI_MUSTARD_SMALL", price: 85, unit: "g", value: 500 },
    ],
  },

  // --- Category: Millets & Traditional Grains (id: 19) ---
  {
    categoryName: "Millets",
    categorySlug: "millets",
    name: "Kolli Foxtail Millet (Thinai)",
    slug: "KOLLI_THINAI",
    variants: [
      { name: "Unhulled Thinai Rice", slug: "KOLLI_THINAI_RICE", price: 120, unit: "kg", value: 1 },
      { name: "Thinai Flour (Flour)", slug: "KOLLI_THINAI_FLOUR", price: 135, unit: "kg", value: 1 },
    ],
  },
  {
    categoryName: "Millets",
    categorySlug: "millets",
    name: "Hill Finger Millet (Ragi)",
    slug: "HILL_RAGI",
    variants: [
      { name: "Native Red Ragi Grain", slug: "HILL_RAGI_GRAIN", price: 85, unit: "kg", value: 1 },
      { name: "Sprouted Ragi Flour", slug: "HILL_RAGI_SPROUTED_FLOUR", price: 140, unit: "kg", value: 1 },
    ],
  },
  {
    categoryName: "Millets",
    categorySlug: "millets",
    name: "Little Millet (Samai)",
    slug: "LITTLE_MILLET_SAMAI",
    variants: [
      { name: "Polished Samai Rice", slug: "LITTLE_MILLET_SAMAI_RICE", price: 125, unit: "kg", value: 1 },
    ],
  },
  {
    categoryName: "Millets",
    categorySlug: "millets",
    name: "Barnyard Millet (Kuthiraivali)",
    slug: "BARNYARD_KUTHIRAIVALI",
    variants: [
      { name: "Native Kuthiraivali Rice", slug: "BARNYARD_KUTHIRAIVALI_RICE", price: 130, unit: "kg", value: 1 },
    ],
  },
  {
    categoryName: "Millets",
    categorySlug: "millets",
    name: "Kodo Millet (Varagu)",
    slug: "KODO_MILLET_VARAGU",
    variants: [
      { name: "Dehusked Varagu Rice", slug: "KODO_MILLET_VARAGU_RICE", price: 120, unit: "kg", value: 1 },
      { name: "Varagu Flour", slug: "KODO_MILLET_VARAGU_FLOUR", price: 135, unit: "kg", value: 1 },
    ],
  },
  {
    categoryName: "Millets",
    categorySlug: "millets",
    name: "Pearl Millet (Kambu)",
    slug: "PEARL_MILLET_KAMBU",
    variants: [
      { name: "Country Kambu Grain", slug: "PEARL_MILLET_KAMBU_GRAIN", price: 90, unit: "kg", value: 1 },
      { name: "Fresh Kambu Flour", slug: "PEARL_MILLET_KAMBU_FLOUR", price: 105, unit: "kg", value: 1 },
    ],
  },
  {
    categoryName: "Millets",
    categorySlug: "millets",
    name: "Black Kavuni Traditional Rice",
    slug: "BLACK_KAVUNI_RICE",
    variants: [
      { name: "Pure Black Kavuni Rice", slug: "BLACK_KAVUNI_RICE_PACK", price: 195, unit: "kg", value: 1 },
    ],
  },
  {
    categoryName: "Millets",
    categorySlug: "millets",
    name: "Mappillai Samba Rice",
    slug: "MAPPILLAI_SAMBA_RICE",
    variants: [
      { name: "Red Mappillai Samba", slug: "MAPPILLAI_SAMBA_RED", price: 145, unit: "kg", value: 1 },
    ],
  },
  {
    categoryName: "Millets",
    categorySlug: "millets",
    name: "Seeraga Samba Heritage Rice",
    slug: "SEERAGA_SAMBA_HERITAGE",
    variants: [
      { name: "Aromatic Seeraga Samba", slug: "SEERAGA_SAMBA_PACK", price: 165, unit: "kg", value: 1 },
    ],
  },
  {
    categoryName: "Millets",
    categorySlug: "millets",
    name: "Kolli Bamboo Rice (Moongil Arisi)",
    slug: "KOLLI_BAMBOO_RICE",
    variants: [
      { name: "Wild Bamboo Rice", slug: "KOLLI_BAMBOO_RICE_WILD", price: 320, unit: "g", value: 500 },
    ],
  },

  // --- Category: Honey & Oils (id: 20) ---
  {
    categoryName: "Honey & Oils",
    categorySlug: "honey-oils",
    name: "Kolli Hills Tribal Rock Honey",
    slug: "KOLLI_TRIBAL_HONEY",
    variants: [
      { name: "Raw Unfiltered Rock Honey", slug: "KOLLI_TRIBAL_HONEY_RAW", price: 420, unit: "g", value: 500 },
      { name: "Clear Settled Honey", slug: "KOLLI_TRIBAL_HONEY_CLEAR", price: 390, unit: "g", value: 500 },
    ],
  },
  {
    categoryName: "Honey & Oils",
    categorySlug: "honey-oils",
    name: "Stingless Dammer Bee Honey (Kombu Thaen)",
    slug: "STINGLESS_KOMBU_THAEN",
    variants: [
      { name: "Medicinal Kombu Thaen", slug: "STINGLESS_KOMBU_THAEN_250G", price: 550, unit: "g", value: 250 },
    ],
  },
  {
    categoryName: "Honey & Oils",
    categorySlug: "honey-oils",
    name: "Wild Jamun Flower Honey",
    slug: "JAMUN_FLOWER_HONEY",
    variants: [
      { name: "Jamun Blossom Honey", slug: "JAMUN_FLOWER_HONEY_500G", price: 460, unit: "g", value: 500 },
    ],
  },
  {
    categoryName: "Honey & Oils",
    categorySlug: "honey-oils",
    name: "Neem Flower Forest Honey",
    slug: "NEEM_FLOWER_HONEY",
    variants: [
      { name: "Neem Blossom Honey", slug: "NEEM_FLOWER_HONEY_500G", price: 440, unit: "g", value: 500 },
    ],
  },
  {
    categoryName: "Honey & Oils",
    categorySlug: "honey-oils",
    name: "Amla Infused Mountain Honey",
    slug: "AMLA_MOUNTAIN_HONEY",
    variants: [
      { name: "Honey Soaked Wild Amla", slug: "AMLA_MOUNTAIN_HONEY_400G", price: 340, unit: "g", value: 400 },
    ],
  },
  {
    categoryName: "Honey & Oils",
    categorySlug: "honey-oils",
    name: "Wood-Pressed Black Sesame Oil",
    slug: "WOOD_PRESSED_SESAME_OIL",
    variants: [
      { name: "Pure Gingelly Oil 500ml", slug: "WOOD_PRESSED_SESAME_500ML", price: 260, unit: "ml", value: 500 },
      { name: "Pure Gingelly Oil 1L", slug: "WOOD_PRESSED_SESAME_1L", price: 490, unit: "L", value: 1 },
    ],
  },
  {
    categoryName: "Honey & Oils",
    categorySlug: "honey-oils",
    name: "Cold-Pressed Groundnut Oil",
    slug: "COLD_PRESSED_GROUNDNUT_OIL",
    variants: [
      { name: "Mara Chekku Groundnut Oil 1L", slug: "COLD_PRESSED_GROUNDNUT_1L", price: 340, unit: "L", value: 1 },
    ],
  },
  {
    categoryName: "Honey & Oils",
    categorySlug: "honey-oils",
    name: "Virgin Coconut Oil (VCO)",
    slug: "VIRGIN_COCONUT_OIL",
    variants: [
      { name: "Cold-Pressed VCO 250ml", slug: "VIRGIN_COCONUT_OIL_250ML", price: 210, unit: "ml", value: 250 },
      { name: "Cold-Pressed VCO 500ml", slug: "VIRGIN_COCONUT_OIL_500ML", price: 390, unit: "ml", value: 500 },
    ],
  },
  {
    categoryName: "Honey & Oils",
    categorySlug: "honey-oils",
    name: "Castor Oil (Vilakkennai)",
    slug: "PURE_CASTOR_OIL",
    variants: [
      { name: "Traditional Castor Oil 200ml", slug: "PURE_CASTOR_OIL_200ML", price: 140, unit: "ml", value: 200 },
    ],
  },
  {
    categoryName: "Honey & Oils",
    categorySlug: "honey-oils",
    name: "Mahua Seed Oil (Iluppai Ennai)",
    slug: "MAHUA_SEED_OIL",
    variants: [
      { name: "Lamp & Wellness Mahua Oil", slug: "MAHUA_SEED_OIL_500ML", price: 220, unit: "ml", value: 500 },
    ],
  },

  // --- Category: Herbal Powders & Wellness (id: 21) ---
  {
    categoryName: "Herbal Powders",
    categorySlug: "herbal-powders",
    name: "Kolli Wild Amla (Nellikai) Powder",
    slug: "KOLLI_AMLA_POWDER",
    variants: [
      { name: "Sun-Dried Amla Powder", slug: "KOLLI_AMLA_POWDER_100G", price: 110, unit: "g", value: 100 },
      { name: "Amla Powder 250g Jar", slug: "KOLLI_AMLA_POWDER_250G", price: 240, unit: "g", value: 250 },
    ],
  },
  {
    categoryName: "Herbal Powders",
    categorySlug: "herbal-powders",
    name: "Kolli Hills Moringa Leaf Powder",
    slug: "KOLLI_MORINGA_POWDER",
    variants: [
      { name: "Organic Moringa Powder", slug: "KOLLI_MORINGA_POWDER_100G", price: 120, unit: "g", value: 100 },
    ],
  },
  {
    categoryName: "Herbal Powders",
    categorySlug: "herbal-powders",
    name: "Pure Ashwagandha (Amukkara) Root Powder",
    slug: "PURE_ASHWAGANDHA",
    variants: [
      { name: "Root Powder 100g", slug: "PURE_ASHWAGANDHA_100G", price: 180, unit: "g", value: 100 },
      { name: "Root Powder 250g", slug: "PURE_ASHWAGANDHA_250G", price: 390, unit: "g", value: 250 },
    ],
  },
  {
    categoryName: "Herbal Powders",
    categorySlug: "herbal-powders",
    name: "Triphala Churna (Three Fruits)",
    slug: "TRIPHALA_CHURNA",
    variants: [
      { name: "Traditional Triphala 100g", slug: "TRIPHALA_CHURNA_100G", price: 130, unit: "g", value: 100 },
    ],
  },
  {
    categoryName: "Herbal Powders",
    categorySlug: "herbal-powders",
    name: "Brahmi (Vallarai) Memory Herbal Powder",
    slug: "BRAHMI_VALLARAI",
    variants: [
      { name: "Vallarai Powder 100g", slug: "BRAHMI_VALLARAI_100G", price: 140, unit: "g", value: 100 },
    ],
  },
  {
    categoryName: "Herbal Powders",
    categorySlug: "herbal-powders",
    name: "Bhringraj (Karisalanganni) Powder",
    slug: "BHRINGRAJ_POWDER",
    variants: [
      { name: "Yellow Karisalankanni Powder", slug: "BHRINGRAJ_YELLOW_100G", price: 130, unit: "g", value: 100 },
    ],
  },
  {
    categoryName: "Herbal Powders",
    categorySlug: "herbal-powders",
    name: "Hibiscus Flower (Semparuthi) Powder",
    slug: "HIBISCUS_FLOWER_POWDER",
    variants: [
      { name: "Petal Powder for Hair & Heart", slug: "HIBISCUS_POWDER_100G", price: 140, unit: "g", value: 100 },
    ],
  },
  {
    categoryName: "Herbal Powders",
    categorySlug: "herbal-powders",
    name: "Holy Basil (Tulsi) Leaf Powder",
    slug: "HOLY_BASIL_TULSI",
    variants: [
      { name: "Krishna Tulsi Powder", slug: "TULSI_POWDER_100G", price: 110, unit: "g", value: 100 },
    ],
  },
  {
    categoryName: "Herbal Powders",
    categorySlug: "herbal-powders",
    name: "Shatavari (Thaneervittan) Powder",
    slug: "SHATAVARI_ROOT_POWDER",
    variants: [
      { name: "Hormone Harmony Powder 100g", slug: "SHATAVARI_POWDER_100G", price: 190, unit: "g", value: 100 },
    ],
  },
  {
    categoryName: "Herbal Powders",
    categorySlug: "herbal-powders",
    name: "Licorice (Athimadhuram) Root Powder",
    slug: "LICORICE_ATHIMADHURAM",
    variants: [
      { name: "Sweet Licorice Powder 100g", slug: "LICORICE_POWDER_100G", price: 120, unit: "g", value: 100 },
    ],
  },

  // --- Category: Traditional Snacks & Sweets (id: 9) ---
  {
    categoryName: "Traditional Snacks & Sweets",
    categorySlug: "traditional-snacks",
    name: "Kolli Hills Palm Jaggery (Karupatti)",
    slug: "KOLLI_PALM_JAGGERY",
    variants: [
      { name: "Original Karupatti Block", slug: "KOLLI_KARUPATTI_500G", price: 210, unit: "g", value: 500 },
      { name: "Karupatti Powder 500g", slug: "KOLLI_KARUPATTI_POWDER_500G", price: 230, unit: "g", value: 500 },
    ],
  },
  {
    categoryName: "Traditional Snacks & Sweets",
    categorySlug: "traditional-snacks",
    name: "Organic Country Sugar (Naatu Sarkarai)",
    slug: "NAATU_SARKARAI",
    variants: [
      { name: "Unbleached Naatu Sarkarai 1kg", slug: "NAATU_SARKARAI_1KG", price: 130, unit: "kg", value: 1 },
    ],
  },
  {
    categoryName: "Traditional Snacks & Sweets",
    categorySlug: "traditional-snacks",
    name: "Heritage Ragi Murukku",
    slug: "HERITAGE_RAGI_MURUKKU",
    variants: [
      { name: "Crispy Ragi Murukku 200g", slug: "RAGI_MURUKKU_200G", price: 95, unit: "g", value: 200 },
    ],
  },
  {
    categoryName: "Traditional Snacks & Sweets",
    categorySlug: "traditional-snacks",
    name: "Thinai Millet Ribbon Pakoda",
    slug: "THINAI_RIBBON_PAKODA",
    variants: [
      { name: "Wood-Pressed Oil Pakoda 200g", slug: "THINAI_PAKODA_200G", price: 105, unit: "g", value: 200 },
    ],
  },
  {
    categoryName: "Traditional Snacks & Sweets",
    categorySlug: "traditional-snacks",
    name: "Herbal Sukku Malli Herbal Coffee Blend",
    slug: "SUKKU_MALLI_COFFEE",
    variants: [
      { name: "Original Sukku Malli Powder 200g", slug: "SUKKU_MALLI_COFFEE_200G", price: 160, unit: "g", value: 200 },
      { name: "Family Pack 500g", slug: "SUKKU_MALLI_COFFEE_500G", price: 340, unit: "g", value: 500 },
    ],
  },
];

async function seed() {
  console.log("=================================================================");
  console.log("🚀 Seeding 50 Authentic Products and 70+ Items (Variants)...");
  console.log("=================================================================\n");

  const url = new URL(process.env.DATABASE_URL);
  const host = url.hostname === "localhost" ? "127.0.0.1" : url.hostname;
  const conn = await mariadb.createConnection({
    host,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    allowPublicKeyRetrieval: true,
  });

  try {
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");

    // Load categories
    const categories = await conn.query("SELECT id, name, slug FROM product_categories WHERE deleted_at IS NULL");
    const catMap = new Map();
    categories.forEach((c) => {
      catMap.set(c.slug.toLowerCase(), c.id);
      catMap.set(c.name.toLowerCase(), c.id);
    });

    // Load units
    const units = await conn.query("SELECT id, name, code FROM product_units");
    const unitMap = new Map();
    units.forEach((u) => {
      if (u.code) unitMap.set(u.code.toLowerCase(), u.id);
    });

    let newProductsCount = 0;
    let newVariantsCount = 0;
    let newUnitPricesCount = 0;

    for (const item of SEED_DATA) {
      // Find category
      let categoryId = catMap.get(item.categorySlug.toLowerCase()) || catMap.get(item.categoryName.toLowerCase());
      if (!categoryId) {
        // Fallback to first category
        categoryId = categories[0]?.id;
      }

      // Check if product already exists by slug or name
      const existingProd = await conn.query(
        "SELECT id FROM products WHERE slug = ? OR name = ?",
        [item.slug, item.name]
      );

      let productId;
      if (existingProd.length > 0) {
        productId = existingProd[0].id;
        // Make sure it's active
        await conn.query("UPDATE products SET is_active = 1, deleted_at = NULL WHERE id = ?", [productId]);
      } else {
        const prodRes = await conn.query(
          "INSERT INTO products (uuid, category_id, name, slug, base_price, is_active, created_at, updated_at) VALUES (UUID(), ?, ?, ?, 0, 1, NOW(), NOW())",
          [categoryId, item.name, item.slug]
        );
        productId = prodRes.insertId;
        newProductsCount++;

        // Add primary image
        await conn.query(
          "INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order, is_active, created_at, updated_at) VALUES (?, '/images/kolli_spices_hero.jpg', ?, 1, 0, 1, NOW(), NOW())",
          [productId, item.name]
        );
      }

      // Seed variants (items)
      for (let vi = 0; vi < item.variants.length; vi++) {
        const v = item.variants[vi];
        const existingVar = await conn.query(
          "SELECT id FROM product_variants WHERE product_id = ? AND (slug = ? OR variant_name = ?)",
          [productId, v.slug, v.name]
        );

        let variantId;
        if (existingVar.length > 0) {
          variantId = existingVar[0].id;
          await conn.query("UPDATE product_variants SET is_active = 1, deleted_at = NULL WHERE id = ?", [variantId]);
        } else {
          const varRes = await conn.query(
            "INSERT INTO product_variants (uuid, product_id, variant_name, slug, short_description, is_default, is_active, out_of_stock, created_at, updated_at) VALUES (UUID(), ?, ?, ?, ?, ?, 1, 0, NOW(), NOW())",
            [
              productId,
              v.name,
              v.slug,
              `Fresh and authentic ${v.name} from Kollimalai Arasan`,
              vi === 0 ? 1 : 0,
            ]
          );
          variantId = varRes.insertId;
          newVariantsCount++;
        }

        // Unit Price & Pack
        const unitId = unitMap.get(v.unit.toLowerCase()) || 1n; // default grams
        const sku = `KA-${String(productId)}-${String(variantId)}-${v.value}${v.unit.toUpperCase()}`;

        const existingUp = await conn.query(
          "SELECT id FROM variant_unit_prices WHERE variant_id = ? AND unit_id = ? AND unit_value = ?",
          [variantId, unitId, v.value]
        );

        let unitPriceId;
        if (existingUp.length > 0) {
          unitPriceId = existingUp[0].id;
          await conn.query(
            "UPDATE variant_unit_prices SET is_active = 1, deleted_at = NULL, base_price = ? WHERE id = ?",
            [v.price, unitPriceId]
          );
        } else {
          const upRes = await conn.query(
            "INSERT INTO variant_unit_prices (uuid, variant_id, unit_id, unit_value, sku, base_price, is_default, is_active, created_at, updated_at) VALUES (UUID(), ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())",
            [variantId, unitId, v.value, sku, v.price]
          );
          unitPriceId = upRes.insertId;
          newUnitPricesCount++;
        }

        // Ensure inventory exists
        const existingInv = await conn.query(
          "SELECT id FROM inventories WHERE variant_unit_price_id = ?",
          [unitPriceId]
        );
        if (existingInv.length === 0) {
          await conn.query(
            "INSERT INTO inventories (variant_unit_price_id, quantity_available, quantity_reserved, reorder_level, warehouse_location, is_active, created_at, updated_at) VALUES (?, 100, 0, 10, 'Kolli Main Store', 1, NOW(), NOW())",
            [unitPriceId]
          );
        }
      }
    }

    await conn.query("SET FOREIGN_KEY_CHECKS = 1");

    // Count totals
    const totalProds = await conn.query("SELECT COUNT(*) as c FROM products WHERE deleted_at IS NULL");
    const totalVars = await conn.query("SELECT COUNT(*) as c FROM product_variants WHERE deleted_at IS NULL");
    const totalUps = await conn.query("SELECT COUNT(*) as c FROM variant_unit_prices WHERE deleted_at IS NULL");

    console.log("=================================================================");
    console.log("🎉 SEEDING COMPLETED!");
    console.log(`New Products Created: ${newProductsCount}`);
    console.log(`New Variants (Items) Created: ${newVariantsCount}`);
    console.log(`New Unit Prices Created: ${newUnitPricesCount}`);
    console.log(`TOTAL ACTIVE PRODUCTS in DB: ${totalProds[0].c}`);
    console.log(`TOTAL ACTIVE ITEMS (VARIANTS) in DB: ${totalVars[0].c}`);
    console.log(`TOTAL ACTIVE UNIT PRICES in DB: ${totalUps[0].c}`);
    console.log("=================================================================\n");
  } finally {
    await conn.end();
  }
}

seed().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
