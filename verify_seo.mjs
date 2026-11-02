import fs from "fs";

function testFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.log(`[${label}] File does not exist: ${filePath}`);
    return;
  }
  const html = fs.readFileSync(filePath, "utf8");
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  const ogTitle = html.match(/<meta property="og:title" content="([^"]*)"/)?.[1];
  const ogImage = html.match(/<meta property="og:image" content="([^"]*)"/)?.[1];
  const jsonLd = (html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g) || []).map(s => {
    try {
      const jsonStr = s.replace(/<script[^>]*>/, "").replace(/<\/script>/, "");
      return JSON.parse(jsonStr);
    } catch {
      return "INVALID_JSON";
    }
  });

  console.log(`\n=== [${label}] ===`);
  console.log("Title:       ", title);
  console.log("Description: ", desc);
  console.log("Canonical:   ", canonical);
  console.log("OG Title:    ", ogTitle);
  console.log("OG Image:    ", ogImage);
  console.log("JSON-LD Schemas:", jsonLd.map(j => j?.["@type"] || j));
}

testFile(".next/server/app/index.html", "Home Page (/)");
testFile(".next/server/app/products.html", "Shop All (/products)");
testFile(".next/server/app/about.html", "About Us (/about)");
testFile(".next/server/app/contact.html", "Contact Us (/contact)");
testFile(".next/server/app/bulk-order.html", "Bulk Order (/bulk-order)");
testFile(".next/server/app/faqs.html", "FAQs (/faqs)");
testFile(".next/server/app/privacy-policy.html", "Privacy Policy (/privacy-policy)");

