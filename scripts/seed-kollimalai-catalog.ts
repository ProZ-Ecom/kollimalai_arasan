import "dotenv/config";
import crypto from "crypto";
import mysql from "mysql2/promise";

interface PackSizeDef {
  unitCode: "g" | "kg" | "ml" | "L" | "pcs";
  unitVal: number;
  sku: string;
  price: number;
  isDefault?: boolean;
}

interface ItemDef {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  image: string;
  packSizes: PackSizeDef[];
}

interface CategoryDef {
  name: string;
  slug: string;
  description: string;
  icon: string;
  items: ItemDef[];
}

const CATALOG: CategoryDef[] = [
  // 1. Spices & Whole Spices
  {
    name: "Spices & Whole Spices",
    slug: "spices-whole-spices",
    description: "Authentic, sun-dried, aromatic whole spices cultivated naturally in the mist-covered valleys of Kolli Hills.",
    icon: "/categoryLogos/flavors_logo.svg",
    items: [
      {
        name: "Kolli Hills Black Pepper",
        slug: "kolli-hills-black-pepper",
        shortDescription: "GI-renowned pungent, bold, aromatic black pepper grown at 1,300m altitude in Kolli Hills.",
        description: "Harvested directly from tribal agro-forests in Kolli Hills, our whole black pepper boasts high piperine content, robust pungency, and intense essential oils. Sun-dried naturally without polishing or artificial preservatives.",
        image: "/uploads/products/26c23dea-2cab-41b7-a48f-8d3babee6337.jpg",
        packSizes: [
          { unitCode: "g", unitVal: 100, sku: "SP-KHP-100G", price: 130, isDefault: true },
          { unitCode: "g", unitVal: 250, sku: "SP-KHP-250G", price: 310 },
          { unitCode: "g", unitVal: 500, sku: "SP-KHP-500G", price: 590 },
          { unitCode: "kg", unitVal: 1, sku: "SP-KHP-1KG", price: 1120 },
        ],
      },
      {
        name: "Kolli Hills Green Cardamom",
        slug: "kolli-hills-green-cardamom",
        shortDescription: "Handpicked premium green cardamom pods with intense floral fragrance and sweet essential oils.",
        description: "Naturally shade-grown under the dense canopies of Kolli Hills. Selected for full, plump green pods (8mm+) packed with aromatic oil seeds. Perfect for culinary delicacies and therapeutic herbal teas.",
        image: "/categoryLogos/flavors_logo.svg",
        packSizes: [
          { unitCode: "g", unitVal: 50, sku: "SP-CRD-50G", price: 210, isDefault: true },
          { unitCode: "g", unitVal: 100, sku: "SP-CRD-100G", price: 399 },
          { unitCode: "g", unitVal: 250, sku: "SP-CRD-250G", price: 950 },
        ],
      },
      {
        name: "Kolli Hills Whole Cloves",
        slug: "kolli-hills-whole-cloves",
        shortDescription: "Whole aromatic dried clove buds rich in natural eugenol and distinct warm fragrance.",
        description: "Hand-picked flower buds harvested from high-elevation clove trees in Kolli Hills. Unprocessed, unbroken heads retain maximum eugenol content and soothing aroma for cooking and dental wellness.",
        image: "/categoryLogos/flavors_logo.svg",
        packSizes: [
          { unitCode: "g", unitVal: 50, sku: "SP-CLV-50G", price: 110, isDefault: true },
          { unitCode: "g", unitVal: 100, sku: "SP-CLV-100G", price: 210 },
          { unitCode: "g", unitVal: 250, sku: "SP-CLV-250G", price: 490 },
        ],
      },
      {
        name: "Kolli Hills Cinnamon Bark",
        slug: "kolli-hills-cinnamon-bark",
        shortDescription: "Organic sweet aromatic Ceylon-style cinnamon bark dried naturally under shaded breeze.",
        description: "Thin, fragrant quills peeled from forest cinnamon trees in Kolli Hills. Delivers a subtle sweet warmth with zero cassia adulteration, loaded with potent cinnamaldehyde antioxidants.",
        image: "/categoryLogos/flavors_logo.svg",
        packSizes: [
          { unitCode: "g", unitVal: 50, sku: "SP-CIN-50G", price: 95, isDefault: true },
          { unitCode: "g", unitVal: 100, sku: "SP-CIN-100G", price: 180 },
          { unitCode: "g", unitVal: 250, sku: "SP-CIN-250G", price: 420 },
        ],
      },
      {
        name: "Kolli Hills Star Anise",
        slug: "kolli-hills-star-anise",
        shortDescription: "Whole star anise pods with eight radiating carpels rich in liquorice aroma and shikimic acid.",
        description: "Exotic whole star pods cured under mountain breezes. Enhances curries, biryanis, and herbal broths with its complex sweet-licorice fragrance.",
        image: "/categoryLogos/flavors_logo.svg",
        packSizes: [
          { unitCode: "g", unitVal: 50, sku: "SP-STA-50G", price: 85, isDefault: true },
          { unitCode: "g", unitVal: 100, sku: "SP-STA-100G", price: 160 },
        ],
      },
      {
        name: "Kolli Hills Whole Nutmeg & Mace",
        slug: "kolli-hills-whole-nutmeg-mace",
        shortDescription: "Pure whole nutmeg seeds and delicate lacy scarlet mace (Jathipathri) freshly harvested.",
        description: "Dual aromatic bounty from hill spice groves: whole nutmeg in shell preserves natural oils, paired with golden mace blades for luxurious aroma in both savory and sweet recipes.",
        image: "/categoryLogos/flavors_logo.svg",
        packSizes: [
          { unitCode: "g", unitVal: 50, sku: "SP-NTM-50G", price: 120, isDefault: true },
          { unitCode: "g", unitVal: 100, sku: "SP-NTM-100G", price: 230 },
        ],
      },
    ],
  },

  // 2. Pure Spice Powders
  {
    name: "Spice Powders",
    slug: "spice-powders",
    description: "Stone-ground, pure, unadulterated traditional spice powders with rich natural flavor and aroma.",
    icon: "/categoryLogos/flavors_logo.svg",
    items: [
      {
        name: "Kolli Hills Black Pepper Powder",
        slug: "kolli-hills-black-pepper-powder",
        shortDescription: "Freshly stone-ground black pepper powder with zero fillers, packed for maximum aroma.",
        description: "Coarsely ground from Kolli Hills bold black peppercorns. Unleashes fiery heat and distinct citrus undertones for seasoning, soups, and traditional rasam.",
        image: "/uploads/products/26c23dea-2cab-41b7-a48f-8d3babee6337.jpg",
        packSizes: [
          { unitCode: "g", unitVal: 100, sku: "SP-BPP-100G", price: 140, isDefault: true },
          { unitCode: "g", unitVal: 250, sku: "SP-BPP-250G", price: 330 },
          { unitCode: "g", unitVal: 500, sku: "SP-BPP-500G", price: 620 },
        ],
      },
      {
        name: "Pure Curcumin Turmeric Powder",
        slug: "pure-curcumin-turmeric-powder",
        shortDescription: "High-curcumin organic turmeric rhizomes carefully cleaned, sun-dried, and finely ground.",
        description: "Bright golden yellow powder with over 4.5% natural curcumin. Earthy, warm, and deeply medicinal, ideal for daily golden milk and authentic heritage cooking.",
        image: "/categoryLogos/flavors_logo.svg",
        packSizes: [
          { unitCode: "g", unitVal: 100, sku: "SP-TUR-100G", price: 55, isDefault: true },
          { unitCode: "g", unitVal: 250, sku: "SP-TUR-250G", price: 130 },
          { unitCode: "g", unitVal: 500, sku: "SP-TUR-500G", price: 240 },
        ],
      },
      {
        name: "Roasted Coriander Powder",
        slug: "roasted-coriander-powder",
        shortDescription: "Fragrant roasted coriander seeds slowly ground to retain delicate citrus and herbal aromas.",
        description: "Carefully roasted native coriander seeds ground into a fine aromatic powder that elevates gravies, curries, and vegetable sautés.",
        image: "/categoryLogos/flavors_logo.svg",
        packSizes: [
          { unitCode: "g", unitVal: 100, sku: "SP-COR-100G", price: 50, isDefault: true },
          { unitCode: "g", unitVal: 250, sku: "SP-COR-250G", price: 115 },
          { unitCode: "g", unitVal: 500, sku: "SP-COR-500G", price: 220 },
        ],
      },
      {
        name: "Country Red Chilli Powder",
        slug: "country-red-chilli-powder",
        shortDescription: "Sun-cured native red chillies ground to give vibrant natural red hue and balanced fiery heat.",
        description: "100% natural dried chillies ground without synthetic colors or oils. Delivers genuine countryside warmth and appetite-whetting brightness.",
        image: "/categoryLogos/flavors_logo.svg",
        packSizes: [
          { unitCode: "g", unitVal: 100, sku: "SP-CHL-100G", price: 65, isDefault: true },
          { unitCode: "g", unitVal: 250, sku: "SP-CHL-250G", price: 155 },
          { unitCode: "g", unitVal: 500, sku: "SP-CHL-500G", price: 290 },
        ],
      },
    ],
  },

  // 3. Pure Hill Honey
  {
    name: "Pure Hill Honey",
    slug: "pure-hill-honey",
    description: "Raw, unpasteurized, single-origin wild forest honey gathered from the deep cliffs and flora of Kolli Hills.",
    icon: "/categoryLogos/sweet_logo.svg",
    items: [
      {
        name: "Pure Kolli Hills Forest Honey",
        slug: "pure-kolli-hills-forest-honey",
        shortDescription: "Raw multifloral wild honey collected by indigenous tribes from pristine hill forests.",
        description: "Extracted without boiling or micro-filtration, retaining natural bee pollen, enzymes, and mineral goodness. Rich amber color with complex botanical tasting notes.",
        image: "/uploads/products/5c214a2c-3f3a-4881-92ff-c34a37f360d8.jpg",
        packSizes: [
          { unitCode: "g", unitVal: 250, sku: "HN-WLD-250G", price: 250, isDefault: true },
          { unitCode: "g", unitVal: 500, sku: "HN-WLD-500G", price: 480 },
          { unitCode: "kg", unitVal: 1, sku: "HN-WLD-1KG", price: 920 },
        ],
      },
      {
        name: "Dammer Bee Honey (Kombu Theen)",
        slug: "dammer-bee-honey-kombu-theen",
        shortDescription: "Rare stingless bee medicinal honey treasured in Siddha and Ayurveda for pediatric wellness.",
        description: "Known locally as Kombu Theen / Siru Theen, produced by tiny stingless bees from miniature medicinal blossoms. Distinctive tangy-sweet flavor, high antibiotic properties, and exceptional medicinal value.",
        image: "/uploads/products/5c214a2c-3f3a-4881-92ff-c34a37f360d8.jpg",
        packSizes: [
          { unitCode: "g", unitVal: 100, sku: "HN-DMR-100G", price: 320, isDefault: true },
          { unitCode: "g", unitVal: 250, sku: "HN-DMR-250G", price: 750 },
        ],
      },
    ],
  },

  // 4. Traditional Heritage Rice
  {
    name: "Traditional Rice",
    slug: "traditional-rice",
    description: "Indigenous, unpolished heritage rice grains packed with vitamins, natural iron, and complex nutrients.",
    icon: "/categoryLogos/traditional_logo.svg",
    items: [
      {
        name: "Black Kavuni Rice",
        slug: "black-kavuni-rice",
        shortDescription: "Ancient royal heirloom black rice with high anthocyanin antioxidants, sweet aroma, and nutty bite.",
        description: "Known as the Emperor's rice, Black Kavuni has highest levels of natural anthocyanins among all grains. Ideal for nutritious sweet porridge, puttu, and nourishing breakfast puddings.",
        image: "/uploads/products/43515392-eb49-4c0b-8cee-5fe6b5f0aadf.jpg",
        packSizes: [
          { unitCode: "g", unitVal: 500, sku: "TR-BKR-500G", price: 140, isDefault: true },
          { unitCode: "kg", unitVal: 1, sku: "TR-BKR-1KG", price: 270 },
          { unitCode: "kg", unitVal: 2, sku: "TR-BKR-2KG", price: 520 },
        ],
      },
      {
        name: "Mappillai Samba Rice",
        slug: "mappillai-samba-rice",
        shortDescription: "Robust iron-rich red heritage rice that boosts stamina, hemoglobin, and gut vitality.",
        description: "The legendary Bridegroom rice cultivated in native red soil. High in fiber, low glycemic index, and packed with bio-available zinc and iron.",
        image: "/uploads/products/43515392-eb49-4c0b-8cee-5fe6b5f0aadf.jpg",
        packSizes: [
          { unitCode: "g", unitVal: 500, sku: "TR-MPS-500G", price: 95, isDefault: true },
          { unitCode: "kg", unitVal: 1, sku: "TR-MPS-1KG", price: 180 },
          { unitCode: "kg", unitVal: 2, sku: "TR-MPS-2KG", price: 350 },
        ],
      },
      {
        name: "Poongar Rice",
        slug: "poongar-rice",
        shortDescription: "Traditional reddish-brown healing rice renowned for women's hormonal balance and maternal health.",
        description: "Unpolished, mineral-dense heritage paddy variety that aids maternal wellness, postpartum recovery, and wholesome daily meals.",
        image: "/uploads/products/43515392-eb49-4c0b-8cee-5fe6b5f0aadf.jpg",
        packSizes: [
          { unitCode: "g", unitVal: 500, sku: "TR-PNG-500G", price: 95, isDefault: true },
          { unitCode: "kg", unitVal: 1, sku: "TR-PNG-1KG", price: 180 },
        ],
      },
    ],
  },

  // 5. Natural Hill Millets
  {
    name: "Natural Millets",
    slug: "natural-millets",
    description: "Climate-resilient, mineral-loaded gluten-free grains cultivated in Kolli Hills terraces.",
    icon: "/categoryLogos/traditional_logo.svg",
    items: [
      {
        name: "Kolli Hills Thinai (Foxtail Millet)",
        slug: "kolli-hills-thinai-foxtail-millet",
        shortDescription: "Ancient high-protein golden grain famous for strength, energy, and nervous system health.",
        description: "Thinai has been grown on Kolli Hills slopes since Sangam literature times. Rich in copper, cardiac-friendly fiber, and complex carbohydrates.",
        image: "/categoryLogos/traditional_logo.svg",
        packSizes: [
          { unitCode: "g", unitVal: 500, sku: "ML-THN-500G", price: 80, isDefault: true },
          { unitCode: "kg", unitVal: 1, sku: "ML-THN-1KG", price: 155 },
        ],
      },
      {
        name: "Varagu (Kodo Millet)",
        slug: "varagu-kodo-millet",
        shortDescription: "Diabetic-friendly wholesome millet with abundant polyphenols and dietary fiber.",
        description: "Cleaned and unpolished Kodo millet grains that cook fluffy like table rice while regulating postprandial glucose and gut microbiome.",
        image: "/categoryLogos/traditional_logo.svg",
        packSizes: [
          { unitCode: "g", unitVal: 500, sku: "ML-VRG-500G", price: 80, isDefault: true },
          { unitCode: "kg", unitVal: 1, sku: "ML-VRG-1KG", price: 155 },
        ],
      },
    ],
  },

  // 6. Cold-Pressed Oils (Wood-Pressed / Marachekku)
  {
    name: "Cold-Pressed Oils",
    slug: "cold-pressed-oils",
    description: "Pure, virgin wood-pressed (Marachekku) oils extracted without heat or chemical refining.",
    icon: "/categoryLogos/flavors_logo.svg",
    items: [
      {
        name: "Wood-Pressed Groundnut Oil",
        slug: "wood-pressed-groundnut-oil",
        shortDescription: "Cold-pressed from sun-dried native groundnuts with rich nutty aroma and high smoke point.",
        description: "Traditional wooden churner extraction ensures zero friction heat, retaining natural vitamin E, resveratrol antioxidants, and appetizing golden clarity.",
        image: "/uploads/products/437740ff-858e-4e1b-8591-729b2bdd22fa.jpg",
        packSizes: [
          { unitCode: "ml", unitVal: 500, sku: "OL-GND-500ML", price: 180, isDefault: true },
          { unitCode: "L", unitVal: 1, sku: "OL-GND-1L", price: 340 },
          { unitCode: "L", unitVal: 5, sku: "OL-GND-5L", price: 1650 },
        ],
      },
      {
        name: "Cold-Pressed Sesame / Gingelly Oil",
        slug: "cold-pressed-sesame-gingelly-oil",
        shortDescription: "Artisanal sesame oil crushed with palm jaggery in traditional Vaagai wooden chekku.",
        description: "Natural black sesame seeds slowly crushed with original Karupatti. Unmatched cooling properties, ideal for cooking, idli podi, and Ayurvedic oil baths.",
        image: "/uploads/products/437740ff-858e-4e1b-8591-729b2bdd22fa.jpg",
        packSizes: [
          { unitCode: "ml", unitVal: 500, sku: "OL-SSM-500ML", price: 240, isDefault: true },
          { unitCode: "L", unitVal: 1, sku: "OL-SSM-1L", price: 460 },
        ],
      },
      {
        name: "Pure Wood-Pressed Coconut Oil",
        slug: "pure-wood-pressed-coconut-oil",
        shortDescription: "Sulphur-free copra cold-pressed for pristine aroma, pure lauric acid, and culinary versatility.",
        description: "Sun-dried natural coconut copras crushed in wood expellers. Delightful sweet tropical aroma for everyday cooking, baby massage, and hair care.",
        image: "/uploads/products/437740ff-858e-4e1b-8591-729b2bdd22fa.jpg",
        packSizes: [
          { unitCode: "ml", unitVal: 500, sku: "OL-CCN-500ML", price: 190, isDefault: true },
          { unitCode: "L", unitVal: 1, sku: "OL-CCN-1L", price: 360 },
        ],
      },
    ],
  },

  // 7. Herbal & Wellness Products
  {
    name: "Herbal & Wellness",
    slug: "herbal-wellness",
    description: "Therapeutic herbs, medicinal tubers, and restorative botanicals native to the Kolli mountain range.",
    icon: "/categoryLogos/traditional_logo.svg",
    items: [
      {
        name: "Mudavattukkal Kizhanghu Soup Mix",
        slug: "mudavattukkal-kizhanghu-soup-mix",
        shortDescription: "Rare medicinal fern tuber from Kolli Hills rocks, celebrated for joint flexibility and bone strength.",
        description: "Also called Drynaria quercifolia / Aatukkal Kizhanghu. High-altitude rock tuber processed into an instant restorative soup powder with native pepper and cumin.",
        image: "/uploads/products/77d3b292-f97a-484d-bed3-fd1f12e25c48.jpg",
        packSizes: [
          { unitCode: "g", unitVal: 100, sku: "HB-MVT-100G", price: 190, isDefault: true },
          { unitCode: "g", unitVal: 250, sku: "HB-MVT-250G", price: 450 },
        ],
      },
      {
        name: "Organic Moringa Leaf Powder",
        slug: "organic-moringa-leaf-powder",
        shortDescription: "Shade-dried drumstick leaves rich in bioavailable iron, vitamins A & C, and plant amino acids.",
        description: "Fresh tender moringa leaves washed, dried under shade, and micro-pulverized. A nutrient-dense green superfood powder for smoothies, rotis, and soups.",
        image: "/uploads/products/7b3d0c03-cf37-4aa1-8214-6cd1d284b764.png",
        packSizes: [
          { unitCode: "g", unitVal: 100, sku: "HB-MOR-100G", price: 85, isDefault: true },
          { unitCode: "g", unitVal: 250, sku: "HB-MOR-250G", price: 195 },
        ],
      },
      {
        name: "Mudavattukkal Joint Relief Thailam",
        slug: "mudavattukkal-joint-relief-thailam",
        shortDescription: "Traditional Siddha herbal oil infused with Mudavattukkal tuber, camphor, and sesame oil.",
        description: "Slow-boiled medicated oil formulation that penetrates deep into sore joints, knees, and lumbar muscles to soothe inflammation and stiffness.",
        image: "/uploads/products/7b62afe4-9262-4a52-8ffe-bf633675fcb1.jpg",
        packSizes: [
          { unitCode: "ml", unitVal: 100, sku: "TH-MVT-100ML", price: 230, isDefault: true },
          { unitCode: "ml", unitVal: 200, sku: "TH-MVT-200ML", price: 440 },
        ],
      },
    ],
  },

  // 8. Hill Tea & Coffee
  {
    name: "Hill Tea & Coffee",
    slug: "hill-tea-coffee",
    description: "High-altitude hand-plucked tea leaves and shade-grown coffee berries from mist-laden peaks.",
    icon: "/categoryLogos/flavors_logo.svg",
    items: [
      {
        name: "Kolli Hills Herbal Spiced Tea",
        slug: "kolli-hills-herbal-spiced-tea",
        shortDescription: "Hand-blended loose leaf tea enriched with whole cardamom, dried ginger, and hill cinnamon.",
        description: "Invigorating mountain blend that pairs premium orthodox tea leaves with Kolli Hills whole spices. Comforting, immunity-strengthening, and deeply aromatic.",
        image: "/uploads/products/f553ba69-8f93-4d81-8ad9-a124ed48a2ec.jpg",
        packSizes: [
          { unitCode: "g", unitVal: 100, sku: "TC-HST-100G", price: 130, isDefault: true },
          { unitCode: "g", unitVal: 250, sku: "TC-HST-250G", price: 295 },
        ],
      },
      {
        name: "Kolli Hills Green Tea",
        slug: "kolli-hills-green-tea",
        shortDescription: "Non-fermented tender two leaves and a bud, high in catechins and natural antioxidants.",
        description: "Grown at high altitudes where slow plant growth concentrates delicate catechins and epigallocatechin gallate (EGCG) without bitter aftertaste.",
        image: "/uploads/products/f553ba69-8f93-4d81-8ad9-a124ed48a2ec.jpg",
        packSizes: [
          { unitCode: "g", unitVal: 100, sku: "TC-KGT-100G", price: 140, isDefault: true },
          { unitCode: "g", unitVal: 250, sku: "TC-KGT-250G", price: 320 },
        ],
      },
    ],
  },

  // 9. Natural Mountain Sweeteners
  {
    name: "Natural Sweeteners",
    slug: "natural-sweeteners",
    description: "Traditional unrefined natural sweeteners made from palmyra sap without chemical bleaching.",
    icon: "/categoryLogos/sweet_logo.svg",
    items: [
      {
        name: "Pure Organic Palm Jaggery (Karupatti)",
        slug: "pure-organic-palm-jaggery-karupatti",
        shortDescription: "Authentic dark palmyra jaggery enriched with natural iron, potassium, and minerals.",
        description: "Handcrafted by traditional artisans boiling fresh sweet neera sap. Free from calcium carbonate additives or synthetic colors. The quintessential Tamil sweetener for coffee, medicinal kashayams, and treats.",
        image: "/categoryLogos/sweet_logo.svg",
        packSizes: [
          { unitCode: "g", unitVal: 500, sku: "SW-KRP-500G", price: 175, isDefault: true },
          { unitCode: "kg", unitVal: 1, sku: "SW-KRP-1KG", price: 340 },
        ],
      },
      {
        name: "Pure Palm Candy (Panakarkandu)",
        slug: "pure-palm-candy-panakarkandu",
        shortDescription: "Slow-crystallized natural palm sugar crystals treasured for throat soothing and respiratory calm.",
        description: "Naturally formed sugar crystals made from aged palmyra toddy sap. A beloved traditional remedy dissolved in warm turmeric milk for cough relief.",
        image: "/categoryLogos/sweet_logo.svg",
        packSizes: [
          { unitCode: "g", unitVal: 250, sku: "SW-PNK-250G", price: 160, isDefault: true },
          { unitCode: "g", unitVal: 500, sku: "SW-PNK-500G", price: 310 },
        ],
      },
    ],
  },
];

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  console.log("Connected to MySQL database.");

  // 1. Resolve Brand
  const [brands]: any = await conn.execute("SELECT id FROM product_brands WHERE slug = 'kollimalai-arasan' LIMIT 1");
  let brandId: number;
  if (brands.length === 0) {
    const [res]: any = await conn.execute(
      "INSERT INTO product_brands (name, slug, description, is_active, status, created_at, updated_at) VALUES (?, ?, ?, 1, 1, NOW(), NOW())",
      ["Kollimalai Arasan", "kollimalai-arasan", "Premium spices and natural products from Kolli Hills"]
    );
    brandId = res.insertId;
  } else {
    brandId = brands[0].id;
  }
  console.log("Brand ID:", brandId);

  // 2. Resolve Units
  const [units]: any = await conn.execute("SELECT id, code FROM product_units");
  const unitMap = new Map<string, number>();
  for (const u of units) {
    unitMap.set(u.code, u.id);
  }
  console.log("Loaded units:", Array.from(unitMap.entries()));

  // 3. Clear existing catalog cleanly
  console.log("\nCleaning old catalog data...");
  await conn.execute("DELETE FROM cart_items");
  await conn.execute("DELETE FROM wishlist_items");
  await conn.execute("DELETE FROM order_items");
  await conn.execute("DELETE FROM inventories");
  await conn.execute("DELETE FROM variant_unit_prices");
  await conn.execute("DELETE FROM product_variant_images");
  await conn.execute("DELETE FROM product_variants");
  await conn.execute("DELETE FROM product_images");
  await conn.execute("DELETE FROM products");
  await conn.execute("DELETE FROM product_categories");
  console.log("Old catalog tables cleared.");

  let totalCategories = 0;
  let totalProducts = 0;
  let totalVariants = 0;
  let totalUnitPrices = 0;

  // 4. Insert Categories, Products, Variants, and Multiple UnitPrices per Variant
  for (const cat of CATALOG) {
    const [catRes]: any = await conn.execute(
      `INSERT INTO product_categories 
        (uuid, name, slug, description, icon, is_active, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, 1, NOW(), NOW())`,
      [crypto.randomUUID(), cat.name, cat.slug, cat.description, cat.icon]
    );
    const categoryId = catRes.insertId;
    totalCategories++;
    console.log(`\n📁 Category: ${cat.name} (id: ${categoryId})`);

    for (const item of cat.items) {
      // Tier 1: Product
      const defaultPack = item.packSizes.find((p) => p.isDefault) || item.packSizes[0];
      const [prodRes]: any = await conn.execute(
        `INSERT INTO products 
          (uuid, name, slug, category_id, brand_id, base_price, is_active, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())`,
        [crypto.randomUUID(), item.name, item.slug, categoryId, brandId, defaultPack.price]
      );
      const productId = prodRes.insertId;
      totalProducts++;

      // Product Image
      await conn.execute(
        `INSERT INTO product_images
          (product_id, image_url, alt_text, is_primary, sort_order, is_active, created_at, updated_at)
         VALUES (?, ?, ?, 1, 1, 1, NOW(), NOW())`,
        [productId, item.image, item.name]
      );

      // Tier 2: ProductVariant (The Item itself)
      const variantUuid = crypto.randomUUID();
      const [varRes]: any = await conn.execute(
        `INSERT INTO product_variants
          (uuid, product_id, variant_name, slug, short_description, description, is_default, is_featured, is_active, out_of_stock, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, 1, 1, 0, NOW(), NOW())`,
        [variantUuid, productId, item.name, item.slug, item.shortDescription, item.description]
      );
      const variantId = varRes.insertId;
      totalVariants++;

      // Variant Image
      await conn.execute(
        `INSERT INTO product_variant_images
          (uuid, variant_id, image_url, sort_order, is_primary, status, is_active, created_at, updated_at)
         VALUES (?, ?, ?, 1, 1, 1, 1, NOW(), NOW())`,
        [crypto.randomUUID(), variantId, item.image]
      );

      console.log(`  📦 Item (Variant): ${item.name}`);

      // Tier 3: Multiple Pack Sizes under this single Variant!
      for (const pack of item.packSizes) {
        const unitId = unitMap.get(pack.unitCode) || 1;
        const isDefault = pack.isDefault ? 1 : 0;
        const unitPriceUuid = crypto.randomUUID();

        const [upRes]: any = await conn.execute(
          `INSERT INTO variant_unit_prices
            (uuid, variant_id, unit_id, unit_value, sku, base_price, is_default, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
          [unitPriceUuid, variantId, unitId, pack.unitVal, pack.sku, pack.price, isDefault]
        );
        const unitPriceId = upRes.insertId;
        totalUnitPrices++;

        // Inventory for this pack size
        await conn.execute(
          `INSERT INTO inventories
            (variant_unit_price_id, quantity_available, quantity_reserved, reorder_level, warehouse_location, is_active, created_at, updated_at)
           VALUES (?, 150, 0, 10, 'Kolli Hills Central Depot', 1, NOW(), NOW())`,
          [unitPriceId]
        );

        console.log(`     └─ Pack Size: ${pack.unitVal}${pack.unitCode} @ ₹${pack.price} (SKU: ${pack.sku})${isDefault ? ' [DEFAULT]' : ''}`);
      }
    }
  }

  console.log("\n========================================================");
  console.log("🎉 3-Tier Kolli Hills Catalog Seed Completed Successfully!");
  console.log(`   • Categories Seeded : ${totalCategories}`);
  console.log(`   • Products Seeded   : ${totalProducts}`);
  console.log(`   • Variants (Items)  : ${totalVariants}`);
  console.log(`   • Pack Sizes (Prices): ${totalUnitPrices}`);
  console.log("========================================================\n");

  await conn.end();
}

main().catch((err) => {
  console.error("❌ Seeding Error:", err);
  process.exit(1);
});
