const mariadb = require("mariadb");
require("dotenv").config();

const CATALOG = [
  {
    name: "Black Pepper & Pepper Spices",
    slug: "black-pepper-pepper-spices",
    description: "Pure whole and ground black pepper harvested from Kolli Hills.",
    products: [
      {
        name: "Kolli Hills Black Pepper",
        slug: "kolli-hills-black-pepper",
        variants: [
          { name: "Black Pepper Whole", slug: "black-pepper-whole", packs: [{ value: 100, price: 120 }, { value: 250, price: 280 }] },
          { name: "Black Pepper Powder", slug: "black-pepper-powder", packs: [{ value: 100, price: 130 }, { value: 250, price: 300 }] },
        ],
      },
      {
        name: "Long Pepper (Thippili)",
        slug: "long-pepper-thippili",
        variants: [
          { name: "Thippili Whole", slug: "thippili-whole", packs: [{ value: 50, price: 90 }, { value: 100, price: 170 }] },
          { name: "Thippili Powder", slug: "thippili-powder", packs: [{ value: 50, price: 100 }, { value: 100, price: 185 }] },
        ],
      },
    ],
  },
  {
    name: "Cardamom & Aromatic Spices",
    slug: "cardamom-aromatic-spices",
    description: "Fragrant cardamom, cloves and aromatic spices from high-altitude Kolli Hills.",
    products: [
      {
        name: "Green Cardamom",
        slug: "green-cardamom",
        variants: [
          { name: "Cardamom Pods", slug: "cardamom-pods", packs: [{ value: 50, price: 180 }, { value: 100, price: 350 }] },
          { name: "Cardamom Powder", slug: "cardamom-powder", packs: [{ value: 50, price: 200 }, { value: 100, price: 380 }] },
        ],
      },
      {
        name: "Kolli Cloves (Kirambu)",
        slug: "kolli-cloves-kirambu",
        variants: [
          { name: "Cloves Whole", slug: "cloves-whole", packs: [{ value: 50, price: 150 }, { value: 100, price: 290 }] },
          { name: "Cloves Powder", slug: "cloves-powder", packs: [{ value: 50, price: 160 }, { value: 100, price: 305 }] },
        ],
      },
    ],
  },
  {
    name: "Turmeric & Root Spices",
    slug: "turmeric-root-spices",
    description: "Pure turmeric and root spices with high curcumin content from Kolli Hills.",
    products: [
      {
        name: "Kolli Hills Turmeric",
        slug: "kolli-hills-turmeric",
        variants: [
          { name: "Turmeric Whole", slug: "turmeric-whole", packs: [{ value: 100, price: 60 }, { value: 250, price: 140 }] },
          { name: "Turmeric Powder", slug: "turmeric-powder", packs: [{ value: 100, price: 70 }, { value: 250, price: 160 }] },
        ],
      },
      {
        name: "Dry Ginger (Sukku)",
        slug: "dry-ginger-sukku",
        variants: [
          { name: "Dry Ginger Whole", slug: "dry-ginger-whole", packs: [{ value: 100, price: 80 }, { value: 250, price: 185 }] },
          { name: "Dry Ginger Powder", slug: "dry-ginger-powder", packs: [{ value: 100, price: 90 }, { value: 250, price: 200 }] },
        ],
      },
    ],
  },
  {
    name: "Forest Honey & Kolli Specials",
    slug: "forest-honey-kolli-specials",
    description: "Wild raw honey collected by tribal families from Kolli Hills forests.",
    products: [
      {
        name: "Kolli Hills Wild Forest Honey",
        slug: "kolli-hills-wild-forest-honey",
        variants: [
          { name: "Forest Honey Raw", slug: "forest-honey-raw", packs: [{ value: 250, price: 350 }, { value: 500, price: 680 }] },
          { name: "Forest Honey Filtered", slug: "forest-honey-filtered", packs: [{ value: 250, price: 320 }, { value: 500, price: 620 }] },
        ],
      },
      {
        name: "Kolli Cinnamon (Pattai)",
        slug: "kolli-cinnamon-pattai",
        variants: [
          { name: "Cinnamon Sticks", slug: "cinnamon-sticks", packs: [{ value: 50, price: 110 }, { value: 100, price: 210 }] },
          { name: "Cinnamon Powder", slug: "cinnamon-powder", packs: [{ value: 50, price: 120 }, { value: 100, price: 225 }] },
        ],
      },
    ],
  },
  {
    name: "Native Rice Varieties",
    slug: "native-rice-varieties",
    description: "Traditional native rice varieties cultivated in the Kolli Hills highlands.",
    products: [
      {
        name: "Mappillai Samba Rice",
        slug: "mappillai-samba-rice",
        variants: [
          { name: "Mappillai Samba Raw", slug: "mappillai-samba-raw", packs: [{ value: 1000, price: 180 }, { value: 5000, price: 850 }] },
          { name: "Mappillai Samba Boiled", slug: "mappillai-samba-boiled", packs: [{ value: 1000, price: 190 }, { value: 5000, price: 900 }] },
        ],
      },
      {
        name: "Kolli Kaikuthal Rice",
        slug: "kolli-kaikuthal-rice",
        variants: [
          { name: "Kaikuthal Raw Rice", slug: "kaikuthal-raw-rice", packs: [{ value: 1000, price: 160 }, { value: 5000, price: 750 }] },
          { name: "Kaikuthal Boiled Rice", slug: "kaikuthal-boiled-rice", packs: [{ value: 1000, price: 170 }, { value: 5000, price: 790 }] },
        ],
      },
    ],
  },
  {
    name: "Spice Blends & Masalas",
    slug: "spice-blends-masalas",
    description: "Traditional Kolli Hills spice blends made from fresh harvested ingredients.",
    products: [
      {
        name: "Kolli Hills Garam Masala",
        slug: "kolli-hills-garam-masala",
        variants: [
          { name: "Garam Masala Coarse", slug: "garam-masala-coarse", packs: [{ value: 100, price: 95 }, { value: 200, price: 180 }] },
          { name: "Garam Masala Fine", slug: "garam-masala-fine", packs: [{ value: 100, price: 100 }, { value: 200, price: 190 }] },
        ],
      },
      {
        name: "Rasam Powder (Traditional)",
        slug: "rasam-powder-traditional",
        variants: [
          { name: "Rasam Powder Light", slug: "rasam-powder-light", packs: [{ value: 100, price: 75 }, { value: 200, price: 140 }] },
          { name: "Rasam Powder Spicy", slug: "rasam-powder-spicy", packs: [{ value: 100, price: 80 }, { value: 200, price: 150 }] },
        ],
      },
    ],
  },
];

async function seed() {
  const url = new URL(process.env.DATABASE_URL);
  const host = url.hostname === "localhost" ? "127.0.0.1" : url.hostname;
  const conn = await mariadb.createConnection({
    host, port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    allowPublicKeyRetrieval: true,
  });
  try {
    const units = await conn.query("SELECT id, name, code FROM product_units LIMIT 10");
    if (!units.length) throw new Error("No product_units found.");
    const gramUnit = units.find(u => u.code && u.code.toLowerCase() === "g") || units[0];
    console.log("Using unit: " + gramUnit.name + " (id=" + gramUnit.id + ")\n");
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");
    let catCount=0, prodCount=0, varCount=0, packCount=0;
    for (const cat of CATALOG) {
      const catResult = await conn.query(
        "INSERT INTO product_categories (uuid, name, slug, description, is_active, sort_order, created_at, updated_at) VALUES (UUID(), ?, ?, ?, 1, 0, NOW(), NOW())",
        [cat.name, cat.slug, cat.description]
      );
      const catId = catResult.insertId; catCount++;
      console.log("Category [" + catId + "]: " + cat.name);
      for (const prod of cat.products) {
        const prodResult = await conn.query(
          "INSERT INTO products (uuid, category_id, name, slug, base_price, is_active, created_at, updated_at) VALUES (UUID(), ?, ?, ?, 0, 1, NOW(), NOW())",
          [catId, prod.name, prod.slug]
        );
        const prodId = prodResult.insertId; prodCount++;
        console.log("  Product [" + prodId + "]: " + prod.name);
        for (let vi = 0; vi < prod.variants.length; vi++) {
          const v = prod.variants[vi];
          const varResult = await conn.query(
            "INSERT INTO product_variants (uuid, product_id, variant_name, slug, is_default, is_active, out_of_stock, created_at, updated_at) VALUES (UUID(), ?, ?, ?, ?, 1, 0, NOW(), NOW())",
            [prodId, v.name, v.slug, vi === 0 ? 1 : 0]
          );
          const varId = varResult.insertId; varCount++;
          console.log("    Variant [" + varId + "]: " + v.name);
          for (let pi = 0; pi < v.packs.length; pi++) {
            const pack = v.packs[pi];
            const sku = "KA-" + String(prodId) + "-" + String(varId) + "-" + String(pack.value);
            await conn.query(
              "INSERT INTO variant_unit_prices (uuid, variant_id, unit_id, unit_value, sku, base_price, is_default, is_active, created_at, updated_at) VALUES (UUID(), ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())",
              [varId, gramUnit.id, pack.value, sku, pack.price, pi === 0 ? 1 : 0]
            );
            packCount++;
            console.log("      Pack: " + pack.value + "g @ Rs." + pack.price);
          }
        }
      }
      console.log("");
    }
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log("=================================================");
    console.log("SEED COMPLETE");
    console.log("Categories : " + catCount);
    console.log("Products   : " + prodCount);
    console.log("Variants   : " + varCount);
    console.log("Pack sizes : " + packCount);
    console.log("Images     : 0 (fallback -> kolli_spices_hero.jpg)");
    console.log("=================================================");
  } finally {
    await conn.end();
  }
}
seed().catch(err => { console.error("Seed error:", err.message); process.exit(1); });

