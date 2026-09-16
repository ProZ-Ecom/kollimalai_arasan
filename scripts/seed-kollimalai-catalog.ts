import "dotenv/config";
import crypto from "crypto";
import { PrismaClient, product_units_type } from "../src/generated/prisma/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

function createClient() {
  const databaseUrl = process.env.DATABASE_URL || "mysql://root:root@localhost:3306/kollimalai";
  const url = new URL(databaseUrl);
  const adapter = new PrismaMariaDb({
    host: url.hostname === "localhost" ? "127.0.0.1" : url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit: 10,
    allowPublicKeyRetrieval: true,
  });
  return new PrismaClient({ adapter });
}

const db = createClient();

// Product images fallback mapping for realistic visuals
const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  "spices-whole-spices": "/categoryLogos/flavors_logo.svg",
  "spice-powders": "/categoryLogos/flavors_logo.svg",
  "traditional-rice": "/categoryLogos/traditional_logo.svg",
  "millets": "/categoryLogos/traditional_logo.svg",
  "cold-pressed-oils": "/categoryLogos/flavors_logo.svg",
  "honey": "/categoryLogos/sweet_logo.svg",
  "herbal-products": "/categoryLogos/traditional_logo.svg",
  "herbal-powders": "/categoryLogos/traditional_logo.svg",
  "herbal-oils-thailam": "/categoryLogos/traditional_logo.svg",
  "traditional-snacks": "/snacksLogos/kai_murukku.svg",
  "traditional-sweets": "/snacksLogos/laddu.svg",
  "pickles": "/categoryLogos/flavors_logo.svg",
  "tea-coffee": "/categoryLogos/flavors_logo.svg",
  "organic-soaps": "/categoryLogos/traditional_logo.svg",
  "nuts-seeds-dry-fruits": "/categoryLogos/bites_logo.svg",
};

const SPECIFIC_PRODUCT_IMAGES: Record<string, string> = {
  "thinai-millet-murukku": "/snacksLogos/thenkuzhal_murukku.svg",
  "ragi-murukku": "/snacksLogos/kai_murukku.svg",
  "kolli-hills-millet-mixture": "/snacksLogos/mixture.svg",
  "thinai-laddu": "/snacksLogos/laddu.svg",
  "ragi-laddu": "/snacksLogos/laddu.svg",
  "palm-jaggery-sesame-laddu": "/snacksLogos/laddu.svg",
  "kolli-hills-black-pepper": "/uploads/products/26c23dea-2cab-41b7-a48f-8d3babee6337.jpg",
  "black-kavuni-rice": "/uploads/products/43515392-eb49-4c0b-8cee-5fe6b5f0aadf.jpg",
  "groundnut-oil": "/uploads/products/437740ff-858e-4e1b-8591-729b2bdd22fa.jpg",
  "pure-kolli-hills-forest-honey": "/uploads/products/5c214a2c-3f3a-4881-92ff-c34a37f360d8.jpg",
  "mudakathan-herbal-mix": "/uploads/products/77d3b292-f97a-484d-bed3-fd1f12e25c48.jpg",
  "moringa-powder": "/uploads/products/7b3d0c03-cf37-4aa1-8214-6cd1d284b764.png",
  "mudavattukkal-thailam": "/uploads/products/7b62afe4-9262-4a52-8ffe-bf633675fcb1.jpg",
  "amla-pickle": "/uploads/products/cdf70fad-6ecd-42f4-a482-dce7fe12c94c.jpg",
  "kolli-hills-herbal-tea": "/uploads/products/f553ba69-8f93-4d81-8ad9-a124ed48a2ec.jpg",
  "neem-soap": "/uploads/products/7e076a3a-b817-4231-8ca6-431f10c21d2c.webp",
  "groundnut": "/uploads/products/8d560599-5351-45e9-878a-24270dcd6067.png",
};

interface VariantDef {
  name: string;
  sku: string;
  unitCode: string;
  unitVal: number;
  price: number;
  isDefault: boolean;
}

interface ProductDef {
  name: string;
  slug: string;
  description: string;
  variants: VariantDef[];
}

interface CategoryDef {
  category: {
    name: string;
    slug: string;
    description: string;
    icon: string;
  };
  products: ProductDef[];
}

const CATALOG_DATA: CategoryDef[] = [
  // 1. Spices & Whole Spices (4 products)
  {
    category: {
      name: "Spices & Whole Spices",
      slug: "spices-whole-spices",
      description: "Authentic, freshly harvested aromatic whole spices from the pristine slopes of Kolli Hills.",
      icon: "/categoryLogos/flavors_logo.svg",
    },
    products: [
      {
        name: "Kolli Hills Black Pepper",
        slug: "kolli-hills-black-pepper",
        description: "Geographically renowned pungent, bold, aromatic black pepper grown naturally at Kolli Hills high altitude.",
        variants: [
          { name: "100g Pack", sku: "SP-KHP-100G", unitCode: "g", unitVal: 100, price: 130, isDefault: true },
          { name: "250g Pack", sku: "SP-KHP-250G", unitCode: "g", unitVal: 250, price: 310, isDefault: false },
        ],
      },
      {
        name: "Cardamom",
        slug: "cardamom",
        description: "Handpicked premium green cardamom pods with intense floral aroma and sweet essential oils.",
        variants: [
          { name: "50g Pack", sku: "SP-CRD-50G", unitCode: "g", unitVal: 50, price: 210, isDefault: true },
          { name: "100g Pack", sku: "SP-CRD-100G", unitCode: "g", unitVal: 100, price: 399, isDefault: false },
        ],
      },
      {
        name: "Cloves",
        slug: "cloves",
        description: "Whole aromatic dried clove buds rich in natural eugenol and distinct warm fragrance.",
        variants: [
          { name: "50g Pack", sku: "SP-CLV-50G", unitCode: "g", unitVal: 50, price: 110, isDefault: true },
          { name: "100g Pack", sku: "SP-CLV-100G", unitCode: "g", unitVal: 100, price: 210, isDefault: false },
        ],
      },
      {
        name: "Cinnamon",
        slug: "cinnamon",
        description: "Organic sweet aromatic Ceylon-style cinnamon bark harvested naturally and dried under shade.",
        variants: [
          { name: "50g Pack", sku: "SP-CIN-50G", unitCode: "g", unitVal: 50, price: 95, isDefault: true },
          { name: "100g Pack", sku: "SP-CIN-100G", unitCode: "g", unitVal: 100, price: 180, isDefault: false },
        ],
      },
    ],
  },

  // 2. Spice Powders (4 products)
  {
    category: {
      name: "Spice Powders",
      slug: "spice-powders",
      description: "Stone-ground, pure, unadulterated traditional spice powders with rich natural flavor and aroma.",
      icon: "/categoryLogos/flavors_logo.svg",
    },
    products: [
      {
        name: "Black Pepper Powder",
        slug: "black-pepper-powder",
        description: "Freshly ground Kolli Hills black pepper powder with zero fillers, packed for maximum flavor freshness.",
        variants: [
          { name: "100g Pouch", sku: "SP-BPP-100G", unitCode: "g", unitVal: 100, price: 140, isDefault: true },
          { name: "250g Pouch", sku: "SP-BPP-250G", unitCode: "g", unitVal: 250, price: 330, isDefault: false },
        ],
      },
      {
        name: "Turmeric Powder",
        slug: "turmeric-powder",
        description: "High-curcumin organic turmeric rhizomes carefully cleaned, sun-dried, and finely ground.",
        variants: [
          { name: "100g Pouch", sku: "SP-TUR-100G", unitCode: "g", unitVal: 100, price: 55, isDefault: true },
          { name: "250g Pouch", sku: "SP-TUR-250G", unitCode: "g", unitVal: 250, price: 130, isDefault: false },
        ],
      },
      {
        name: "Coriander Powder",
        slug: "coriander-powder",
        description: "Fragrant roasted coriander seeds slowly ground to retain delicate citrus and herbal aromas.",
        variants: [
          { name: "100g Pouch", sku: "SP-COR-100G", unitCode: "g", unitVal: 100, price: 50, isDefault: true },
          { name: "250g Pouch", sku: "SP-COR-250G", unitCode: "g", unitVal: 250, price: 115, isDefault: false },
        ],
      },
      {
        name: "Chilli Powder",
        slug: "chilli-powder",
        description: "Sun-cured country red chillies ground to give vibrant natural red hue and balanced fiery heat.",
        variants: [
          { name: "100g Pouch", sku: "SP-CHL-100G", unitCode: "g", unitVal: 100, price: 65, isDefault: true },
          { name: "250g Pouch", sku: "SP-CHL-250G", unitCode: "g", unitVal: 250, price: 155, isDefault: false },
        ],
      },
    ],
  },

  // 3. Traditional Rice (4 products)
  {
    category: {
      name: "Traditional Rice",
      slug: "traditional-rice",
      description: "Indigenous, unpolished heritage rice grains packed with vitamins, natural iron, and complex nutrients.",
      icon: "/categoryLogos/traditional_logo.svg",
    },
    products: [
      {
        name: "Black Kavuni Rice",
        slug: "black-kavuni-rice",
        description: "Ancient royal heirloom black rice with high anthocyanin antioxidants, sweet aroma, and nutty bite.",
        variants: [
          { name: "500g Pack", sku: "TR-BKR-500G", unitCode: "g", unitVal: 500, price: 140, isDefault: true },
          { name: "1kg Pack", sku: "TR-BKR-1KG", unitCode: "kg", unitVal: 1, price: 270, isDefault: false },
        ],
      },
      {
        name: "Thooyamalli Rice",
        slug: "thooyamalli-rice",
        description: "Pure white jasmine rice traditionally praised for strengthening nerves, immunity, and youthful vitality.",
        variants: [
          { name: "500g Pack", sku: "TR-TYM-500G", unitCode: "g", unitVal: 500, price: 90, isDefault: true },
          { name: "1kg Pack", sku: "TR-TYM-1KG", unitCode: "kg", unitVal: 1, price: 175, isDefault: false },
        ],
      },
      {
        name: "Mapillai Samba Rice",
        slug: "mapillai-samba-rice",
        description: "Legendary bridegroom traditional red rice recognized for physical endurance, stamina, and zinc minerals.",
        variants: [
          { name: "500g Pack", sku: "TR-MPS-500G", unitCode: "g", unitVal: 500, price: 95, isDefault: true },
          { name: "1kg Pack", sku: "TR-MPS-1KG", unitCode: "kg", unitVal: 1, price: 185, isDefault: false },
        ],
      },
      {
        name: "Seeraga Samba Rice",
        slug: "seeraga-samba-rice",
        description: "Aromatic small-grain cumin-sized samba rice that forms the gold standard of authentic Dindigul biryani.",
        variants: [
          { name: "500g Pack", sku: "TR-SGS-500G", unitCode: "g", unitVal: 500, price: 110, isDefault: true },
          { name: "1kg Pack", sku: "TR-SGS-1KG", unitCode: "kg", unitVal: 1, price: 215, isDefault: false },
        ],
      },
    ],
  },

  // 4. Millets (4 products)
  {
    category: {
      name: "Millets",
      slug: "millets",
      description: "Gluten-free, diabetic-friendly ancient supergrains naturally cultivated without chemical pesticides.",
      icon: "/categoryLogos/traditional_logo.svg",
    },
    products: [
      {
        name: "Foxtail Millet",
        slug: "foxtail-millet",
        description: "Thinai millet loaded with protein, B-vitamins, and dietary fiber that promotes steady energy.",
        variants: [
          { name: "500g Pack", sku: "ML-FXT-500G", unitCode: "g", unitVal: 500, price: 75, isDefault: true },
          { name: "1kg Pack", sku: "ML-FXT-1KG", unitCode: "kg", unitVal: 1, price: 145, isDefault: false },
        ],
      },
      {
        name: "Kodo Millet",
        slug: "kodo-millet",
        description: "Varagu millet rich in polyphenols and antioxidants, ideal for diabetic-safe upma and daily meals.",
        variants: [
          { name: "500g Pack", sku: "ML-KOD-500G", unitCode: "g", unitVal: 500, price: 75, isDefault: true },
          { name: "1kg Pack", sku: "ML-KOD-1KG", unitCode: "kg", unitVal: 1, price: 145, isDefault: false },
        ],
      },
      {
        name: "Little Millet",
        slug: "little-millet",
        description: "Samai millet with light, fast-cooking grains that support metabolism, digestion, and weight goals.",
        variants: [
          { name: "500g Pack", sku: "ML-LTL-500G", unitCode: "g", unitVal: 500, price: 70, isDefault: true },
          { name: "1kg Pack", sku: "ML-LTL-1KG", unitCode: "kg", unitVal: 1, price: 135, isDefault: false },
        ],
      },
      {
        name: "Finger Millet",
        slug: "finger-millet",
        description: "Whole Ragi grains loaded with bio-available calcium, essential for healthy bones from toddlers to elders.",
        variants: [
          { name: "500g Pack", sku: "ML-FNG-500G", unitCode: "g", unitVal: 500, price: 60, isDefault: true },
          { name: "1kg Pack", sku: "ML-FNG-1KG", unitCode: "kg", unitVal: 1, price: 115, isDefault: false },
        ],
      },
    ],
  },

  // 5. Cold Pressed Oils (4 products)
  {
    category: {
      name: "Cold Pressed Oils",
      slug: "cold-pressed-oils",
      description: "Mara Chekku wood-pressed virgin oils extracted at low temperatures to lock in original nutrients.",
      icon: "/categoryLogos/flavors_logo.svg",
    },
    products: [
      {
        name: "Groundnut Oil",
        slug: "groundnut-oil",
        description: "Traditional wood-pressed peanut oil with rich nutty fragrance and high smoking point for deep frying.",
        variants: [
          { name: "500ml Bottle", sku: "OL-GND-500ML", unitCode: "ml", unitVal: 500, price: 195, isDefault: true },
          { name: "1 Litre Bottle", sku: "OL-GND-1L", unitCode: "L", unitVal: 1, price: 380, isDefault: false },
        ],
      },
      {
        name: "Gingelly Oil",
        slug: "gingelly-oil",
        description: "Pure sesame oil extracted with natural palm jaggery, traditionally prized for cooling and delicious flavor.",
        variants: [
          { name: "500ml Bottle", sku: "OL-GNG-500ML", unitCode: "ml", unitVal: 500, price: 240, isDefault: true },
          { name: "1 Litre Bottle", sku: "OL-GNG-1L", unitCode: "L", unitVal: 1, price: 470, isDefault: false },
        ],
      },
      {
        name: "Coconut Oil",
        slug: "coconut-oil",
        description: "Unrefined virgin wood-pressed coconut oil extracted from sun-dried copra, great for cooking and hair care.",
        variants: [
          { name: "500ml Bottle", sku: "OL-CCN-500ML", unitCode: "ml", unitVal: 500, price: 210, isDefault: true },
          { name: "1 Litre Bottle", sku: "OL-CCN-1L", unitCode: "L", unitVal: 1, price: 410, isDefault: false },
        ],
      },
      {
        name: "Castor Oil",
        slug: "castor-oil",
        description: "Pure cold-pressed unrefined castor oil revered for digestive detox, thick hair growth, and eye soothing.",
        variants: [
          { name: "200ml Bottle", sku: "OL-CST-200ML", unitCode: "ml", unitVal: 200, price: 130, isDefault: true },
          { name: "500ml Bottle", sku: "OL-CST-500ML", unitCode: "ml", unitVal: 500, price: 290, isDefault: false },
        ],
      },
    ],
  },

  // 6. Honey (3 products)
  {
    category: {
      name: "Honey",
      slug: "honey",
      description: "100% pure raw unprocessed forest honey sourced ethically from natural cliff and tree hives.",
      icon: "/categoryLogos/sweet_logo.svg",
    },
    products: [
      {
        name: "Pure Kolli Hills Forest Honey",
        slug: "pure-kolli-hills-forest-honey",
        description: "Raw wild mountain honey collected by tribal communities from medicinal forest flowers of Kolli Hills.",
        variants: [
          { name: "250g Glass Jar", sku: "HN-PKH-250G", unitCode: "g", unitVal: 250, price: 220, isDefault: true },
          { name: "500g Glass Jar", sku: "HN-PKH-500G", unitCode: "g", unitVal: 500, price: 420, isDefault: false },
        ],
      },
      {
        name: "Wild Honey",
        slug: "wild-honey",
        description: "Multi-floral amber nectar packed with live enzymes, propolis, and unadulterated forest goodness.",
        variants: [
          { name: "250g Glass Jar", sku: "HN-WLD-250G", unitCode: "g", unitVal: 250, price: 195, isDefault: true },
          { name: "500g Glass Jar", sku: "HN-WLD-500G", unitCode: "g", unitVal: 500, price: 380, isDefault: false },
        ],
      },
      {
        name: "Herbal Honey",
        slug: "herbal-honey",
        description: "Pure raw honey infused with potent medicinal herbs including Tulsi, Ginger, Pippali, and Licorice.",
        variants: [
          { name: "250g Glass Jar", sku: "HN-HRB-250G", unitCode: "g", unitVal: 250, price: 240, isDefault: true },
          { name: "500g Glass Jar", sku: "HN-HRB-500G", unitCode: "g", unitVal: 500, price: 460, isDefault: false },
        ],
      },
    ],
  },

  // 7. Herbal Products (3 products)
  {
    category: {
      name: "Herbal Products",
      slug: "herbal-products",
      description: "Time-tested Siddha and Ayurvedic botanical formulations crafted for natural daily health.",
      icon: "/categoryLogos/traditional_logo.svg",
    },
    products: [
      {
        name: "Mudakathan Herbal Mix",
        slug: "mudakathan-herbal-mix",
        description: "Balloon vine herbal mix traditionally used for joint flexibility, knee comfort, and reducing stiffness.",
        variants: [
          { name: "100g Pack", sku: "HP-MDK-100G", unitCode: "g", unitVal: 100, price: 110, isDefault: true },
          { name: "200g Pack", sku: "HP-MDK-200G", unitCode: "g", unitVal: 200, price: 210, isDefault: false },
        ],
      },
      {
        name: "Kolli Hills Herbal Soup Mix",
        slug: "kolli-hills-herbal-soup-mix",
        description: "Invigorating medicinal soup mix prepared with Kolli Hills roots, black pepper, and immunity herbs.",
        variants: [
          { name: "100g Pack", sku: "HP-SPM-100G", unitCode: "g", unitVal: 100, price: 125, isDefault: true },
          { name: "200g Pack", sku: "HP-SPM-200G", unitCode: "g", unitVal: 200, price: 240, isDefault: false },
        ],
      },
      {
        name: "Avaram Herbal Mix",
        slug: "avaram-herbal-mix",
        description: "Dried Senna auriculata (Avarampoo) blossoms blended to balance blood sugar and clear the complexion.",
        variants: [
          { name: "100g Pack", sku: "HP-AVR-100G", unitCode: "g", unitVal: 100, price: 95, isDefault: true },
          { name: "200g Pack", sku: "HP-AVR-200G", unitCode: "g", unitVal: 200, price: 180, isDefault: false },
        ],
      },
    ],
  },

  // 8. Herbal Powders (3 products)
  {
    category: {
      name: "Herbal Powders",
      slug: "herbal-powders",
      description: "100% natural shade-dried medicinal leaf and fruit powders for holistic daily wellness.",
      icon: "/categoryLogos/traditional_logo.svg",
    },
    products: [
      {
        name: "Moringa Powder",
        slug: "moringa-powder",
        description: "Nutrient-dense drumstick leaf superfood powder loaded with natural iron, calcium, and plant protein.",
        variants: [
          { name: "100g Pouch", sku: "HB-MOR-100G", unitCode: "g", unitVal: 100, price: 85, isDefault: true },
          { name: "250g Pouch", sku: "HB-MOR-250G", unitCode: "g", unitVal: 250, price: 195, isDefault: false },
        ],
      },
      {
        name: "Neem Leaf Powder",
        slug: "neem-leaf-powder",
        description: "Pure shade-dried organic neem leaf powder for natural blood purification, oral care, and skin detox.",
        variants: [
          { name: "100g Pouch", sku: "HB-NEM-100G", unitCode: "g", unitVal: 100, price: 75, isDefault: true },
          { name: "250g Pouch", sku: "HB-NEM-250G", unitCode: "g", unitVal: 250, price: 170, isDefault: false },
        ],
      },
      {
        name: "Amla Powder",
        slug: "amla-powder",
        description: "Dried Indian gooseberry powder bursting with natural vitamin C for immunity, glowing skin, and strong hair.",
        variants: [
          { name: "100g Pouch", sku: "HB-AML-100G", unitCode: "g", unitVal: 100, price: 90, isDefault: true },
          { name: "250g Pouch", sku: "HB-AML-250G", unitCode: "g", unitVal: 250, price: 210, isDefault: false },
        ],
      },
    ],
  },

  // 9. Herbal Oils & Thailam (3 products)
  {
    category: {
      name: "Herbal Oils & Thailam",
      slug: "herbal-oils-thailam",
      description: "Traditional herbal oil preparations formulated with authentic hill herbs and sesame base.",
      icon: "/categoryLogos/traditional_logo.svg",
    },
    products: [
      {
        name: "Mudavattukkal Thailam",
        slug: "mudavattukkal-thailam",
        description: "Specialized Kolli Hills medicinal fern root thailam prepared for joint, cartilage, and knee stiffness comfort.",
        variants: [
          { name: "100ml Bottle", sku: "TH-MVT-100ML", unitCode: "ml", unitVal: 100, price: 230, isDefault: true },
          { name: "200ml Bottle", sku: "TH-MVT-200ML", unitCode: "ml", unitVal: 200, price: 440, isDefault: false },
        ],
      },
      {
        name: "Herbal Hair Oil",
        slug: "herbal-hair-oil",
        description: "Bhringraj, Amla, Curry Leaves, and Hibiscus infused cold-pressed coconut oil for dense hair growth.",
        variants: [
          { name: "100ml Bottle", sku: "TH-HHO-100ML", unitCode: "ml", unitVal: 100, price: 160, isDefault: true },
          { name: "200ml Bottle", sku: "TH-HHO-200ML", unitCode: "ml", unitVal: 200, price: 300, isDefault: false },
        ],
      },
      {
        name: "Herbal Pain Relief Oil",
        slug: "herbal-pain-relief-oil",
        description: "Fast-absorbing herbal liniment for soothing muscular strain, backache, neck stiffness, and physical fatigue.",
        variants: [
          { name: "100ml Bottle", sku: "TH-PRO-100ML", unitCode: "ml", unitVal: 100, price: 180, isDefault: true },
          { name: "200ml Bottle", sku: "TH-PRO-200ML", unitCode: "ml", unitVal: 200, price: 340, isDefault: false },
        ],
      },
    ],
  },

  // 10. Traditional Snacks (3 products)
  {
    category: {
      name: "Traditional Snacks",
      slug: "traditional-snacks",
      description: "Crispy, homemade, preservative-free South Indian delicacies cooked with cold-pressed oils.",
      icon: "/categoryLogos/traditional_logo.svg",
    },
    products: [
      {
        name: "Thinai Millet Murukku",
        slug: "thinai-millet-murukku",
        description: "Golden crunchy spiral murukku crafted from foxtail millet flour, fragrant sesame, and gentle spices.",
        variants: [
          { name: "200g Pack", sku: "SN-TMM-200G", unitCode: "g", unitVal: 200, price: 85, isDefault: true },
          { name: "400g Pack", sku: "SN-TMM-400G", unitCode: "g", unitVal: 400, price: 160, isDefault: false },
        ],
      },
      {
        name: "Ragi Murukku",
        slug: "ragi-murukku",
        description: "Wholesome finger millet savoury snack spiced with cumin and ajwain for guilt-free evening tea-time.",
        variants: [
          { name: "200g Pack", sku: "SN-RGM-200G", unitCode: "g", unitVal: 200, price: 85, isDefault: true },
          { name: "400g Pack", sku: "SN-RGM-400G", unitCode: "g", unitVal: 400, price: 160, isDefault: false },
        ],
      },
      {
        name: "Kolli Hills Millet Mixture",
        slug: "kolli-hills-millet-mixture",
        description: "Spicy savoury mixture with roasted peanuts, curry leaves, cashews, and crispy millet sev ribbons.",
        variants: [
          { name: "200g Pack", sku: "SN-KMM-200G", unitCode: "g", unitVal: 200, price: 95, isDefault: true },
          { name: "400g Pack", sku: "SN-KMM-400G", unitCode: "g", unitVal: 400, price: 180, isDefault: false },
        ],
      },
    ],
  },

  // 11. Traditional Sweets (3 products)
  {
    category: {
      name: "Traditional Sweets",
      slug: "traditional-sweets",
      description: "Mouth-watering South Indian sweets sweetened naturally with pure palm jaggery and desi cow ghee.",
      icon: "/categoryLogos/sweet_logo.svg",
    },
    products: [
      {
        name: "Thinai Laddu",
        slug: "thinai-laddu",
        description: "Nutritious foxtail millet laddus blended with pure palm jaggery, cardamom, and roasted cashews.",
        variants: [
          { name: "250g Box", sku: "SW-TNL-250G", unitCode: "g", unitVal: 250, price: 140, isDefault: true },
          { name: "500g Box", sku: "SW-TNL-500G", unitCode: "g", unitVal: 500, price: 270, isDefault: false },
        ],
      },
      {
        name: "Ragi Laddu",
        slug: "ragi-laddu",
        description: "Wholesome finger millet laddus rolled with country jaggery, crushed peanuts, and fragrant cow ghee.",
        variants: [
          { name: "250g Box", sku: "SW-RGL-250G", unitCode: "g", unitVal: 250, price: 135, isDefault: true },
          { name: "500g Box", sku: "SW-RGL-500G", unitCode: "g", unitVal: 500, price: 260, isDefault: false },
        ],
      },
      {
        name: "Palm Jaggery Sesame Laddu",
        slug: "palm-jaggery-sesame-laddu",
        description: "Traditional Ellu Urundai made with toasted black sesame seeds and dark nutrient-rich palm jaggery.",
        variants: [
          { name: "250g Box", sku: "SW-ESL-250G", unitCode: "g", unitVal: 250, price: 150, isDefault: true },
          { name: "500g Box", sku: "SW-ESL-500G", unitCode: "g", unitVal: 500, price: 290, isDefault: false },
        ],
      },
    ],
  },

  // 12. Pickles (3 products)
  {
    category: {
      name: "Pickles",
      slug: "pickles",
      description: "Sun-cured traditional spicy South Indian pickles preserved in pure cold-pressed gingelly oil.",
      icon: "/categoryLogos/flavors_logo.svg",
    },
    products: [
      {
        name: "Amla Pickle",
        slug: "amla-pickle",
        description: "Whole wild gooseberries cured with rock salt, fenugreek, and mustard in unrefined sesame oil.",
        variants: [
          { name: "250g Glass Jar", sku: "PK-AML-250G", unitCode: "g", unitVal: 250, price: 110, isDefault: true },
          { name: "500g Glass Jar", sku: "PK-AML-500G", unitCode: "g", unitVal: 500, price: 210, isDefault: false },
        ],
      },
      {
        name: "Mango Pickle",
        slug: "mango-pickle",
        description: "Tender raw country mango chunks seasoned with roasted spices and authentic spicy gingelly dressing.",
        variants: [
          { name: "250g Glass Jar", sku: "PK-MNG-250G", unitCode: "g", unitVal: 250, price: 105, isDefault: true },
          { name: "500g Glass Jar", sku: "PK-MNG-500G", unitCode: "g", unitVal: 500, price: 200, isDefault: false },
        ],
      },
      {
        name: "Garlic Pickle",
        slug: "garlic-pickle",
        description: "Whole peeled hill garlic cloves steeped in tangy tamarind and spicy gingelly oil marinade.",
        variants: [
          { name: "250g Glass Jar", sku: "PK-GRL-250G", unitCode: "g", unitVal: 250, price: 125, isDefault: true },
          { name: "500g Glass Jar", sku: "PK-GRL-500G", unitCode: "g", unitVal: 500, price: 240, isDefault: false },
        ],
      },
    ],
  },

  // 13. Tea & Coffee (3 products)
  {
    category: {
      name: "Tea & Coffee",
      slug: "tea-coffee",
      description: "High-altitude aromatic tea leaves and roasted coffee beans grown in the cool mists of Kolli Hills.",
      icon: "/categoryLogos/flavors_logo.svg",
    },
    products: [
      {
        name: "Kolli Hills Herbal Tea",
        slug: "kolli-hills-herbal-tea",
        description: "Caffeine-free refreshing infusion of lemon grass, holy basil, ginger, and wild aromatic herbs.",
        variants: [
          { name: "100g Pouch", sku: "TC-KHT-100G", unitCode: "g", unitVal: 100, price: 130, isDefault: true },
          { name: "250g Pouch", sku: "TC-KHT-250G", unitCode: "g", unitVal: 250, price: 295, isDefault: false },
        ],
      },
      {
        name: "Kolli Hills Green Tea",
        slug: "kolli-hills-green-tea",
        description: "Whole-leaf organic green tea loaded with natural catechins and refreshing grassy vegetal notes.",
        variants: [
          { name: "100g Pouch", sku: "TC-KGT-100G", unitCode: "g", unitVal: 100, price: 140, isDefault: true },
          { name: "250g Pouch", sku: "TC-KGT-250G", unitCode: "g", unitVal: 250, price: 320, isDefault: false },
        ],
      },
      {
        name: "Filter Coffee",
        slug: "filter-coffee",
        description: "Authentic 80:20 plantation coffee and chicory blend roasted for an aromatic, velvety South Indian brew.",
        variants: [
          { name: "200g Pouch", sku: "TC-FCF-200G", unitCode: "g", unitVal: 200, price: 160, isDefault: true },
          { name: "500g Pouch", sku: "TC-FCF-500G", unitCode: "g", unitVal: 500, price: 370, isDefault: false },
        ],
      },
    ],
  },

  // 14. Organic Soaps (3 products)
  {
    category: {
      name: "Organic Soaps",
      slug: "organic-soaps",
      description: "Cold-process handmade herbal bathing bars formulated with virgin coconut oil and active botanicals.",
      icon: "/categoryLogos/traditional_logo.svg",
    },
    products: [
      {
        name: "Neem Soap",
        slug: "neem-soap",
        description: "Antibacterial cold-process soap bar infused with pure neem leaf extract and therapeutic essential oils.",
        variants: [
          { name: "75g Single Bar", sku: "SB-NEM-75G", unitCode: "g", unitVal: 75, price: 70, isDefault: true },
          { name: "125g Twin Pack", sku: "SB-NEM-125G", unitCode: "g", unitVal: 125, price: 130, isDefault: false },
        ],
      },
      {
        name: "Kuppaimeni Soap",
        slug: "kuppaimeni-soap",
        description: "Traditional Acalypha indica herbal soap revered for soothing acne, skin blemishes, and irritation.",
        variants: [
          { name: "75g Single Bar", sku: "SB-KPM-75G", unitCode: "g", unitVal: 75, price: 75, isDefault: true },
          { name: "125g Twin Pack", sku: "SB-KPM-125G", unitCode: "g", unitVal: 125, price: 140, isDefault: false },
        ],
      },
      {
        name: "Turmeric Soap",
        slug: "turmeric-soap",
        description: "Gentle brightening organic bath bar made with wild Kasturi Manjal and skin-softening coconut butter.",
        variants: [
          { name: "75g Single Bar", sku: "SB-TRM-75G", unitCode: "g", unitVal: 75, price: 75, isDefault: true },
          { name: "125g Twin Pack", sku: "SB-TRM-125G", unitCode: "g", unitVal: 125, price: 140, isDefault: false },
        ],
      },
    ],
  },

  // 15. Nuts, Seeds & Dry Fruits (3 products)
  {
    category: {
      name: "Nuts, Seeds & Dry Fruits",
      slug: "nuts-seeds-dry-fruits",
      description: "Nutrient-dense raw seeds and country nuts packed with healthy fats, protein, and natural crunch.",
      icon: "/categoryLogos/bites_logo.svg",
    },
    products: [
      {
        name: "Groundnut",
        slug: "groundnut",
        description: "Native small-kernel red skin raw peanuts fresh from rural rainfed agricultural harvests.",
        variants: [
          { name: "250g Pack", sku: "NS-GND-250G", unitCode: "g", unitVal: 250, price: 85, isDefault: true },
          { name: "500g Pack", sku: "NS-GND-500G", unitCode: "g", unitVal: 500, price: 160, isDefault: false },
        ],
      },
      {
        name: "Flax Seeds",
        slug: "flax-seeds",
        description: "Raw brown flax seeds packed with omega-3 fatty acids, lignans, and gentle digestive fiber.",
        variants: [
          { name: "250g Pack", sku: "NS-FLX-250G", unitCode: "g", unitVal: 250, price: 95, isDefault: true },
          { name: "500g Pack", sku: "NS-FLX-500G", unitCode: "g", unitVal: 500, price: 180, isDefault: false },
        ],
      },
      {
        name: "Sesame Seeds",
        slug: "sesame-seeds",
        description: "Unpolished natural black and brown sesame seeds loaded with minerals, zinc, and bio-available calcium.",
        variants: [
          { name: "250g Pack", sku: "NS-SSM-250G", unitCode: "g", unitVal: 250, price: 110, isDefault: true },
          { name: "500g Pack", sku: "NS-SSM-500G", unitCode: "g", unitVal: 500, price: 210, isDefault: false },
        ],
      },
    ],
  },
];

async function main() {
  console.log("🌱 Starting Kollimalai catalog seeding...");
  console.log(`Plan: 15 Categories | 50 Products | 100 Variants\n`);

  // 1. Ensure Brand
  const brand = await db.productBrand.upsert({
    where: { slug: "kollimalai-arasan" },
    update: {
      name: "Kollimalai Arasan",
      description: "Authentic, traditional organic snacks, spices, oils, and heritage foods from Kolli Hills.",
      status: true,
      isActive: true,
    },
    create: {
      uuid: crypto.randomUUID(),
      name: "Kollimalai Arasan",
      slug: "kollimalai-arasan",
      description: "Authentic, traditional organic snacks, spices, oils, and heritage foods from Kolli Hills.",
      status: true,
      isActive: true,
    },
  });
  console.log(`✓ Brand: "${brand.name}" (ID: ${brand.id})`);

  // 2. Ensure Units
  const unitsToSeed = [
    { code: "g", name: "Gram", type: product_units_type.weight, factor: 0.001, sort: 1 },
    { code: "kg", name: "Kilogram", type: product_units_type.weight, factor: 1.0, sort: 2 },
    { code: "ml", name: "Millilitre", type: product_units_type.volume, factor: 0.001, sort: 3 },
    { code: "L", name: "Litre", type: product_units_type.volume, factor: 1.0, sort: 4 },
    { code: "pcs", name: "Piece", type: product_units_type.count, factor: 1.0, sort: 5 },
  ];

  const unitMap = new Map<string, bigint>();
  for (const u of unitsToSeed) {
    const unitRecord = await db.product_units.upsert({
      where: { code: u.code },
      update: { name: u.name, type: u.type, is_active: true, status: true },
      create: {
        uuid: crypto.randomUUID(),
        name: u.name,
        code: u.code,
        type: u.type,
        conversion_factor: u.factor,
        sort_order: u.sort,
        is_active: true,
        status: true,
      },
    });
    unitMap.set(u.code, unitRecord.id);
  }
  console.log(`✓ Standard Units verified: [${Array.from(unitMap.keys()).join(", ")}]`);

  let totalCategories = 0;
  let totalProducts = 0;
  let totalVariants = 0;

  // 3. Iterate and seed Categories, Products, and Variants
  for (let cIdx = 0; cIdx < CATALOG_DATA.length; cIdx++) {
    const catDef = CATALOG_DATA[cIdx];
    const category = await db.productCategory.upsert({
      where: { slug: catDef.category.slug },
      update: {
        name: catDef.category.name,
        description: catDef.category.description,
        icon: catDef.category.icon,
        sortOrder: cIdx + 1,
        status: true,
        isActive: true,
      },
      create: {
        uuid: crypto.randomUUID(),
        name: catDef.category.name,
        slug: catDef.category.slug,
        description: catDef.category.description,
        icon: catDef.category.icon,
        sortOrder: cIdx + 1,
        status: true,
        isActive: true,
      },
    });
    totalCategories++;

    // Ensure category image
    const existingCatImg = await db.product_category_images.findFirst({
      where: { category_id: category.id },
    });
    if (!existingCatImg) {
      await db.product_category_images.create({
        data: {
          uuid: crypto.randomUUID(),
          category_id: category.id,
          image_url: catDef.category.icon,
          alt_text: catDef.category.name,
          sort_order: 1,
          status: true,
          is_active: true,
        },
      });
    }

    console.log(`\n[${totalCategories}/15] Category: ${category.name}`);

    for (const prodDef of catDef.products) {
      const defaultVariant = prodDef.variants.find((v) => v.isDefault) || prodDef.variants[0];
      const prodImgUrl =
        SPECIFIC_PRODUCT_IMAGES[prodDef.slug] ||
        CATEGORY_DEFAULT_IMAGES[catDef.category.slug] ||
        "/categoryLogos/traditional_logo.svg";

      const product = await db.product.upsert({
        where: { slug: prodDef.slug },
        update: {
          name: prodDef.name,
          categoryId: category.id,
          brandId: brand.id,
          base_price: defaultVariant.price,
          sale_price: defaultVariant.price,
          status: true,
          isActive: true,
        },
        create: {
          uuid: crypto.randomUUID(),
          name: prodDef.name,
          slug: prodDef.slug,
          sku: defaultVariant.sku,
          categoryId: category.id,
          brandId: brand.id,
          base_price: defaultVariant.price,
          sale_price: defaultVariant.price,
          status: true,
          isActive: true,
        },
      });
      totalProducts++;

      // Upsert Product Image
      const existingProdImg = await db.productImage.findFirst({
        where: { productId: product.id },
      });
      if (!existingProdImg) {
        await db.productImage.create({
          data: {
            productId: product.id,
            image_url: prodImgUrl,
            altText: product.name,
            isPrimary: true,
            sortOrder: 1,
            is_active: true,
          },
        });
      }

      // Seed Variants
      for (const varDef of prodDef.variants) {
        const variantSlug = `${prodDef.slug}-${varDef.sku.toLowerCase()}`;
        const unitId = unitMap.get(varDef.unitCode) || unitMap.get("g")!;

        const variant = await db.productVariant.upsert({
          where: { slug: variantSlug },
          update: {
            variant_name: varDef.name,
            short_description: prodDef.description,
            description: prodDef.description,
            is_default: varDef.isDefault,
            isActive: true,
            out_of_stock: false,
          },
          create: {
            uuid: crypto.randomUUID(),
            productId: product.id,
            variant_name: varDef.name,
            slug: variantSlug,
            short_description: prodDef.description,
            description: prodDef.description,
            is_default: varDef.isDefault,
            is_featured: varDef.isDefault,
            isActive: true,
            out_of_stock: false,
          },
        });
        totalVariants++;

        // Ensure Variant Image
        const existingVarImg = await db.product_variant_images.findFirst({
          where: { variant_id: variant.id },
        });
        if (!existingVarImg) {
          await db.product_variant_images.create({
            data: {
              uuid: crypto.randomUUID(),
              variant_id: variant.id,
              image_url: prodImgUrl,
              sort_order: 1,
              is_primary: true,
              status: true,
              is_active: true,
            },
          });
        }

        // Upsert Variant Unit Price
        const unitPrice = await db.variantUnitPrice.upsert({
          where: { sku: varDef.sku },
          update: {
            variant_id: variant.id,
            unit_id: unitId,
            unit_value: varDef.unitVal,
            base_price: varDef.price,
            is_default: varDef.isDefault,
            isActive: true,
          },
          create: {
            uuid: crypto.randomUUID(),
            variant_id: variant.id,
            unit_id: unitId,
            unit_value: varDef.unitVal,
            sku: varDef.sku,
            base_price: varDef.price,
            is_default: varDef.isDefault,
            isActive: true,
          },
        });

        // Upsert Inventory
        await db.inventory.upsert({
          where: { variantUnitPriceId: unitPrice.id },
          update: {
            quantity_available: 150,
            quantity_reserved: 0,
            reorderLevel: 10,
            warehouse_location: "Kolli Hills Central Depot",
            is_active: true,
          },
          create: {
            variantUnitPriceId: unitPrice.id,
            quantity_available: 150,
            quantity_reserved: 0,
            reorderLevel: 10,
            warehouse_location: "Kolli Hills Central Depot",
            is_active: true,
          },
        });
      }

      console.log(`   + Product: ${product.name} (2 variants: ${prodDef.variants.map((v) => v.name).join(", ")})`);
    }
  }

  console.log("\n========================================================");
  console.log("🎉 Seed Completed Successfully!");
  console.log(`   • Categories Created/Verified : ${totalCategories}`);
  console.log(`   • Products Created/Verified   : ${totalProducts}`);
  console.log(`   • Variants Created/Verified   : ${totalVariants}`);
  console.log("========================================================\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding Error:", err);
  process.exit(1);
});
