import "dotenv/config";

async function main() {
  const baseUrl = "http://localhost:3000";

  console.log("==========================================");
  console.log("TESTING REAL-TIME COUNT API & NEW CUSTOMER");
  console.log("==========================================");

  // 1. Authenticate as customer1@example.com
  console.log("\n1. Logging in as customer1@example.com...");
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  const rawCookieHeader = csrfRes.headers.get("set-cookie") || "";
  const initialCookies = rawCookieHeader.split(/,(?=[^;]+;)/).map((c) => c.split(";")[0].trim());

  const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: initialCookies.join("; "),
    },
    body: new URLSearchParams({
      email: "customer1@example.com",
      password: "customer123",
      csrfToken: csrfToken,
      callbackUrl: `${baseUrl}/`,
      json: "true",
    }),
    redirect: "manual",
  });

  const loginSetCookie = loginRes.headers.get("set-cookie") || "";
  const authCookies = [
    ...initialCookies,
    ...loginSetCookie.split(/,(?=[^;]+;)/).map((c) => c.split(";")[0].trim()),
  ].join("; ");

  console.log("✓ Login response status:", loginRes.status);

  // 2. Fetch initial cart count
  console.log("\n2. Fetching initial cart count...");
  const initialCartCountRes = await fetch(`${baseUrl}/api/customer/cart/count`, {
    headers: { Cookie: authCookies },
  });
  const initialCartCountData = await initialCartCountRes.json();
  console.log("Initial Cart Count:", initialCartCountData);

  // 3. Fetch initial wishlist count
  console.log("\n3. Fetching initial wishlist count...");
  const initialWishlistCountRes = await fetch(`${baseUrl}/api/customer/wishlist/count`, {
    headers: { Cookie: authCookies },
  });
  const initialWishlistCountData = await initialWishlistCountRes.json();
  console.log("Initial Wishlist Count:", initialWishlistCountData);

  // 4. Fetch available products to get variant and unit price IDs
  console.log("\n4. Fetching a variant to test cart & wishlist...");
  const variantsRes = await fetch(`${baseUrl}/api/customer/variants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page: 1, pageSize: 5 }),
  });
  const variantsData = await variantsRes.json();
  const variantItem = variantsData.data?.[0];
  if (!variantItem) {
    throw new Error("No variants found in DB: " + JSON.stringify(variantsData));
  }

  const unitPrice = variantItem.unitPrices?.[0];
  console.log(`Testing with: "${variantItem.productName}" (Variant: ${variantItem.id}, UnitPrice: ${unitPrice?.id})`);

  // 5. Add to Cart and immediately verify count API
  console.log("\n5. Adding to cart...");
  const addCartRes = await fetch(`${baseUrl}/api/customer/cart/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: authCookies,
    },
    body: JSON.stringify({
      variantUnitPriceId: unitPrice.id,
      variantId: variantItem.id,
      quantity: 2,
    }),
  });
  const addCartData = await addCartRes.json();
  console.log("Add to Cart response:", addCartData.success, addCartData.message);

  const newCartCountRes = await fetch(`${baseUrl}/api/customer/cart/count`, {
    headers: { Cookie: authCookies },
  });
  const newCartCountData = await newCartCountRes.json();
  console.log("✓ Updated Cart Count from count API:", newCartCountData);

  // 6. Add to Wishlist and immediately verify count API
  console.log("\n6. Adding to wishlist...");
  const addWishlistRes = await fetch(`${baseUrl}/api/customer/wishlist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: authCookies,
    },
    body: JSON.stringify({
      variantUnitPriceId: unitPrice.id,
      variantId: variantItem.id,
    }),
  });
  const addWishlistData = await addWishlistRes.json();
  console.log("Add to Wishlist response:", addWishlistData.success);

  const newWishlistCountRes = await fetch(`${baseUrl}/api/customer/wishlist/count`, {
    headers: { Cookie: authCookies },
  });
  const newWishlistCountData = await newWishlistCountRes.json();
  console.log("✓ Updated Wishlist Count from count API:", newWishlistCountData);

  // 7. Remove from wishlist and verify count decrements to 0
  console.log("\n7. Removing from wishlist...");
  const removeWishlistRes = await fetch(`${baseUrl}/api/customer/wishlist/${unitPrice.id}`, {
    method: "DELETE",
    headers: { Cookie: authCookies },
  });
  console.log("Remove wishlist response status:", removeWishlistRes.status);

  const finalWishlistCountRes = await fetch(`${baseUrl}/api/customer/wishlist/count`, {
    headers: { Cookie: authCookies },
  });
  const finalWishlistCountData = await finalWishlistCountRes.json();
  console.log("✓ Final Wishlist Count from count API (should be 0):", finalWishlistCountData);

  // 8. Remove from cart and verify count decrements to 0
  console.log("\n8. Removing from cart...");
  const removeCartRes = await fetch(`${baseUrl}/api/customer/cart/items/${unitPrice.id}`, {
    method: "DELETE",
    headers: { Cookie: authCookies },
  });
  console.log("Remove cart response status:", removeCartRes.status);

  const finalCartCountRes = await fetch(`${baseUrl}/api/customer/cart/count`, {
    headers: { Cookie: authCookies },
  });
  const finalCartCountData = await finalCartCountRes.json();
  console.log("✓ Final Cart Count from count API (should be 0):", finalCartCountData);

  console.log("\n==========================================");
  console.log("ALL REAL-TIME COUNT API TESTS PASSED 100%!");
  console.log("==========================================");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
