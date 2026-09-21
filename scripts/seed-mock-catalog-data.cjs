const mariadb = require('mariadb');
const crypto = require('crypto');
require('dotenv').config();

const IMAGES = [
  '/uploads/products/26c23dea-2cab-41b7-a48f-8d3babee6337.jpg',
  '/uploads/products/43515392-eb49-4c0b-8cee-5fe6b5f0aadf.jpg',
  '/uploads/products/437740ff-858e-4e1b-8591-729b2bdd22fa.jpg',
  '/uploads/products/5c214a2c-3f3a-4881-92ff-c34a37f360d8.jpg',
  '/uploads/products/77d3b292-f97a-484d-bed3-fd1f12e25c48.jpg',
  '/uploads/products/7b3d0c03-cf37-4aa1-8214-6cd1d284b764.png',
  '/uploads/products/7b62afe4-9262-4a52-8ffe-bf633675fcb1.jpg',
  '/uploads/products/7e076a3a-b817-4231-8ca6-431f10c21d2c.webp',
  '/uploads/products/8d560599-5351-45e9-878a-24270dcd6067.png',
  '/uploads/products/cdf70fad-6ecd-42f4-a482-dce7fe12c94c.jpg',
  '/uploads/products/f553ba69-8f93-4d81-8ad9-a124ed48a2ec.jpg',
];

const CATEGORY_LOGOS = [
  '/categoryLogos/flavors_logo.svg',
  '/categoryLogos/traditional_logo.svg',
  '/categoryLogos/sweet_logo.svg',
  '/categoryLogos/chips_logo.svg',
  '/categoryLogos/bites_logo.svg',
  '/categoryLogos/bakery_logo.svg',
];

// 20 Categories with 50 Products and 100 Variants (2 variants per product)
const MOCK_DATA = [
  // 1. Spices & Whole Spices (3 products)
  {
    name: "Spices & Whole Spices",
    slug: "spices-whole-spices",
    description: "Authentic, aromatic whole spices cultivated naturally in the mist-covered valleys of Kolli Hills.",
    icon: CATEGORY_LOGOS[0],
    products: [
      {
        name: "Kolli Hills Black Pepper",
        slug: "kolli-hills-black-pepper",
        desc: "Renowned high-piperine pungent black pepper harvested from high altitudes.",
        basePrice: 160,
        variants: [
          { name: "Grade-A Bold Whole Berries", slug: "kolli-black-pepper-bold", unit: "g", unitVal: 250, price: 160, sku: "PEP-BLD-250G" },
          { name: "Artisanal Crushed Pepper Coarse", slug: "kolli-black-pepper-coarse", unit: "g", unitVal: 200, price: 145, sku: "PEP-CRS-200G" },
        ]
      },
      {
        name: "Kolli Hills Green Cardamom",
        slug: "kolli-hills-green-cardamom",
        desc: "Hand-picked 8mm+ vibrant green cardamom pods bursting with natural floral fragrance.",
        basePrice: 280,
        variants: [
          { name: "Super Jumbo 8mm Pods", slug: "kolli-cardamom-jumbo", unit: "g", unitVal: 100, price: 280, sku: "CRD-JMB-100G" },
          { name: "Standard Whole Green Pods", slug: "kolli-cardamom-standard", unit: "g", unitVal: 100, price: 230, sku: "CRD-STD-100G" },
        ]
      },
      {
        name: "Kolli Hills Whole Cloves",
        slug: "kolli-hills-whole-cloves",
        desc: "Aromatic dried clove buds retaining full heads and rich natural eugenol oils.",
        basePrice: 190,
        variants: [
          { name: "Full Head Premium Cloves", slug: "kolli-cloves-full-head", unit: "g", unitVal: 100, price: 190, sku: "CLV-PRM-100G" },
          { name: "Value Pack Whole Cloves", slug: "kolli-cloves-value-pack", unit: "g", unitVal: 250, price: 420, sku: "CLV-VAL-250G" },
        ]
      }
    ]
  },

  // 2. Traditional & Heritage Rice (3 products)
  {
    name: "Traditional & Heritage Rice",
    slug: "traditional-heritage-rice",
    description: "Nutrient-dense indigenous Tamil Nadu heritage rice varieties grown using organic farming.",
    icon: CATEGORY_LOGOS[1],
    products: [
      {
        name: "Mappillai Samba Rice (Bridegroom Rice)",
        slug: "mappillai-samba-rice",
        desc: "Ancient red rice known for iron, zinc, and high stamina enhancement.",
        basePrice: 135,
        variants: [
          { name: "Raw Unpolished Mappillai Samba", slug: "mappillai-samba-unpolished", unit: "kg", unitVal: 1, price: 135, sku: "RCE-MPS-1KG" },
          { name: "Semi-Polished Mappillai Samba", slug: "mappillai-samba-semi-polished", unit: "kg", unitVal: 1, price: 140, sku: "RCE-MPS-SMP-1KG" },
        ]
      },
      {
        name: "Karuppu Kavuni Rice (Black Rice)",
        slug: "karuppu-kavuni-rice",
        desc: "Forbidden royal black rice rich in anthocyanin antioxidants and low GI carbohydrates.",
        basePrice: 180,
        variants: [
          { name: "Whole Grain Black Kavuni", slug: "karuppu-kavuni-whole", unit: "kg", unitVal: 1, price: 180, sku: "RCE-KVN-1KG" },
          { name: "Black Rice Porridge Broken Mix", slug: "karuppu-kavuni-broken", unit: "g", unitVal: 500, price: 95, sku: "RCE-KVN-BRK-500G" },
        ]
      },
      {
        name: "Seeraga Samba Fragrant Rice",
        slug: "seeraga-samba-fragrant-rice",
        desc: "Tiny fragrant heirloom rice ideal for authentic South Indian biryanis.",
        basePrice: 155,
        variants: [
          { name: "Aged Seeraga Samba Classic", slug: "seeraga-samba-aged", unit: "kg", unitVal: 1, price: 155, sku: "RCE-SSM-1KG" },
          { name: "Family Pack Seeraga Samba", slug: "seeraga-samba-family-pack", unit: "kg", unitVal: 5, price: 740, sku: "RCE-SSM-5KG" },
        ]
      }
    ]
  },

  // 3. Pure Mountain Honey & Bee Products (3 products)
  {
    name: "Pure Mountain Honey & Bee Products",
    slug: "pure-mountain-honey-bee-products",
    description: "Raw, unfiltered wild forest honey gathered by tribal honey hunters in the Kolli hills canopy.",
    icon: CATEGORY_LOGOS[2],
    products: [
      {
        name: "Wild Rock Bee Forest Honey",
        slug: "wild-rock-bee-forest-honey",
        desc: "Deep amber multi-floral honey collected from high cliff combs without heat processing.",
        basePrice: 380,
        variants: [
          { name: "Raw Forest Honey Glass Jar", slug: "wild-honey-glass-jar", unit: "g", unitVal: 500, price: 380, sku: "HNY-RCK-500G" },
          { name: "Bulk Wild Forest Honey Pack", slug: "wild-honey-bulk-pack", unit: "kg", unitVal: 1, price: 720, sku: "HNY-RCK-1KG" },
        ]
      },
      {
        name: "Kombu Honey (Small Bee Honey)",
        slug: "kombu-honey-small-bee",
        desc: "Rare medicinal honey harvested from stingless dwarf bees (Dammer bees) with floral notes.",
        basePrice: 520,
        variants: [
          { name: "Pure Dammer Kombu Honey", slug: "kombu-honey-pure-jar", unit: "g", unitVal: 250, price: 520, sku: "HNY-KMB-250G" },
          { name: "Medicinal Kombu Honey Drops Pack", slug: "kombu-honey-drops-pack", unit: "g", unitVal: 500, price: 990, sku: "HNY-KMB-500G" },
        ]
      },
      {
        name: "Ginger Infused Forest Honey",
        slug: "ginger-infused-forest-honey",
        desc: "Synergistic blend of crushed fresh Kolli ginger steeped in raw rock bee honey.",
        basePrice: 290,
        variants: [
          { name: "Ginger Honey Tonic Jar", slug: "ginger-honey-tonic-jar", unit: "g", unitVal: 350, price: 290, sku: "HNY-GNG-350G" },
          { name: "Ginger Honey Value Pack", slug: "ginger-honey-value-pack", unit: "g", unitVal: 700, price: 550, sku: "HNY-GNG-700G" },
        ]
      }
    ]
  },

  // 4. Native Millets & Ancient Grains (3 products)
  {
    name: "Native Millets & Ancient Grains",
    slug: "native-millets-ancient-grains",
    description: "Gluten-free traditional millets packed with dietary fiber and low glycemic indices.",
    icon: CATEGORY_LOGOS[3],
    products: [
      {
        name: "Finger Millet (Ragi / Kezhvaragu)",
        slug: "finger-millet-ragi",
        desc: "Calcium-rich whole finger millet seeds cultivated under rain-fed mountain soils.",
        basePrice: 75,
        variants: [
          { name: "Whole Grain Mountain Ragi", slug: "ragi-whole-grain", unit: "kg", unitVal: 1, price: 75, sku: "MLT-RAG-1KG" },
          { name: "Sprouted Ragi Super Flour", slug: "ragi-sprouted-flour", unit: "g", unitVal: 500, price: 85, sku: "MLT-RAG-SPR-500G" },
        ]
      },
      {
        name: "Foxtail Millet (Thinai)",
        slug: "foxtail-millet-thinai",
        desc: "Golden ancient millet rich in vitamin B12, ideal for upma, pongal, and sweet payasam.",
        basePrice: 90,
        variants: [
          { name: "Unhulled Natural Foxtail", slug: "thinai-unhulled-pack", unit: "kg", unitVal: 1, price: 90, sku: "MLT-THN-1KG" },
          { name: "Polished Thinai Grain", slug: "thinai-polished-grain", unit: "kg", unitVal: 1, price: 95, sku: "MLT-THN-PLSH-1KG" },
        ]
      },
      {
        name: "Little Millet (Samai)",
        slug: "little-millet-samai",
        desc: "Delicate digestible small millet perfect as an everyday white rice replacement.",
        basePrice: 95,
        variants: [
          { name: "Raw Whole Samai Pack", slug: "samai-raw-whole", unit: "kg", unitVal: 1, price: 95, sku: "MLT-SMI-1KG" },
          { name: "Samai Organic Porridge Flakes", slug: "samai-porridge-flakes", unit: "g", unitVal: 500, price: 70, sku: "MLT-SMI-FLK-500G" },
        ]
      }
    ]
  },

  // 5. Cold-Pressed Wood Churned Oils (3 products)
  {
    name: "Cold-Pressed Wood Churned Oils",
    slug: "cold-pressed-wood-churned-oils",
    description: "Traditional Mara Chekku wood-pressed oils extracted at room temperature without chemicals.",
    icon: CATEGORY_LOGOS[4],
    products: [
      {
        name: "Wood Pressed Sesame (Gingelly) Oil",
        slug: "wood-pressed-sesame-oil",
        desc: "Extracted from mountain black sesame seeds with authentic palm jaggery sweetness.",
        basePrice: 280,
        variants: [
          { name: "Glass Bottle Premium Sesame", slug: "sesame-oil-glass-bottle", unit: "ml", unitVal: 500, price: 280, sku: "OIL-SES-500ML" },
          { name: "Traditional 1 Litre Can", slug: "sesame-oil-one-litre", unit: "L", unitVal: 1, price: 540, sku: "OIL-SES-1L" },
        ]
      },
      {
        name: "Wood Pressed Groundnut Oil",
        slug: "wood-pressed-groundnut-oil",
        desc: "Fragrant cold pressed peanut oil with high smoke point and pure nutty flavor.",
        basePrice: 220,
        variants: [
          { name: "Cold Pressed Groundnut 500ml", slug: "groundnut-oil-500ml", unit: "ml", unitVal: 500, price: 220, sku: "OIL-GND-500ML" },
          { name: "Cold Pressed Groundnut 1L Tin", slug: "groundnut-oil-1l-tin", unit: "L", unitVal: 1, price: 420, sku: "OIL-GND-1L" },
        ]
      },
      {
        name: "Pure Wood Pressed Virgin Coconut Oil",
        slug: "wood-pressed-virgin-coconut-oil",
        desc: "White copra cold pressed oil with zero heat treatment, versatile for cooking and hair care.",
        basePrice: 250,
        variants: [
          { name: "Virgin Coconut Oil Glass Jar", slug: "coconut-oil-glass-jar", unit: "ml", unitVal: 500, price: 250, sku: "OIL-COC-500ML" },
          { name: "Virgin Coconut Oil 1 Litre Bottle", slug: "coconut-oil-one-litre", unit: "L", unitVal: 1, price: 480, sku: "OIL-COC-1L" },
        ]
      }
    ]
  },

  // 6. Hill Herbal Teas & Infusions (3 products)
  {
    name: "Hill Herbal Teas & Infusions",
    slug: "hill-herbal-teas-infusions",
    description: "Soothing natural herbal teas made from sun-dried flowers, hill roots, and forest leaves.",
    icon: CATEGORY_LOGOS[5],
    products: [
      {
        name: "Sukku Malli Herbal Coffee Powder",
        slug: "sukku-malli-herbal-coffee",
        desc: "Traditional non-caffeinated digestive brew made with dry ginger, coriander seeds, and spices.",
        basePrice: 110,
        variants: [
          { name: "Classic Blend Sukku Malli", slug: "sukku-malli-classic-blend", unit: "g", unitVal: 200, price: 110, sku: "TEA-SKM-200G" },
          { name: "Jaggery Premix Sukku Coffee", slug: "sukku-malli-jaggery-premix", unit: "g", unitVal: 250, price: 140, sku: "TEA-SKM-JAG-250G" },
        ]
      },
      {
        name: "Hibiscus Flower Wellness Tea",
        slug: "hibiscus-flower-wellness-tea",
        desc: "Vibrant ruby-red dried hibiscus calyces supporting healthy blood pressure and vitality.",
        basePrice: 130,
        variants: [
          { name: "Whole Dried Hibiscus Petals", slug: "hibiscus-whole-petals", unit: "g", unitVal: 100, price: 130, sku: "TEA-HBC-100G" },
          { name: "Crushed Hibiscus Tea Cut", slug: "hibiscus-crushed-cut", unit: "g", unitVal: 200, price: 240, sku: "TEA-HBC-200G" },
        ]
      },
      {
        name: "Lemongrass & Cardamom Green Brew",
        slug: "lemongrass-cardamom-green-brew",
        desc: "Invigorating citrusy infusion of dried Kolli lemongrass and bruised cardamom pods.",
        basePrice: 140,
        variants: [
          { name: "Herbal Leaf Loose Tea", slug: "lemongrass-loose-tea", unit: "g", unitVal: 100, price: 140, sku: "TEA-LMG-100G" },
          { name: "Family Pack Loose Leaves", slug: "lemongrass-family-pack", unit: "g", unitVal: 250, price: 310, sku: "TEA-LMG-250G" },
        ]
      }
    ]
  },

  // 7. Herbal Health & Wellness Powders (3 products)
  {
    name: "Herbal Health & Wellness Powders",
    slug: "herbal-health-wellness-powders",
    description: "Ayurvedic and Siddha single-herb botanicals dried in shade and finely pulverized.",
    icon: CATEGORY_LOGOS[0],
    products: [
      {
        name: "Wild Kolli Turmeric Powder (High Curcumin)",
        slug: "wild-kolli-turmeric-powder",
        desc: "Vibrant golden mountain turmeric verified for 5%+ natural curcumin content.",
        basePrice: 120,
        variants: [
          { name: "Curcumin Gold Pouch", slug: "turmeric-curcumin-gold", unit: "g", unitVal: 250, price: 120, sku: "HRB-TRM-250G" },
          { name: "Super Economy Turmeric 1kg", slug: "turmeric-economy-1kg", unit: "kg", unitVal: 1, price: 440, sku: "HRB-TRM-1KG" },
        ]
      },
      {
        name: "Moringa Leaf Organic Powder",
        slug: "moringa-leaf-organic-powder",
        desc: "Nutrient powerhouse shade-dried drumstick leaves packed with iron, protein, and amino acids.",
        basePrice: 95,
        variants: [
          { name: "Micro-fine Moringa Powder", slug: "moringa-microfine-powder", unit: "g", unitVal: 200, price: 95, sku: "HRB-MRG-200G" },
          { name: "Moringa Superfood Tub", slug: "moringa-superfood-tub", unit: "g", unitVal: 500, price: 220, sku: "HRB-MRG-500G" },
        ]
      },
      {
        name: "Amla Dry Powder (Nellikai)",
        slug: "amla-dry-powder-nellikai",
        desc: "Sun-dried wild Indian gooseberry powder loaded with natural vitamin C and rejuvenating tannins.",
        basePrice: 110,
        variants: [
          { name: "Pure Amla Fruit Powder", slug: "amla-fruit-powder", unit: "g", unitVal: 200, price: 110, sku: "HRB-AML-200G" },
          { name: "Amla Seedless Coarse Cut", slug: "amla-seedless-coarse", unit: "g", unitVal: 300, price: 160, sku: "HRB-AML-300G" },
        ]
      }
    ]
  },

  // 8. Pepper & Cardamom Reserves (3 products)
  {
    name: "Pepper & Cardamom Special Reserves",
    slug: "pepper-cardamom-reserves",
    description: "Specialized single-estate harvests and white peppers from the slopes of Kollimalai.",
    icon: CATEGORY_LOGOS[1],
    products: [
      {
        name: "Kolli Hills White Pepper Berries",
        slug: "kolli-hills-white-pepper",
        desc: "Matured pepper berries naturally fermented and de-husked in mountain spring water.",
        basePrice: 220,
        variants: [
          { name: "Whole White Pepper Berries", slug: "white-pepper-whole", unit: "g", unitVal: 150, price: 220, sku: "PEP-WHT-150G" },
          { name: "Fine Ground White Pepper", slug: "white-pepper-fine-ground", unit: "g", unitVal: 150, price: 235, sku: "PEP-WHT-GRN-150G" },
        ]
      },
      {
        name: "Long Pepper (Thippili / Pippali)",
        slug: "long-pepper-thippili",
        desc: "Distinct cylindrical spike pepper revered in ancient Siddha medicine for respiratory wellness.",
        basePrice: 175,
        variants: [
          { name: "Whole Pippali Spikes", slug: "pippali-whole-spikes", unit: "g", unitVal: 100, price: 175, sku: "PEP-TPL-100G" },
          { name: "Pippali Powder Reserve", slug: "pippali-powder-reserve", unit: "g", unitVal: 100, price: 190, sku: "PEP-TPL-PWD-100G" },
        ]
      },
      {
        name: "Special Reserve Wild Green Peppercorns",
        slug: "wild-green-peppercorns",
        desc: "Immature tender peppercorns freeze-dried to retain herbal freshness and snappy heat.",
        basePrice: 185,
        variants: [
          { name: "Freeze-Dried Whole Green Berries", slug: "green-peppercorns-freeze-dried", unit: "g", unitVal: 100, price: 185, sku: "PEP-GRN-100G" },
          { name: "Brined Whole Green Peppercorns", slug: "green-peppercorns-brined", unit: "g", unitVal: 200, price: 210, sku: "PEP-GRN-BRN-200G" },
        ]
      }
    ]
  },

  // 9. Wild Forest Herbs & Roots (3 products)
  {
    name: "Wild Forest Herbs & Roots",
    slug: "wild-forest-herbs-roots",
    description: "Potent wild roots, bark, and rhizomes ethically harvested in Kolli mountain forests.",
    icon: CATEGORY_LOGOS[2],
    products: [
      {
        name: "Ashwagandha Mountain Root (Amukkuram)",
        slug: "ashwagandha-mountain-root",
        desc: "Adaptogenic restorative root renowned for energy balance, calm mind, and stamina.",
        basePrice: 195,
        variants: [
          { name: "Dried Whole Root Slices", slug: "ashwagandha-whole-slices", unit: "g", unitVal: 150, price: 195, sku: "ROT-ASH-150G" },
          { name: "Pure Ashwagandha Fine Chooranam", slug: "ashwagandha-chooranam", unit: "g", unitVal: 200, price: 240, sku: "ROT-ASH-PWD-200G" },
        ]
      },
      {
        name: "Athimadhuram (Licorice Root)",
        slug: "athimadhuram-licorice-root",
        desc: "Naturally sweet soothing root providing instant relief for sore throat and digestion.",
        basePrice: 125,
        variants: [
          { name: "Crushed Licorice Bark", slug: "athimadhuram-crushed-bark", unit: "g", unitVal: 150, price: 125, sku: "ROT-ATH-150G" },
          { name: "Sweet Licorice Root Powder", slug: "athimadhuram-powder", unit: "g", unitVal: 200, price: 160, sku: "ROT-ATH-PWD-200G" },
        ]
      },
      {
        name: "Chitharathai (Lesser Galangal Root)",
        slug: "chitharathai-lesser-galangal",
        desc: "Aromatic rhizome celebrated in traditional Tamil households for clearing congestion.",
        basePrice: 130,
        variants: [
          { name: "Dried Galangal Knots", slug: "galangal-dried-knots", unit: "g", unitVal: 100, price: 130, sku: "ROT-CHT-100G" },
          { name: "Galangal Cold Brew Powder", slug: "galangal-cold-brew-powder", unit: "g", unitVal: 150, price: 180, sku: "ROT-CHT-PWD-150G" },
        ]
      }
    ]
  },

  // 10. Traditional Masalas & Spice Mixes (3 products)
  {
    name: "Traditional Masalas & Spice Mixes",
    slug: "traditional-masalas-spice-mixes",
    description: "Stone ground authentic Tamil Nadu spice masalas with zero artificial colors or preservatives.",
    icon: CATEGORY_LOGOS[3],
    products: [
      {
        name: "Authentic Kolli Sambar Masala Powder",
        slug: "authentic-kolli-sambar-masala",
        desc: "Slow roasted whole coriander, red chillies, fenugreek, and spices for iconic South Indian sambar.",
        basePrice: 85,
        variants: [
          { name: "Standard Kitchen Pouch", slug: "sambar-masala-standard", unit: "g", unitVal: 200, price: 85, sku: "MSL-SMR-200G" },
          { name: "Aroma Lock Tin Pack", slug: "sambar-masala-tin-pack", unit: "g", unitVal: 500, price: 195, sku: "MSL-SMR-500G" },
        ]
      },
      {
        name: "Country Rasam Podi (Peppercorn Rich)",
        slug: "country-rasam-podi",
        desc: "Generously infused with Kolli black pepper, cumin, and curry leaves for digestive rasam.",
        basePrice: 90,
        variants: [
          { name: "Homestyle Coarse Rasam Podi", slug: "rasam-podi-homestyle", unit: "g", unitVal: 200, price: 90, sku: "MSL-RSM-200G" },
          { name: "Grandmother Recipe 500g Tub", slug: "rasam-podi-grandmother-tub", unit: "g", unitVal: 500, price: 210, sku: "MSL-RSM-500G" },
        ]
      },
      {
        name: "Heritage Idli Podi (Gunpowder with Sesame)",
        slug: "heritage-idli-podi",
        desc: "Crunchy spicy lentil and roasted sesame chutney powder seasoned with virgin gingelly oil.",
        basePrice: 95,
        variants: [
          { name: "Roasted Garlic & Sesame Podi", slug: "idli-podi-roasted-garlic", unit: "g", unitVal: 250, price: 95, sku: "MSL-IDL-250G" },
          { name: "Extra Spicy Red Chilli Podi", slug: "idli-podi-extra-spicy", unit: "g", unitVal: 250, price: 95, sku: "MSL-IDL-SPC-250G" },
        ]
      }
    ]
  },

  // 11. Organic Palm Jaggery & Sweeteners (2 products)
  {
    name: "Organic Palm Jaggery & Sweeteners",
    slug: "organic-palm-jaggery-sweeteners",
    description: "Pure unrefined palm sweeteners tapped traditionally from palmyra trees.",
    icon: CATEGORY_LOGOS[4],
    products: [
      {
        name: "Traditional Panai Karupatti (Palm Jaggery Blocks)",
        slug: "panai-karupatti-palm-jaggery",
        desc: "Hard crystalline dark palm jaggery rich in iron, minerals, and complex sweetness.",
        basePrice: 175,
        variants: [
          { name: "Solid Karupatti Cubes", slug: "karupatti-solid-cubes", unit: "g", unitVal: 500, price: 175, sku: "SWT-KRP-500G" },
          { name: "Wholesome 1kg Karupatti Block", slug: "karupatti-one-kg-block", unit: "kg", unitVal: 1, price: 330, sku: "SWT-KRP-1KG" },
        ]
      },
      {
        name: "Organic Nattu Sakkarai (Cane Sugar)",
        slug: "organic-nattu-sakkarai",
        desc: "Golden unbleached country cane sugar retains all vital molasses and sweetness.",
        basePrice: 90,
        variants: [
          { name: "Granulated Nattu Sakkarai 1kg", slug: "nattu-sakkarai-1kg", unit: "kg", unitVal: 1, price: 90, sku: "SWT-NSK-1KG" },
          { name: "Economy Family Tub 3kg", slug: "nattu-sakkarai-3kg", unit: "kg", unitVal: 3, price: 260, sku: "SWT-NSK-3KG" },
        ]
      }
    ]
  },

  // 12. Kolli Hill Pure Ghee & Dairy (2 products)
  {
    name: "Kolli Hill Pure Ghee & Dairy",
    slug: "kolli-hill-pure-ghee-dairy",
    description: "Bilona method churned grass-fed desi cow ghee with distinctive golden granular texture.",
    icon: CATEGORY_LOGOS[5],
    products: [
      {
        name: "Desi Cow A2 Bilona Cultured Ghee",
        slug: "desi-cow-a2-bilona-ghee",
        desc: "Hand churned from curd of pasture-grazing indigenous cows in hill slopes.",
        basePrice: 650,
        variants: [
          { name: "Glass Jar Cultured Ghee", slug: "a2-ghee-glass-jar", unit: "ml", unitVal: 500, price: 650, sku: "GHE-A2C-500ML" },
          { name: "Full Litre Heritage Ghee Can", slug: "a2-ghee-litre-can", unit: "L", unitVal: 1, price: 1250, sku: "GHE-A2C-1L" },
        ]
      },
      {
        name: "Mountain Buffalo Pure Ghee",
        slug: "mountain-buffalo-pure-ghee",
        desc: "Rich, aromatic, snow-white granular buffalo ghee perfect for traditional South Indian sweets.",
        basePrice: 520,
        variants: [
          { name: "Granular Buffalo Ghee 500ml", slug: "buffalo-ghee-500ml", unit: "ml", unitVal: 500, price: 520, sku: "GHE-BUF-500ML" },
          { name: "One Litre Buffalo Ghee Jar", slug: "buffalo-ghee-1l", unit: "L", unitVal: 1, price: 990, sku: "GHE-BUF-1L" },
        ]
      }
    ]
  },

  // 13. Traditional Pickles & Thokku (2 products)
  {
    name: "Traditional Pickles & Thokku",
    slug: "traditional-pickles-thokku",
    description: "Sun-cured country pickles immersed in cold-pressed gingelly oil and crushed spices.",
    icon: CATEGORY_LOGOS[0],
    products: [
      {
        name: "Kolli Hills Mountain Garlic Thokku",
        slug: "mountain-garlic-thokku",
        desc: "Slow-simmered small mountain garlic pods in spicy tangy tamarind sauce.",
        basePrice: 165,
        variants: [
          { name: "Glass Jar Garlic Thokku", slug: "garlic-thokku-glass-jar", unit: "g", unitVal: 300, price: 165, sku: "PCK-GRL-300G" },
          { name: "Family Pack Garlic Thokku", slug: "garlic-thokku-family-pack", unit: "g", unitVal: 600, price: 310, sku: "PCK-GRL-600G" },
        ]
      },
      {
        name: "Wild Gooseberry (Amla) Pickle with Rock Salt",
        slug: "wild-amla-pickle-rock-salt",
        desc: "Steamed wild amla infused with roasted mustard, fenugreek, and cold pressed oil.",
        basePrice: 145,
        variants: [
          { name: "Whole Spiced Amla Pickle", slug: "amla-pickle-spiced", unit: "g", unitVal: 300, price: 145, sku: "PCK-AML-300G" },
          { name: "Grated Spicy Amla Thokku", slug: "amla-thokku-grated", unit: "g", unitVal: 300, price: 155, sku: "PCK-AML-THK-300G" },
        ]
      }
    ]
  },

  // 14. Dry Fruits & Forest Nuts (2 products)
  {
    name: "Dry Fruits & Forest Nuts",
    slug: "dry-fruits-forest-nuts",
    description: "Selected wholesome nuts, dry figs, and mountain dry berries for daily vitality.",
    icon: CATEGORY_LOGOS[1],
    products: [
      {
        name: "Wild Forest Cashew Nuts (Raw & Whole)",
        slug: "wild-forest-cashew-nuts",
        desc: "Crisp white kidney-shaped jumbo whole cashew nuts with natural sweet richness.",
        basePrice: 280,
        variants: [
          { name: "Whole W240 Jumbo Cashews", slug: "cashews-w240-jumbo", unit: "g", unitVal: 250, price: 280, sku: "NUT-CSH-250G" },
          { name: "Roasted & Salted Mountain Cashews", slug: "cashews-roasted-salted", unit: "g", unitVal: 250, price: 295, sku: "NUT-CSH-SLT-250G" },
        ]
      },
      {
        name: "Organic Sun-Dried Forest Figs (Atti Pazham)",
        slug: "organic-sun-dried-forest-figs",
        desc: "Chewy, naturally sweet mountain figs rich in calcium, potassium, and dietary fiber.",
        basePrice: 240,
        variants: [
          { name: "Sun Dried Round Whole Figs", slug: "figs-sun-dried-round", unit: "g", unitVal: 250, price: 240, sku: "NUT-FIG-250G" },
          { name: "500g Value Pack Dried Figs", slug: "figs-value-pack", unit: "g", unitVal: 500, price: 460, sku: "NUT-FIG-500G" },
        ]
      }
    ]
  },

  // 15. Natural Immunity & Health Elixirs (2 products)
  {
    name: "Natural Immunity & Health Elixirs",
    slug: "natural-immunity-health-elixirs",
    description: "Herbal formulations crafted according to time-honored traditional recipes.",
    icon: CATEGORY_LOGOS[2],
    products: [
      {
        name: "Kabasura Kudineer Choornam",
        slug: "kabasura-kudineer-choornam",
        desc: "Authentic 15-herb Siddha formulation clinically celebrated for respiratory immunity.",
        basePrice: 90,
        variants: [
          { name: "Pure Decoction Herbal Powder", slug: "kabasura-decoction-powder", unit: "g", unitVal: 100, price: 90, sku: "IMN-KBS-100G" },
          { name: "Family Pack Kudineer Mix", slug: "kabasura-family-pack", unit: "g", unitVal: 250, price: 210, sku: "IMN-KBS-250G" },
        ]
      },
      {
        name: "Thirikadugu Chooranam (Three Pungent Spices)",
        slug: "thirikadugu-chooranam",
        desc: "Equal balance of Sukku (dry ginger), Milagu (black pepper), and Thippili (long pepper).",
        basePrice: 110,
        variants: [
          { name: "Classical Thirikadugu Powder", slug: "thirikadugu-classical-powder", unit: "g", unitVal: 100, price: 110, sku: "IMN-THK-100G" },
          { name: "Double Strength Chooranam", slug: "thirikadugu-double-strength", unit: "g", unitVal: 200, price: 205, sku: "IMN-THK-200G" },
        ]
      }
    ]
  },

  // 16. Kolli Fruit Preserves & Jams (2 products)
  {
    name: "Kolli Fruit Preserves & Jams",
    slug: "kolli-fruit-preserves-jams",
    description: "Delicious spreads cooked with wild forest berries and mountain slope jackfruit.",
    icon: CATEGORY_LOGOS[3],
    products: [
      {
        name: "Kolli Mountain Jackfruit Preserve (Pala Pazham)",
        slug: "kolli-mountain-jackfruit-preserve",
        desc: "Slow-cooked sweet jackfruit pulp and pure honey with cardamom fragrance.",
        basePrice: 180,
        variants: [
          { name: "Honey Jackfruit Preserve Jar", slug: "jackfruit-preserve-jar", unit: "g", unitVal: 350, price: 180, sku: "FRT-JCK-350G" },
          { name: "Family Pack Jackfruit Halwa Spread", slug: "jackfruit-halwa-spread", unit: "g", unitVal: 700, price: 340, sku: "FRT-JCK-700G" },
        ]
      },
      {
        name: "Wild Hill Guava & Berry Jam",
        slug: "wild-hill-guava-berry-jam",
        desc: "Naturally pectin-rich pink hill guava cooked with country palm sugar.",
        basePrice: 160,
        variants: [
          { name: "Pink Guava Jam Spread", slug: "guava-jam-spread", unit: "g", unitVal: 350, price: 160, sku: "FRT-GVA-350G" },
          { name: "Rustic Chunky Fruit Preserve", slug: "guava-chunky-preserve", unit: "g", unitVal: 500, price: 220, sku: "FRT-GVA-500G" },
        ]
      }
    ]
  },

  // 17. Heritage Seed & Native Pulses (2 products)
  {
    name: "Heritage Seed & Native Pulses",
    slug: "heritage-seed-native-pulses",
    description: "Non-hybrid native legumes and pulses packed with unadulterated plant proteins.",
    icon: CATEGORY_LOGOS[4],
    products: [
      {
        name: "Native Black Urad Dal (Karuppu Ulundhu)",
        slug: "native-black-urad-dal",
        desc: "Whole unpolished black gram with skin, vital for idli fluffy batter and bone strength.",
        basePrice: 160,
        variants: [
          { name: "Whole Black Gram with Skin", slug: "black-urad-whole", unit: "kg", unitVal: 1, price: 160, sku: "PLS-URD-1KG" },
          { name: "Split Black Gram Dal", slug: "black-urad-split", unit: "kg", unitVal: 1, price: 165, sku: "PLS-URD-SPL-1KG" },
        ]
      },
      {
        name: "Kollu (Horse Gram / Mudhirai)",
        slug: "kollu-horse-gram",
        desc: "Ancient power pulse known for metabolic activation and comforting winter soups.",
        basePrice: 110,
        variants: [
          { name: "Whole Brown Horse Gram", slug: "horse-gram-whole", unit: "kg", unitVal: 1, price: 110, sku: "PLS-KLL-1KG" },
          { name: "Sprouted Horse Gram Soup Powder", slug: "horse-gram-soup-powder", unit: "g", unitVal: 300, price: 95, sku: "PLS-KLL-PWD-300G" },
        ]
      }
    ]
  },

  // 18. Forest Essential Oils & Aromatics (2 products)
  {
    name: "Forest Essential Oils & Aromatics",
    slug: "forest-essential-oils-aromatics",
    description: "Steam-distilled 100% pure botanical essential oils straight from mountain stills.",
    icon: CATEGORY_LOGOS[5],
    products: [
      {
        name: "Kolli Nilgiri Eucalyptus Oil",
        slug: "kolli-nilgiri-eucalyptus-oil",
        desc: "Pure pungent cineole-rich oil steam-distilled from freshly pruned eucalyptus leaves.",
        basePrice: 210,
        variants: [
          { name: "Dropper Bottle Pure Eucalyptus", slug: "eucalyptus-oil-dropper", unit: "ml", unitVal: 60, price: 210, sku: "ESN-EUC-60ML" },
          { name: "Economy Bottle 120ml", slug: "eucalyptus-oil-economy", unit: "ml", unitVal: 120, price: 380, sku: "ESN-EUC-120ML" },
        ]
      },
      {
        name: "Wild Lemongrass Essential Aroma Oil",
        slug: "wild-lemongrass-essential-oil",
        desc: "Refreshing natural mood elevator and potent plant-based room purifier.",
        basePrice: 240,
        variants: [
          { name: "Diffuser Grade Lemongrass 30ml", slug: "lemongrass-oil-diffuser", unit: "ml", unitVal: 30, price: 240, sku: "ESN-LMG-30ML" },
          { name: "Aromatherapy Bottle 100ml", slug: "lemongrass-oil-aromatherapy", unit: "ml", unitVal: 100, price: 580, sku: "ESN-LMG-100ML" },
        ]
      }
    ]
  },

  // 19. Herbal Bath & Natural Skin Care (2 products)
  {
    name: "Herbal Bath & Natural Skin Care",
    slug: "herbal-bath-natural-skin-care",
    description: "Chemical-free traditional bath powders, nalangu maavu, and herbal soap bars.",
    icon: CATEGORY_LOGOS[0],
    products: [
      {
        name: "Traditional Nalangu Maavu Bath Powder",
        slug: "traditional-nalangu-maavu",
        desc: "Aromatic 24-herb cleansing ubtan featuring wild turmeric, rose petals, and vetiver.",
        basePrice: 150,
        variants: [
          { name: "Nalangu Maavu Herbal Pouch", slug: "nalangu-maavu-pouch", unit: "g", unitVal: 250, price: 150, sku: "SKN-NLM-250G" },
          { name: "Family Pack Bath Powder 500g", slug: "nalangu-maavu-family-pack", unit: "g", unitVal: 500, price: 280, sku: "SKN-NLM-500G" },
        ]
      },
      {
        name: "Wild Vetiver (Vettiver) Root Bundle",
        slug: "wild-vetiver-root-bundle",
        desc: "Natural aromatic khus roots used as cooling bath scrub and soothing water infusion.",
        basePrice: 120,
        variants: [
          { name: "Natural Bath Loofah Bundle", slug: "vetiver-bath-loofah", unit: "pcs", unitVal: 1, price: 120, sku: "SKN-VTR-1PCS" },
          { name: "Twin Loofah Scrub Pack", slug: "vetiver-twin-loofah", unit: "pcs", unitVal: 2, price: 220, sku: "SKN-VTR-2PCS" },
        ]
      }
    ]
  },

  // 20. Traditional Clay & Stone Cookware (2 products)
  {
    name: "Traditional Clay & Stone Cookware",
    slug: "traditional-clay-stone-cookware",
    description: "Handcrafted natural red clay pots and kalchatti soapstone vessels for slow nutrition.",
    icon: CATEGORY_LOGOS[1],
    products: [
      {
        name: "Kolli Terracotta Deep Cooking Pot with Lid",
        slug: "kolli-terracotta-cooking-pot",
        desc: "Pre-seasoned earthenware pot ideal for aromatic fish curry, rasam, and slow clay pot rice.",
        basePrice: 380,
        variants: [
          { name: "Medium 2-Litre Clay Handi", slug: "clay-pot-2-litre", unit: "pcs", unitVal: 1, price: 380, sku: "CKW-CLY-2L" },
          { name: "Large 3.5-Litre Clay Handi", slug: "clay-pot-large", unit: "pcs", unitVal: 1, price: 540, sku: "CKW-CLY-3.5L" },
        ]
      },
      {
        name: "Traditional Kalchatti (Soapstone Cookware)",
        slug: "traditional-kalchatti-soapstone",
        desc: "Hand-carved soft soapstone vessel that retains heat for hours and enhances stew flavor.",
        basePrice: 850,
        variants: [
          { name: "Seasoned 1.5-Litre Soapstone Pot", slug: "kalchatti-medium", unit: "pcs", unitVal: 1, price: 850, sku: "CKW-KST-1.5L" },
          { name: "Heavy Gourmet 2.5-Litre Soapstone", slug: "kalchatti-large-gourmet", unit: "pcs", unitVal: 1, price: 1450, sku: "CKW-KST-2.5L" },
        ]
      }
    ]
  }
];

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured in .env');
  }

  const url = new URL(databaseUrl);
  const conn = await mariadb.createConnection({
    host: url.hostname || 'localhost',
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username || 'root'),
    password: decodeURIComponent(url.password || ''),
    database: url.pathname.slice(1) || 'kollimalai',
    allowPublicKeyRetrieval: true,
  });

  console.log('✅ Connected to MariaDB/MySQL successfully.');

  // 1. Get or create Brand
  let [brands] = await conn.query("SELECT id, name FROM product_brands WHERE slug = 'kollimalai-arasan' LIMIT 1");
  let brandId;
  if (!brands) {
    const res = await conn.query(
      `INSERT INTO product_brands (uuid, name, slug, description, is_active, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, 1, 1, NOW(), NOW())`,
      [crypto.randomUUID(), 'Kollimalai Arasan', 'kollimalai-arasan', 'Premium spices, rice, and natural products from Kolli Hills']
    );
    brandId = res.insertId;
  } else {
    brandId = brands.id;
  }
  console.log(`✓ Using Brand ID: ${brandId}`);

  // 2. Map Units
  const units = await conn.query("SELECT id, code FROM product_units");
  const unitMap = new Map();
  for (const u of units) {
    unitMap.set(u.code, u.id);
  }
  console.log('✓ Available units:', Array.from(unitMap.keys()));

  // 3. Clean existing catalog safely
  console.log('\n🧹 Cleaning previous catalog tables...');
  await conn.query("DELETE FROM cart_items");
  await conn.query("DELETE FROM wishlist_items");
  await conn.query("DELETE FROM order_items");
  await conn.query("DELETE FROM inventories");
  await conn.query("DELETE FROM variant_unit_prices");
  await conn.query("DELETE FROM product_variant_images");
  await conn.query("DELETE FROM product_variants");
  await conn.query("DELETE FROM product_images");
  await conn.query("DELETE FROM products");
  await conn.query("DELETE FROM product_categories");
  console.log('✓ Old catalog cleared.');

  // 4. Seed Categories, Products, Variants, Unit Prices, and Inventories
  let catCount = 0;
  let prodCount = 0;
  let varCount = 0;
  let priceCount = 0;

  for (let cIdx = 0; cIdx < MOCK_DATA.length; cIdx++) {
    const cat = MOCK_DATA[cIdx];
    const catUuid = crypto.randomUUID();
    const catRes = await conn.query(
      `INSERT INTO product_categories (uuid, name, slug, description, icon, is_active, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, 1, NOW(), NOW())`,
      [catUuid, cat.name, cat.slug, cat.description, cat.icon]
    );
    const categoryId = catRes.insertId;
    catCount++;

    for (let pIdx = 0; pIdx < cat.products.length; pIdx++) {
      const prod = cat.products[pIdx];
      const prodUuid = crypto.randomUUID();
      const imgIdx = (prodCount) % IMAGES.length;
      const primaryImg = IMAGES[imgIdx];

      const prodRes = await conn.query(
        `INSERT INTO products (uuid, name, slug, category_id, brand_id, base_price, is_active, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())`,
        [prodUuid, prod.name, prod.slug, categoryId, brandId, prod.basePrice]
      );
      const productId = prodRes.insertId;
      prodCount++;

      // Primary Product Image
      await conn.query(
        `INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order, is_active, created_at, updated_at)
         VALUES (?, ?, ?, 1, 1, 1, NOW(), NOW())`,
        [productId, primaryImg, prod.name]
      );

      // Variants
      for (let vIdx = 0; vIdx < prod.variants.length; vIdx++) {
        const v = prod.variants[vIdx];
        const varUuid = crypto.randomUUID();
        const varImgIdx = (varCount + 1) % IMAGES.length;
        const varImg = IMAGES[varImgIdx];
        const isDef = vIdx === 0 ? 1 : 0;

        const varRes = await conn.query(
          `INSERT INTO product_variants 
             (uuid, product_id, variant_name, slug, short_description, description, is_default, is_featured, is_active, out_of_stock, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 0, NOW(), NOW())`,
          [varUuid, productId, v.name, v.slug, prod.desc, prod.desc, isDef]
        );
        const variantId = varRes.insertId;
        varCount++;

        // Variant Image
        await conn.query(
          `INSERT INTO product_variant_images (uuid, variant_id, image_url, sort_order, is_primary, status, is_active, created_at, updated_at)
           VALUES (?, ?, ?, 1, 1, 1, 1, NOW(), NOW())`,
          [crypto.randomUUID(), variantId, varImg]
        );

        // Unit Price
        const unitId = unitMap.get(v.unit) || 1;
        const upRes = await conn.query(
          `INSERT INTO variant_unit_prices (uuid, variant_id, unit_id, unit_value, sku, base_price, is_default, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())`,
          [crypto.randomUUID(), variantId, unitId, v.unitVal, v.sku, v.price]
        );
        const unitPriceId = upRes.insertId;
        priceCount++;

        // Stock in Inventory
        await conn.query(
          `INSERT INTO inventories (variant_unit_price_id, quantity_available, quantity_reserved, reorder_level, warehouse_location, is_active, created_at, updated_at)
           VALUES (?, 180, 0, 15, 'Kolli Hills Main Depot', 1, NOW(), NOW())`,
          [unitPriceId]
        );
      }
    }
  }

  console.log('\n======================================================');
  console.log('🎉 Mock Data Generation Finished Successfully!');
  console.log(`   • Categories Created : ${catCount} (Expected: 20)`);
  console.log(`   • Products Created   : ${prodCount} (Expected: 50)`);
  console.log(`   • Variants Created   : ${varCount} (Expected: 100)`);
  console.log(`   • Unit Prices/Prices : ${priceCount}`);
  console.log(`   • Inventories Loaded : ${priceCount} (with 180 in stock each)`);
  await conn.end();

  console.log('🔄 Now seeding HSN Codes, GST Rates, and 20%, 30%, 18% Offers...');
  const { execSync } = require('child_process');
  execSync('node scripts/seed-offers-and-tax-details.cjs', { stdio: 'inherit' });
}

seed().catch((err) => {
  console.error('❌ Error executing mock seed:', err);
  process.exit(1);
});
