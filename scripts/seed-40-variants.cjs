const mariadb = require("mariadb");
const crypto = require("crypto");
require("dotenv").config();

async function main() {
  console.log("============================================================");
  console.log("🌿 Seeding 40 Authentic Kolli Hills Product Variants");
  console.log("============================================================\n");

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

    // 1. Get admin user id
    const adminUsers = await conn.query(
      "SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'ADMIN' LIMIT 1) LIMIT 1"
    );
    const adminId = adminUsers.length > 0 ? adminUsers[0].id : 3n;

    // 2. Get or create brand
    let [brand] = await conn.query("SELECT id FROM product_brands WHERE slug = 'kollimalai-arasan' LIMIT 1");
    if (!brand) {
      const bRes = await conn.query(
        "INSERT INTO product_brands (uuid, name, slug, description, status, is_active, created_at, updated_at, created_by) VALUES (UUID(), 'Kollimalai Arasan', 'kollimalai-arasan', 'Heritage food from Kolli Hills', 1, 1, NOW(), NOW(), ?)",
        [adminId]
      );
      brand = { id: bRes.insertId };
    }
    const brandId = brand.id;

    // 3. Units map
    const unitsList = await conn.query("SELECT id, code FROM product_units");
    const unitsMap = {};
    for (const u of unitsList) {
      unitsMap[u.code] = u.id;
    }

    // 4. Categories list
    const categoriesData = [
      { name: "Spices & Seasonings", slug: "spices-seasonings", desc: "Aromatic mountain spices grown in Kolli Hills rich organic soil." },
      { name: "Forest Honey & Sweeteners", slug: "forest-honey-sweeteners", desc: "Pure unprocessed wild forest honey and traditional unrefined palm sugars." },
      { name: "Cold-Pressed Traditional Oils", slug: "cold-pressed-oils", desc: "Pure wood-pressed oils extracted using traditional stone & wooden vaagai chekku." },
      { name: "Traditional Millets & Grains", slug: "traditional-millets", desc: "Ancient nutrient-dense native Tamil Nadu millets directly from farmers." },
      { name: "Herbal & Wellness Powders", slug: "herbal-wellness", desc: "Pure herbal powders and immunity formulations prepared from wild herbs." },
      { name: "Traditional Snacks & Sweets", slug: "traditional-snacks", desc: "Crispy snacks and authentic sweets handmade with pure cold-pressed oil and palm jaggery." },
    ];

    const categoryMap = {};
    for (const cat of categoriesData) {
      let [c] = await conn.query("SELECT id FROM product_categories WHERE slug = ?", [cat.slug]);
      if (!c) {
        const cRes = await conn.query(
          "INSERT INTO product_categories (uuid, name, slug, description, status, is_active, created_at, updated_at, created_by) VALUES (UUID(), ?, ?, ?, 1, 1, NOW(), NOW(), ?)",
          [cat.name, cat.slug, cat.desc, adminId]
        );
        c = { id: cRes.insertId };
      }
      categoryMap[cat.slug] = c.id;
    }
    console.log("✓ Categories verified");

    // 5. 40 Variants Data organized under 10 Products
    const productsData = [
      // Product 1
      {
        name: "Kolli Hills Black Pepper",
        slug: "kolli-hills-black-pepper",
        categorySlug: "spices-seasonings",
        basePrice: 240,
        variants: [
          {
            name: "Whole Black Pepper (Grade A)",
            slug: "whole-black-pepper-grade-a",
            sku: "KMA-WBP-250G",
            unitCode: "g",
            unitValue: 250,
            price: 240,
            stock: 45,
            isFeatured: 1,
            desc: "Pure sun-dried whole black pepper handpicked from high-altitude Kolli Hills plantations. Bold, sharp aroma with high piperine content.",
          },
          {
            name: "Coarse Ground Black Pepper",
            slug: "coarse-ground-black-pepper",
            sku: "KMA-CBP-100G",
            unitCode: "g",
            unitValue: 100,
            price: 110,
            stock: 30,
            isFeatured: 0,
            desc: "Freshly crushed bold peppercorns perfect for seasoning steaks, soups, eggs, and traditional South Indian rasam.",
          },
          {
            name: "Tellicherry Style Bold Peppercorns",
            slug: "tellicherry-style-bold-peppercorns",
            sku: "KMA-TBP-500G",
            unitCode: "g",
            unitValue: 500,
            price: 460,
            stock: 0, // Out of Stock demonstration
            isFeatured: 1,
            desc: "Extra-large hand-graded peppercorns with complex fruity notes and intense lingering heat.",
          },
          {
            name: "White Peppercorns Premium",
            slug: "white-peppercorns-premium",
            sku: "KMA-WHP-100G",
            unitCode: "g",
            unitValue: 100,
            price: 160,
            stock: 15,
            isFeatured: 0,
            desc: "Fully ripened berries with outer husk removed. Offers a milder, earthy heat ideal for white sauces and clear broths.",
          },
        ],
      },

      // Product 2
      {
        name: "Kolli Hills Green Cardamom",
        slug: "kolli-hills-green-cardamom",
        categorySlug: "spices-seasonings",
        basePrice: 380,
        variants: [
          {
            name: "Bold Green Cardamom (8mm+)",
            slug: "bold-green-cardamom-8mm",
            sku: "KMA-CD8-100G",
            unitCode: "g",
            unitValue: 100,
            price: 380,
            stock: 25,
            isFeatured: 1,
            desc: "Jumbo-sized 8mm+ emerald green cardamom pods packed with sweet, aromatic essential oils.",
          },
          {
            name: "Whole Green Cardamom (7mm Standard)",
            slug: "whole-green-cardamom-7mm",
            sku: "KMA-CD7-100G",
            unitCode: "g",
            unitValue: 100,
            price: 320,
            stock: 3, // Low stock demonstration
            isFeatured: 0,
            desc: "Handpicked 7mm medium pods ideal for daily tea, biryani, and festive sweet preparations.",
          },
          {
            name: "Cardamom Seeds Powder (Elachi Podi)",
            slug: "cardamom-seeds-powder-elachi",
            sku: "KMA-CDP-50G",
            unitCode: "g",
            unitValue: 50,
            price: 210,
            stock: 18,
            isFeatured: 0,
            desc: "Pure ground inner black seeds without husks. Ready to use for instant aroma in kheer, payasam, and chai.",
          },
        ],
      },

      // Product 3
      {
        name: "Mountain Organic Clove",
        slug: "mountain-organic-clove",
        categorySlug: "spices-seasonings",
        basePrice: 175,
        variants: [
          {
            name: "Handpicked Whole Cloves (Laung)",
            slug: "handpicked-whole-cloves",
            sku: "KMA-CLV-100G",
            unitCode: "g",
            unitValue: 100,
            price: 175,
            stock: 35,
            isFeatured: 0,
            desc: "Intensely fragrant unopened flower buds with unbroken heads. Rich in eugenol with natural therapeutic properties.",
          },
          {
            name: "Aromatic Clove Powder",
            slug: "aromatic-clove-powder",
            sku: "KMA-CLP-50G",
            unitCode: "g",
            unitValue: 50,
            price: 95,
            stock: 20,
            isFeatured: 0,
            desc: "Slow-stone ground cloves retaining precious volatile oils. Warm, sweet-peppery flavor for baking and curries.",
          },
        ],
      },

      // Product 4
      {
        name: "Native Kolli Turmeric",
        slug: "native-kolli-turmeric",
        categorySlug: "spices-seasonings",
        basePrice: 120,
        variants: [
          {
            name: "Curcumin Rich Turmeric Powder",
            slug: "curcumin-rich-turmeric-powder",
            sku: "KMA-TUR-250G",
            unitCode: "g",
            unitValue: 250,
            price: 120,
            stock: 60,
            isFeatured: 1,
            desc: "Organically cultivated turmeric with 5%+ natural curcumin. Vibrant golden yellow hue and earthy aroma.",
          },
          {
            name: "Sun-Dried Salem Turmeric Fingers",
            slug: "sun-dried-salem-turmeric-fingers",
            sku: "KMA-TRF-500G",
            unitCode: "g",
            unitValue: 500,
            price: 190,
            stock: 0, // Out of Stock
            isFeatured: 0,
            desc: "Whole unpolished hard turmeric rhizomes dried naturally under the sun. High medicinal and therapeutic value.",
          },
          {
            name: "Wild Kasturi Manjal (Aromatic)",
            slug: "wild-kasturi-manjal-aromatic",
            sku: "KMA-KAS-100G",
            unitCode: "g",
            unitValue: 100,
            price: 140,
            stock: 4, // Low stock
            isFeatured: 0,
            desc: "Wild forest turmeric prized for skin glow, non-staining natural face packs, and holistic wellness.",
          },
        ],
      },

      // Product 5
      {
        name: "Wild Forest Honey",
        slug: "wild-forest-honey",
        categorySlug: "forest-honey-sweeteners",
        basePrice: 420,
        variants: [
          {
            name: "Raw Multi-Flora Forest Honey",
            slug: "raw-multi-flora-forest-honey",
            sku: "KMA-HNY-500G",
            unitCode: "g",
            unitValue: 500,
            price: 420,
            stock: 40,
            isFeatured: 1,
            desc: "Unpasteurized, unfiltered honey collected by tribal foragers from dense wild medicinal blooms across Kolli Hills.",
          },
          {
            name: "Stingless Bee Honey (Kombu Thaen)",
            slug: "stingless-bee-honey-kombu-thaen",
            sku: "KMA-SBH-250G",
            unitCode: "g",
            unitValue: 250,
            price: 580,
            stock: 12,
            isFeatured: 1,
            desc: "Extremely rare dammer bee honey with distinct tangy notes. Known in Siddha & Ayurveda for therapeutic potency.",
          },
          {
            name: "Neem Blossom Wild Honey",
            slug: "neem-blossom-wild-honey",
            sku: "KMA-NBH-500G",
            unitCode: "g",
            unitValue: 500,
            price: 450,
            stock: 2, // Low stock
            isFeatured: 0,
            desc: "Single-origin seasonal honey harvested during summer neem flowering. Warm herbal aroma and gentle sweetness.",
          },
          {
            name: "Rock Bee Cliff Honey (Malai Thaen)",
            slug: "rock-bee-cliff-honey-malai-thaen",
            sku: "KMA-RBH-1KG",
            unitCode: "kg",
            unitValue: 1,
            price: 790,
            stock: 22,
            isFeatured: 0,
            desc: "Pure raw honey harvested from natural rock cliffs. Dense amber texture loaded with live enzymes and bee pollen.",
          },
        ],
      },

      // Product 6
      {
        name: "Traditional Palm Jaggery & Sugars",
        slug: "traditional-palm-jaggery-sugars",
        categorySlug: "forest-honey-sweeteners",
        basePrice: 210,
        variants: [
          {
            name: "Pure Udangudi Palm Jaggery (Karupatti)",
            slug: "pure-udangudi-palm-jaggery-karupatti",
            sku: "KMA-KAR-500G",
            unitCode: "g",
            unitValue: 500,
            price: 210,
            stock: 50,
            isFeatured: 1,
            desc: "Authentic wood-fired palm nectar jaggery without chemical additives. Rich in iron, magnesium, and deep caramel notes.",
          },
          {
            name: "Country Brown Cane Sugar (Nattu Sakkarai)",
            slug: "country-brown-cane-sugar-nattu-sakkarai",
            sku: "KMA-NSK-1KG",
            unitCode: "kg",
            unitValue: 1,
            price: 110,
            stock: 65,
            isFeatured: 0,
            desc: "Chemical-free unrefined cane sugar. Perfect healthy substitute for refined white sugar in coffee, tea, and baking.",
          },
          {
            name: "Palm Sugar Candy (Panakarkandu)",
            slug: "palm-sugar-candy-panakarkandu",
            sku: "KMA-PKK-250G",
            unitCode: "g",
            unitValue: 250,
            price: 180,
            stock: 0, // Out of stock
            isFeatured: 0,
            desc: "Natural crystalline palm sugar candy soothing for dry cough, throat irritation, and paired with warm pepper milk.",
          },
        ],
      },

      // Product 7
      {
        name: "Wood-Pressed Heritage Oils",
        slug: "wood-pressed-heritage-oils",
        categorySlug: "cold-pressed-oils",
        basePrice: 440,
        variants: [
          {
            name: "Chekku Sesame Oil (Nallennai)",
            slug: "chekku-sesame-oil-nallennai",
            sku: "KMA-OIL-SES-1L",
            unitCode: "L",
            unitValue: 1,
            price: 440,
            stock: 30,
            isFeatured: 1,
            desc: "Cold wood-pressed black sesame oil blended with pure palm jaggery during crushing. Traditional nutty aroma.",
          },
          {
            name: "Cold-Pressed Groundnut Oil (Kadalai Ennai)",
            slug: "cold-pressed-groundnut-oil-kadalai-ennai",
            sku: "KMA-OIL-GND-1L",
            unitCode: "L",
            unitValue: 1,
            price: 290,
            stock: 45,
            isFeatured: 0,
            desc: "Wood-pressed native country peanuts. High smoke point and full authentic flavor for daily curries and deep frying.",
          },
          {
            name: "Virgin Coconut Oil (Thengai Ennai)",
            slug: "virgin-coconut-oil-thengai-ennai",
            sku: "KMA-OIL-COC-500M",
            unitCode: "ml",
            unitValue: 500,
            price: 220,
            stock: 28,
            isFeatured: 0,
            desc: "Cold-pressed from fresh sun-dried copra coconuts. 100% pure, fragrant, and excellent for hair, skin, and cooking.",
          },
          {
            name: "Traditional Deepam Pooja Oil (5-Oil Blend)",
            slug: "traditional-deepam-pooja-oil",
            sku: "KMA-OIL-DEP-1L",
            unitCode: "L",
            unitValue: 1,
            price: 210,
            stock: 55,
            isFeatured: 0,
            desc: "Divine Pancha Deepam oil blend of Sesame, Mahua, Castor, Neem, and Pure Ghee. Long burning with pleasant fragrance.",
          },
          {
            name: "Pure Castor Oil (Vilakkennai)",
            slug: "pure-castor-oil-vilakkennai",
            sku: "KMA-OIL-CAS-250M",
            unitCode: "ml",
            unitValue: 250,
            price: 130,
            stock: 3, // Low stock
            isFeatured: 0,
            desc: "Cold-pressed viscous castor oil for body cooling, healthy thick hair growth, and traditional digestive relief.",
          },
        ],
      },

      // Product 8
      {
        name: "Unpolished Organic Millets",
        slug: "unpolished-organic-millets",
        categorySlug: "traditional-millets",
        basePrice: 130,
        variants: [
          {
            name: "Foxtail Millet / Thinai (Unpolished)",
            slug: "foxtail-millet-thinai-unpolished",
            sku: "KMA-MLT-THN-1KG",
            unitCode: "kg",
            unitValue: 1,
            price: 130,
            stock: 40,
            isFeatured: 1,
            desc: "Rich in fiber and low glycemic index ancient grain. Great for diabetic diets, millet pongal, and nutritious idlis.",
          },
          {
            name: "Little Millet / Samai (Unpolished)",
            slug: "little-millet-samai-unpolished",
            sku: "KMA-MLT-SAM-1KG",
            unitCode: "kg",
            unitValue: 1,
            price: 140,
            stock: 35,
            isFeatured: 0,
            desc: "Smallest indigenous grain with high iron content. Cooks fast like white rice and pairs delightfully with sambar.",
          },
          {
            name: "Kodo Millet / Varagu (Unpolished)",
            slug: "kodo-millet-varagu-unpolished",
            sku: "KMA-MLT-VAR-1KG",
            unitCode: "kg",
            unitValue: 1,
            price: 135,
            stock: 0, // Out of stock
            isFeatured: 0,
            desc: "Gluten-free traditional grain rich in lecithin and dietary antioxidants for cellular health.",
          },
          {
            name: "Barnyard Millet / Kuthiraivali",
            slug: "barnyard-millet-kuthiraivali",
            sku: "KMA-MLT-KUT-1KG",
            unitCode: "kg",
            unitValue: 1,
            price: 145,
            stock: 25,
            isFeatured: 0,
            desc: "High digestible protein and digestible fiber. Extremely popular for traditional upma and healthy khichdi.",
          },
          {
            name: "Finger Millet / Ragi Whole Grain",
            slug: "finger-millet-ragi-whole-grain",
            sku: "KMA-MLT-RAG-1KG",
            unitCode: "kg",
            unitValue: 1,
            price: 85,
            stock: 70,
            isFeatured: 0,
            desc: "Highest natural calcium source among all cereals. Perfect for sprouting, baby food porridges, and ragi kali.",
          },
        ],
      },

      // Product 9
      {
        name: "Kolli Native Herbal Formulations",
        slug: "kolli-native-herbal-formulations",
        categorySlug: "herbal-wellness",
        basePrice: 140,
        variants: [
          {
            name: "Authentic Sukku Coffee Powder (Spiced)",
            slug: "authentic-sukku-coffee-powder-spiced",
            sku: "KMA-SKC-200G",
            unitCode: "g",
            unitValue: 200,
            price: 140,
            stock: 50,
            isFeatured: 1,
            desc: "Traditional winter herbal drink made with dried ginger, black pepper, coriander seeds, thulsi, and ashwagandha.",
          },
          {
            name: "Traditional Triphala Churna",
            slug: "traditional-triphala-churna",
            sku: "KMA-TRI-100G",
            unitCode: "g",
            unitValue: 100,
            price: 95,
            stock: 32,
            isFeatured: 0,
            desc: "Classic Ayurvedic blend of Amla, Haritaki, and Bibhitaki for gentle gut detoxification and internal cleansing.",
          },
          {
            name: "Organic Moringa Leaf Powder",
            slug: "organic-moringa-leaf-powder",
            sku: "KMA-MOR-100G",
            unitCode: "g",
            unitValue: 100,
            price: 110,
            stock: 4, // Low stock
            isFeatured: 0,
            desc: "Shade-dried drumstick leaves ground into potent green powder. Natural superfood bursting with vitamins and protein.",
          },
          {
            name: "Nilavembu Kudineer Chooranam",
            slug: "nilavembu-kudineer-chooranam",
            sku: "KMA-NIL-100G",
            unitCode: "g",
            unitValue: 100,
            price: 80,
            stock: 60,
            isFeatured: 0,
            desc: "Traditional Siddha antiviral fever decoction blend with 9 therapeutic mountain herbs.",
          },
          {
            name: "Amla (Nelli) Vitamin-C Powder",
            slug: "amla-nelli-vitamin-c-powder",
            sku: "KMA-AML-100G",
            unitCode: "g",
            unitValue: 100,
            price: 125,
            stock: 0, // Out of stock
            isFeatured: 0,
            desc: "Dehydrated wild Indian gooseberry pulp ground fine for daily immunity boosters and hair masks.",
          },
          {
            name: "Ashwagandha Root Powder (Amukkara)",
            slug: "ashwagandha-root-powder-amukkara",
            sku: "KMA-ASH-100G",
            unitCode: "g",
            unitValue: 100,
            price: 165,
            stock: 20,
            isFeatured: 0,
            desc: "Pure Indian ginseng root powder. Relieves stress, improves sleep quality, and restores vitality.",
          },
        ],
      },

      // Product 10
      {
        name: "Kolli Heritage Snacks & Sweets",
        slug: "kolli-heritage-snacks-sweets",
        categorySlug: "traditional-snacks",
        basePrice: 95,
        variants: [
          {
            name: "Kolli Hill Spiced Millet Mixture",
            slug: "kolli-hill-spiced-millet-mixture",
            sku: "KMA-SNK-MIX-200G",
            unitCode: "g",
            unitValue: 200,
            price: 95,
            stock: 40,
            isFeatured: 1,
            desc: "Crispy savory snack prepared with thinai, ragi, roasted curry leaves, and country peanuts in cold-pressed oil.",
          },
          {
            name: "Traditional Karupatti Athirasam",
            slug: "traditional-karupatti-athirasam",
            sku: "KMA-SNK-ATH-500G",
            unitCode: "g",
            unitValue: 500,
            price: 240,
            stock: 15,
            isFeatured: 1,
            desc: "Authentic festival sweet made from aged rice flour and natural palm jaggery, gently deep fried in pure ghee.",
          },
          {
            name: "Roasted Garlic Pepper Cashews",
            slug: "roasted-garlic-pepper-cashews",
            sku: "KMA-SNK-CAS-200G",
            unitCode: "g",
            unitValue: 200,
            price: 290,
            stock: 1, // Low stock
            isFeatured: 0,
            desc: "Whole cashew nuts slow roasted and tossed with Kolli Hills black pepper and mountain hill garlic.",
          },
          {
            name: "Sesame Palm Jaggery Balls (Ellu Urundai)",
            slug: "sesame-palm-jaggery-balls-ellu",
            sku: "KMA-SNK-ELL-250G",
            unitCode: "g",
            unitValue: 250,
            price: 120,
            stock: 0, // Out of stock
            isFeatured: 0,
            desc: "Nutritious calcium-dense traditional snack prepared with roasted sesame seeds and gooey palm karupatti.",
          },
          {
            name: "Handmade Ragi Ribbon Murukku",
            slug: "handmade-ragi-ribbon-murukku",
            sku: "KMA-SNK-MUR-200G",
            unitCode: "g",
            unitValue: 200,
            price: 85,
            stock: 55,
            isFeatured: 0,
            desc: "Crunchy tea-time ribbon murukku crafted from fresh finger millet flour and flavored with crushed ajwain & cumin.",
          },
        ],
      },
    ];

    const defaultImage = "/document/variants/e8a5a833-753e-4f6a-996c-3986cd4502d6.webp";
    let totalVariantsSeeded = 0;

    for (const pData of productsData) {
      const catId = categoryMap[pData.categorySlug];

      // Upsert Product
      let [product] = await conn.query("SELECT id FROM products WHERE slug = ?", [pData.slug]);
      if (!product) {
        const prodSku = "PRD-" + pData.slug.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12).toUpperCase();
        const pRes = await conn.query(
          "INSERT INTO products (uuid, category_id, brand_id, name, slug, sku, base_price, is_active, status, created_at, updated_at, created_by) VALUES (UUID(), ?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW(), ?)",
          [catId, brandId, pData.name, pData.slug, prodSku, pData.basePrice, adminId]
        );
        product = { id: pRes.insertId };
      } else {
        await conn.query("UPDATE products SET is_active = 1, deleted_at = NULL WHERE id = ?", [product.id]);
      }

      // Create each Variant
      for (const vData of pData.variants) {
        const isOutOfStock = vData.stock === 0 ? 1 : 0;

        let [variant] = await conn.query("SELECT id FROM product_variants WHERE slug = ?", [vData.slug]);
        if (!variant) {
          const vRes = await conn.query(
            "INSERT INTO product_variants (uuid, product_id, variant_name, slug, short_description, description, is_featured, is_default, is_active, out_of_stock, created_at, updated_at, created_by) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, 1, ?, NOW(), NOW(), ?)",
            [
              product.id,
              vData.name,
              vData.slug,
              vData.desc.slice(0, 150),
              vData.desc,
              vData.isFeatured,
              vData.isFeatured ? 1 : 0,
              isOutOfStock,
              adminId,
            ]
          );
          variant = { id: vRes.insertId };
        } else {
          await conn.query(
            "UPDATE product_variants SET is_active = 1, out_of_stock = ?, deleted_at = NULL WHERE id = ?",
            [isOutOfStock, variant.id]
          );
        }

        // Add primary image if not exists
        const [existingImg] = await conn.query(
          "SELECT id FROM product_variant_images WHERE variant_id = ? LIMIT 1",
          [variant.id]
        );
        if (!existingImg) {
          await conn.query(
            "INSERT INTO product_variant_images (uuid, variant_id, image_url, sort_order, is_primary, is_active, status, created_at, updated_at, created_by) VALUES (UUID(), ?, ?, 1, 1, 1, 1, NOW(), NOW(), ?)",
            [variant.id, defaultImage, adminId]
          );
        }

        // Unit Price
        const unitId = unitsMap[vData.unitCode] || 1n;
        let [unitPrice] = await conn.query("SELECT id FROM variant_unit_prices WHERE sku = ?", [vData.sku]);
        if (!unitPrice) {
          const upRes = await conn.query(
            "INSERT INTO variant_unit_prices (uuid, variant_id, unit_id, unit_value, sku, base_price, is_default, is_active, created_at, updated_at, created_by) VALUES (UUID(), ?, ?, ?, ?, ?, 1, 1, NOW(), NOW(), ?)",
            [variant.id, unitId, vData.unitValue, vData.sku, vData.price, adminId]
          );
          unitPrice = { id: upRes.insertId };
        } else {
          await conn.query(
            "UPDATE variant_unit_prices SET is_active = 1, base_price = ?, deleted_at = NULL WHERE id = ?",
            [vData.price, unitPrice.id]
          );
        }

        // Warehouse Inventory
        let [inv] = await conn.query("SELECT id FROM inventories WHERE variant_unit_price_id = ?", [unitPrice.id]);
        if (!inv) {
          await conn.query(
            "INSERT INTO inventories (variant_unit_price_id, quantity_available, quantity_reserved, reorder_level, warehouse_location, is_active, created_at, updated_at, created_by) VALUES (?, ?, 0, 5, 'Kolli Hills Main Depot', 1, NOW(), NOW(), ?)",
            [unitPrice.id, vData.stock, adminId]
          );
        } else {
          await conn.query(
            "UPDATE inventories SET quantity_available = ?, reorder_level = 5, is_active = 1 WHERE id = ?",
            [vData.stock, inv.id]
          );
        }

        totalVariantsSeeded++;
        console.log(`  ✓ [${totalVariantsSeeded}/40] ${vData.name} | SKU: ${vData.sku} | Price: ₹${vData.price} | Stock: ${vData.stock} units`);
      }
    }

    console.log("\n============================================================");
    console.log(`🎉 Successfully seeded ${totalVariantsSeeded} authentic variants!`);
    console.log("============================================================\n");
  } catch (err) {
    console.error("❌ Seeding Error:", err);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();
