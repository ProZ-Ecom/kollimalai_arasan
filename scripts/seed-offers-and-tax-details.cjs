const mariadb = require('mariadb');
const crypto = require('crypto');
require('dotenv').config();

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is not set');

  const url = new URL(databaseUrl);
  const conn = await mariadb.createConnection({
    host: url.hostname || 'localhost',
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username || 'root'),
    password: decodeURIComponent(url.password || ''),
    database: url.pathname.slice(1) || 'kollimalai',
    allowPublicKeyRetrieval: true,
  });

  console.log('✅ Connected to database for HSN, GST, and Offer seeding.');

  // 1. Standard GST Rates
  console.log('\n--- Seeding GST Rates ---');
  const gstDefs = [
    { name: 'GST 0% (Exempt)', cgst: 0.0, sgst: 0.0, igst: 0.0 },
    { name: 'GST 5% (Spices & Food)', cgst: 2.5, sgst: 2.5, igst: 5.0 },
    { name: 'GST 12% (Ghee & Herbal Formulations)', cgst: 6.0, sgst: 6.0, igst: 12.0 },
    { name: 'GST 18% (Personal Care & Aromatic Oils)', cgst: 9.0, sgst: 9.0, igst: 18.0 },
  ];

  const gstMap = new Map();
  for (const g of gstDefs) {
    let [existing] = await conn.query('SELECT id, name FROM product_gst_rates WHERE name = ? LIMIT 1', [g.name]);
    let rateId;
    if (!existing) {
      const res = await conn.query(
        `INSERT INTO product_gst_rates (uuid, name, cgst_percent, sgst_percent, igst_percent, status, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 1, 1, NOW(), NOW())`,
        [crypto.randomUUID(), g.name, g.cgst, g.sgst, g.igst]
      );
      rateId = res.insertId;
      console.log(`✓ Created GST Rate: ${g.name} (id: ${rateId})`);
    } else {
      rateId = existing.id;
      console.log(`✓ Existing GST Rate: ${g.name} (id: ${rateId})`);
    }
    gstMap.set(g.name, rateId);
  }

  // 2. Standard HSN Codes
  console.log('\n--- Seeding HSN Codes ---');
  const hsnDefs = [
    { code: '0904', desc: 'Pepper (black, white, green) & Dried capsicum', gstKey: 'GST 5% (Spices & Food)' },
    { code: '0908', desc: 'Cardamom, Nutmeg, Mace', gstKey: 'GST 5% (Spices & Food)' },
    { code: '0907', desc: 'Cloves (whole fruit, cloves and stems)', gstKey: 'GST 5% (Spices & Food)' },
    { code: '0906', desc: 'Cinnamon and cinnamon-tree flowers', gstKey: 'GST 5% (Spices & Food)' },
    { code: '1006', desc: 'Traditional and indigenous unpolished rice', gstKey: 'GST 0% (Exempt)' },
    { code: '0409', desc: 'Natural mountain forest honey and bee products', gstKey: 'GST 5% (Spices & Food)' },
    { code: '1008', desc: 'Millets (Ragi, Thinai, Samai, Kodo) and other grains', gstKey: 'GST 0% (Exempt)' },
    { code: '1508', desc: 'Wood pressed groundnut oil and its fractions', gstKey: 'GST 5% (Spices & Food)' },
    { code: '1515', desc: 'Cold pressed sesame (gingelly) oil', gstKey: 'GST 5% (Spices & Food)' },
    { code: '1513', desc: 'Cold pressed virgin coconut oil', gstKey: 'GST 5% (Spices & Food)' },
    { code: '0902', desc: 'Herbal teas, mate, and hill infusions', gstKey: 'GST 5% (Spices & Food)' },
    { code: '0910', desc: 'Turmeric (curcumin), dry ginger, galangal rhizomes', gstKey: 'GST 5% (Spices & Food)' },
    { code: '2103', desc: 'Traditional sambar, rasam, and idli chutney powders', gstKey: 'GST 5% (Spices & Food)' },
    { code: '1701', desc: 'Natural palm jaggery (karupatti) and country cane sugar', gstKey: 'GST 5% (Spices & Food)' },
    { code: '0405', desc: 'Pure desi cow and mountain buffalo bilona ghee', gstKey: 'GST 12% (Ghee & Herbal Formulations)' },
    { code: '2001', desc: 'Traditional garlic and wild amla country thokku & pickles', gstKey: 'GST 12% (Ghee & Herbal Formulations)' },
    { code: '0801', desc: 'Forest raw cashew nuts and sun-dried figs', gstKey: 'GST 12% (Ghee & Herbal Formulations)' },
    { code: '3004', desc: 'Classical Siddha & Ayurvedic chooranams (Kabasura, Thirikadugu)', gstKey: 'GST 12% (Ghee & Herbal Formulations)' },
    { code: '2007', desc: 'Kolli mountain fruit preserves, spreads, and jams', gstKey: 'GST 12% (Ghee & Herbal Formulations)' },
    { code: '1209', desc: 'Heritage native pulses, black urad, horse gram seeds', gstKey: 'GST 0% (Exempt)' },
    { code: '3301', desc: 'Steam-distilled essential oils (Eucalyptus, Lemongrass)', gstKey: 'GST 18% (Personal Care & Aromatic Oils)' },
    { code: '3307', desc: 'Traditional Nalangu Maavu bath powders and vetiver loofah', gstKey: 'GST 18% (Personal Care & Aromatic Oils)' },
    { code: '6912', desc: 'Traditional terracotta cookware and soapstone kalchatti', gstKey: 'GST 12% (Ghee & Herbal Formulations)' },
  ];

  const hsnMap = new Map();
  for (const h of hsnDefs) {
    const gstRateId = gstMap.get(h.gstKey);
    let [existing] = await conn.query('SELECT id, code FROM product_hsn_codes WHERE code = ? LIMIT 1', [h.code]);
    let hsnId;
    if (!existing) {
      const res = await conn.query(
        `INSERT INTO product_hsn_codes (uuid, code, description, gst_rate_id, status, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, 1, NOW(), NOW())`,
        [crypto.randomUUID(), h.code, h.desc, gstRateId]
      );
      hsnId = res.insertId;
      console.log(`✓ Created HSN Code: ${h.code} -> ${h.gstKey}`);
    } else {
      hsnId = existing.id;
      await conn.query('UPDATE product_hsn_codes SET description = ?, gst_rate_id = ? WHERE id = ?', [h.desc, gstRateId, hsnId]);
      console.log(`✓ Updated HSN Code: ${h.code} -> ${h.gstKey}`);
    }
    hsnMap.set(h.code, hsnId);
  }

  // 3. Assign HSN Codes to all 50 Products based on Category / Slug
  console.log('\n--- Linking HSN Codes to Products ---');
  const products = await conn.query(`
    SELECT p.id, p.name, p.slug, c.slug as cat_slug 
    FROM products p 
    JOIN product_categories c ON p.category_id = c.id
  `);

  let updatedProducts = 0;
  for (const p of products) {
    let targetHsnCode = '0904'; // default spices
    const cs = p.cat_slug;
    const ps = p.slug;

    if (cs === 'spices-whole-spices') {
      if (ps.includes('cardamom')) targetHsnCode = '0908';
      else if (ps.includes('clove')) targetHsnCode = '0907';
      else targetHsnCode = '0904';
    } else if (cs === 'traditional-heritage-rice') {
      targetHsnCode = '1006';
    } else if (cs === 'pure-mountain-honey-bee-products') {
      targetHsnCode = '0409';
    } else if (cs === 'native-millets-ancient-grains') {
      targetHsnCode = '1008';
    } else if (cs === 'cold-pressed-wood-churned-oils') {
      if (ps.includes('sesame')) targetHsnCode = '1515';
      else if (ps.includes('groundnut')) targetHsnCode = '1508';
      else targetHsnCode = '1513';
    } else if (cs === 'hill-herbal-teas-infusions') {
      targetHsnCode = '0902';
    } else if (cs === 'herbal-health-wellness-powders') {
      targetHsnCode = '0910';
    } else if (cs === 'pepper-cardamom-reserves') {
      if (ps.includes('cardamom')) targetHsnCode = '0908';
      else targetHsnCode = '0904';
    } else if (cs === 'wild-forest-herbs-roots') {
      targetHsnCode = '0910';
    } else if (cs === 'traditional-masalas-spice-mixes') {
      targetHsnCode = '2103';
    } else if (cs === 'organic-palm-jaggery-sweeteners') {
      targetHsnCode = '1701';
    } else if (cs === 'kolli-hill-pure-ghee-dairy') {
      targetHsnCode = '0405';
    } else if (cs === 'traditional-pickles-thokku') {
      targetHsnCode = '2001';
    } else if (cs === 'dry-fruits-forest-nuts') {
      targetHsnCode = '0801';
    } else if (cs === 'natural-immunity-health-elixirs') {
      targetHsnCode = '3004';
    } else if (cs === 'kolli-fruit-preserves-jams') {
      targetHsnCode = '2007';
    } else if (cs === 'heritage-seed-native-pulses') {
      targetHsnCode = '1209';
    } else if (cs === 'forest-essential-oils-aromatics') {
      targetHsnCode = '3301';
    } else if (cs === 'herbal-bath-natural-skin-care') {
      targetHsnCode = '3307';
    } else if (cs === 'traditional-clay-stone-cookware') {
      targetHsnCode = '6912';
    }

    const hsnId = hsnMap.get(targetHsnCode) || hsnMap.get('0904');
    await conn.query('UPDATE products SET hsn_code_id = ? WHERE id = ?', [hsnId, p.id]);
    updatedProducts++;
  }
  console.log(`✓ Successfully updated HSN codes for all ${updatedProducts} products.`);

  // 4. Seed 20%, 30%, 18% Offers
  console.log('\n--- Seeding 20%, 30%, 18% Offers ---');

  // Clear existing offers
  await conn.query('DELETE FROM offer_items');
  await conn.query('DELETE FROM offer_products');
  await conn.query('DELETE FROM offers');

  const offersToCreate = [
    {
      name: 'Mountain Spices Special - 30% OFF',
      code: 'SPICES30',
      value: 30.0,
      priority: 10,
      terms: 'Flat 30% off on handpicked Kolli Hills Black Pepper, Green Cardamom, Cloves, and Pepper Reserves.',
      catSlugs: ['spices-whole-spices', 'pepper-cardamom-reserves'],
    },
    {
      name: 'Harvest Festival Discount - 20% OFF',
      code: 'HARVEST20',
      value: 20.0,
      priority: 8,
      terms: 'Enjoy 20% off on indigenous Heritage Rice varieties, pure mountain forest Honey, and Palm Jaggery.',
      catSlugs: ['traditional-heritage-rice', 'pure-mountain-honey-bee-products', 'organic-palm-jaggery-sweeteners'],
    },
    {
      name: 'Heritage Wellness & Immunity - 18% OFF',
      code: 'WELLNESS18',
      value: 18.0,
      priority: 6,
      terms: 'Flat 18% off on high-curcumin Turmeric, Moringa, Amla, Kabasura Kudineer, and Forest Roots.',
      catSlugs: ['herbal-health-wellness-powders', 'natural-immunity-health-elixirs', 'wild-forest-herbs-roots'],
    },
  ];

  for (const off of offersToCreate) {
    const offerUuid = crypto.randomUUID();
    const [adminUser] = await conn.query("SELECT id FROM users WHERE status = 'active' LIMIT 1");
    const adminId = adminUser ? adminUser.id : 1n;

    const offerRes = await conn.query(
      `INSERT INTO offers 
        (uuid, name, code, level, type, value, priority, terms, starts_at, ends_at, is_active, created_by, updated_by, created_at, updated_at)
       VALUES (?, ?, ?, 'product', 'percentage', ?, ?, ?, '2026-01-01 00:00:00', '2027-12-31 23:59:59', 1, ?, ?, NOW(), NOW())`,
      [offerUuid, off.name, off.code, off.value, off.priority, off.terms, adminId, adminId]
    );
    const offerId = offerRes.insertId;

    // Find products matching categories
    const placeholders = off.catSlugs.map(() => '?').join(',');
    const matchingProducts = await conn.query(
      `SELECT p.id, p.name 
       FROM products p 
       JOIN product_categories c ON p.category_id = c.id 
       WHERE c.slug IN (${placeholders})`,
      off.catSlugs
    );

    for (const prod of matchingProducts) {
      await conn.query(
        `INSERT INTO offer_products (uuid, offer_id, product_id, is_active, created_by, updated_by, created_at, updated_at)
         VALUES (?, ?, ?, 1, ?, ?, NOW(), NOW())`,
        [crypto.randomUUID(), offerId, prod.id, adminId, adminId]
      );
    }

    console.log(`✓ Seeded Offer: "${off.name}" (${off.value}% OFF, Code: ${off.code}) -> Attached to ${matchingProducts.length} products`);
  }

  console.log('\n======================================================');
  console.log('🎉 HSN, GST Rates & Offers Successfully Configured!');
  console.log('======================================================\n');

  await conn.end();
}

run().catch((err) => {
  console.error('❌ Error seeding HSN and Offers:', err);
  process.exit(1);
});
