---
name: customer-agent
description: Comprehensive development standards and guidelines for the Customer Module in Rithu Snacks, covering strict isolation rules, TanStack Query integration, dirty-field payload optimization, responsive design, shimmer loading, and custom UI components.
---

# Customer Module Development Guide & Agent Skill

This skill defines the complete set of architectural rules, UX guidelines, API patterns, design principles, and full API endpoint specifications required when developing or maintaining features in the **Customer Module** of Rithu Snacks.

---

## 1. Strict Isolation & Boundary Rules

1. **Customer Module Scope & Exclusive `/api/customer/*` Routing:**
   - All customer-facing code belongs exclusively in `src/features/customers/`, customer account pages (e.g., `src/app/(customer)/`, `/profile`), store pages (`src/app/(store)/`), and customer API routes (`/api/customer/*`).
   - **MANDATORY RULE:** Storefront and Customer features must **ONLY** call endpoints under `/api/customer/*` (e.g. `/api/customer/cart/*`, `/api/customer/orders/*`, `/api/customer/wishlist/*`, `/api/customer/profile/*`).
   - The Customer module has its own dedicated cart (`/api/customer/cart/*`) and order system. **NEVER** use `/api/cart/*`, `/api/orders/*`, or `/api/admin/*` in customer modules or storefront flows.
   - **NEVER** modify Admin modules (`src/app/admin/`, `src/features/brands/`, `src/features/inventory/`, `src/features/roles/`, etc.) during customer tasks.
2. **Shared Components & Types Caution:**
   - If a component, utility, or schema is shared between Admin and Customer, ensure any modifications are backward-compatible and do not alter Admin layouts, state, or data flows.
3. **Backend Schema & Validation Integrity:**
   - Backend validation files (e.g., Zod schemas in `validations/`) and database types are canonical. Do not change them without explicit user permission.
   - If an API field is missing, incomplete, or pending on the backend, **notify the user directly** rather than altering backend contracts or hardcoding mock fallbacks.
4. **No Hardcoded Data Fallbacks:**
   - If the backend returns `null`, `undefined`, or empty data for optional fields, **hide the UI element gracefully**. Do not display hardcoded or placeholder text.

---

## 2. API & Data Fetching Standards

1. **TanStack React Query for All APIs:**
   - Structure customer API communication into dedicated modules:
     - `src/features/customers/api/*.api.ts` (Axios / fetch client methods)
     - `src/features/customers/hooks/use-*.ts` (React Query hooks: `useQuery`, `useMutation`, `useQueryClient`)
   - Always invalidate relevant query keys upon successful mutations (e.g., `queryClient.invalidateQueries({ queryKey: CUSTOMER_CART_QUERY_KEY })`).
2. **Order Filtering & POST List API Standards:**
   - Both `POST /api/customer/orders` and `POST /api/customer/orders/list` support flexible filter arrays and single status strings for testing in Postman and in-app:
     - Single status: `{ "status": "packed" }`
     - Status arrays: `{ "status": ["packed", "out_for_delivery", "pending", "confirmed"] }` or `{ "statuses": [...] }`
     - Friendly aliases: `"out of delivery"` $\rightarrow$ `"out_for_delivery"`, `"order placed"` $\rightarrow$ `["pending", "confirmed"]`
     - Nested filters object: `{ "filters": { "status": ["packed", "shipped"] } }`
     - Merged query parameters: `POST /api/customer/orders/list?page=1&limit=20` merges query string and body filters seamlessly.
3. **Send Only Dirty / Modified Fields on Edit (Delta Payloads):**
   - When updating existing records (e.g., addresses, profile details), **never send the entire object**.
   - Track initial form state or use a `dirtyFields` `Set` to compare current inputs with initial values.
   - Dispatch only modified keys in `PUT` / `PATCH` requests (e.g., sending only `{ "pincode": "637001" }` if only PIN code changed).
   - If no fields were modified, close the form gracefully without firing unnecessary network requests.
4. **Double-Hit Prevention & Active Loading States:**
   - Always track mutation loading status (`mutation.isPending`).
   - Disable submit buttons, cancel buttons, and form inputs while a request is in flight.
   - Display an animated spinner and dynamic button text (`"Updating..."` / `"Saving..."`) to give immediate visual feedback.
   - Disable card action buttons (e.g., "Set as Default", "Delete") while mutations are processing.
5. **Exact Zod Schema Validation & Live Error Display:**
   - Validate form inputs client-side using canonical Zod schemas (`create*Schema.safeParse()`, `update*Schema.safeParse()`).
   - Render specific, live inline error messages directly beneath the corresponding input fields (`fieldErrors[fieldName]`).
   - Catch and render server/API error messages in a prominent error banner.

---

## 3. Responsive Layout & Styling Principles

1. **No Fixed / Constant Dimensions:**
   - Avoid fixed pixel widths (`w-[500px]`) and fixed heights (`h-[300px]`) on layout containers.
   - Use fluid flexbox and CSS grid layouts: `flex`, `flex-col`, `grid`, `w-full`, `min-w-0`, `max-w-*`, `gap-*`.
2. **Mobile (<768px), Tablet (768px–1024px), Desktop (>1024px) Responsiveness:**
   - **Navigation:** Use swipeable/scrollable horizontal pill navigation (`overflow-x-auto`, `scrollbar-hide`) on mobile devices, transitioning to a sticky sidebar on tablet/desktop.
   - **Form Fields:** Stack inputs in single-column (`grid-cols-1`) on mobile, expanding to multi-column (`sm:grid-cols-2`) on larger viewports.
   - **Card Grids:** Use responsive column counts: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.
   - **Touch Targets:** Ensure interactive elements (buttons, inputs, toggles) have a minimum height of `min-h-[44px]` for mobile tap accessibility.
3. **Themed Semantic Tokens:**
   - Use semantic design tokens matching the project palette (`bg-theme-surface`, `bg-theme-primary`, `text-theme-text-primary`, `border-theme-border`, `accent-theme-primary`).
   - Avoid hardcoded raw HEX/RGB values for background, text, and border styles.

---

## 4. UI Components & Shimmer Loading

1. **Shimmer / Skeleton Pulse Loading:**
   - Never show blank screens or unstyled text loaders while waiting for data.
   - Implement animated skeleton pulse loaders (`animate-pulse`) mirroring the actual card/list layout:
     ```tsx
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       {[1, 2].map((n) => (
         <div key={n} className="bg-theme-surface border border-theme-border rounded-xl p-5 animate-pulse space-y-3">
           <div className="h-5 bg-theme-border rounded w-1/3" />
           <div className="h-10 bg-theme-border-subtle rounded w-full" />
           <div className="h-4 bg-theme-border-subtle rounded w-1/2" />
         </div>
       ))}
     </div>
     ```
2. **Custom Reusable Dropdown Component:**
   - Avoid raw browser `<select>` elements. Use `<CustomDropdown>` (`src/features/customers/components/account/CustomDropdown.tsx`).
   - Keep options clean with text-only labels or optional icons.
   - **Prevent Dropdown Clipping:** Never put `overflow-hidden` on parent card containers containing dropdowns; ensure popovers have `z-50 shadow-xl`.
3. **Custom Segmented Toggles & Checkboxes:**
   - Use custom-themed toggle pills (e.g., Shipping vs. Billing) and customized accent checkboxes for options like "Set as default delivery address" and "Receive order updates on WhatsApp".
4. **4-Breakpoint Order Lifecycle Stepper (Placed to Final Resolution):**
   - Standardize all order tracking visual steppers into 4 clean breakpoints reflecting the business handover:
     1. **Placed** (`pending`, `confirmed`) — *Handled by Admin*
     2. **Packed** (`processing`, `packed`) — *Handled by Admin & assigned to staff*
     3. **Out for Delivery** (`shipped`, `out_for_delivery`) — *Handled by Delivery Staff*
     4. **Delivered / Returned / Cancelled** (`delivered`, `returned`, `cancelled`) — *Final resolution step*
   - The 4th step dynamically renders:
     - **Delivered** (Role: `Staff`, green indicator, "Delivered successfully")
     - **Returned** (Role: `Store`, purple indicator, "Returned & Refunded")
     - **Cancelled** (Role: `Order`, red indicator, "Order Cancelled")
     - During transit, defaults to **Delivered** (Role: `Staff`, "Expected soon").

---

## 5. Summary Checklist Before Completing Any Customer Task

- [ ] Changes restricted strictly to Customer Module (`src/features/customers/`).
- [ ] No Admin UI, routes, or components modified or broken.
- [ ] TanStack React Query hooks used for data fetching and caching.
- [ ] Edit operations send **only dirty/modified fields** (delta payload).
- [ ] Submit buttons disabled with loading spinner during in-flight requests.
- [ ] Shimmer pulse loading displayed during data fetching.
- [ ] Layouts fluid with flex/grid (no hardcoded fixed width/height).
- [ ] Fully responsive on Mobile (<768px), Tablet (768px-1024px), and Desktop (>1024px).
- [ ] Parent containers do not clip dropdowns (`overflow-hidden` removed where popovers render).
- [ ] Zero TypeScript type errors (`npx tsc --noEmit` verified).

---

## 6. Complete Customer API Reference (Canonical Specifications)

### 6.1 Customer Profile
| Method | Endpoint | Description | Request Body / Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/customer/profile` | Get logged-in customer profile | — |
| `PUT` | `/api/customer/profile` | Update profile details *(dirty fields only)* | `{ name?, dob?, gender?, isWhatsapp?, whatsappNo? }` |
| `POST` | `/api/customer/profile/image` | Upload profile avatar | `multipart/form-data` (`file`) |
| `DELETE` | `/api/customer/profile/image` | Remove profile avatar | — |

### 6.2 Customer Addresses
| Method | Endpoint | Description | Request Body / Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/customer/addresses?addressType=shipping` | List active addresses | Query: `addressType` (`shipping` \| `billing`) |
| `POST` | `/api/customer/addresses` | Create new address | `{ label?, fullName, phone, addressLine1, addressLine2?, landmark?, city, state, pincode, country, addressType, isDefault }` |
| `POST` | `/api/customer/addresses/list` | Paginated address list | `{ page, pageSize, addressType? }` |
| `GET` | `/api/customer/addresses/:uuid` | Get single address by ID/UUID | — |
| `PUT` | `/api/customer/addresses/:uuid` | Update address *(delta payload)* | `{ label?, fullName?, phone?, addressLine1?, addressLine2?, landmark?, city?, state?, pincode?, country?, addressType?, isDefault? }` |
| `DELETE` | `/api/customer/addresses/:uuid` | Delete customer address | — |

### 6.3 Customer Wishlist
| Method | Endpoint | Description | Request Body / Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/customer/wishlist` | Get all wishlist items | — |
| `GET` | `/api/customer/wishlist/count` | Get total wishlist count | — |
| `POST` | `/api/customer/wishlist` | Add product variant to wishlist | `{ variantId: string }` |
| `DELETE` | `/api/customer/wishlist/:variantUuid` | Remove item from wishlist | — |
| `POST` | `/api/customer/wishlist/:variantUuid/move-to-cart` | Move item directly to cart | — |

### 6.4 Customer Cart
| Method | Endpoint | Description | Request Body / Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/customer/cart` | Get customer cart items & totals | — |
| `GET` | `/api/customer/cart/count` | Get cart item count | — |
| `POST` | `/api/customer/cart/items` | Add variant to cart | `{ variantId: string, quantity: number }` |
| `PUT` | `/api/customer/cart/items/:variantUuid` | Update item quantity | `{ quantity: number }` |
| `DELETE` | `/api/customer/cart/items/:variantUuid` | Remove variant from cart | — |
| `DELETE` | `/api/customer/cart` | Clear entire cart | — |

### 6.5 Customer Orders, Returns & Reviews
| Method | Endpoint | Description | Request Body / Parameters |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/customer/orders` | Place new order | `{ shippingAddressId, billingAddressId, notes? }` |
| `GET` | `/api/customer/orders` | Get recent customer orders | — |
| `POST` | `/api/customer/orders/list` | Paginated & filtered orders | `{ page, limit, status?, sortBy?, sortOrder? }` |
| `GET` | `/api/customer/orders/:orderUuid` | Get order detail & tracking | — |
| `POST` | `/api/customer/orders/:orderUuid/cancel` | Cancel order | `{ note?: string }` |
| `POST` | `/api/customer/returns` | Create return request | `{ orderId, reason, items: [{ orderItemId, quantity, reason }] }` |
| `POST` | `/api/customer/returns/list` | List my return requests | `{ page, limit, status?, sortBy?, sortOrder? }` |
| `GET` | `/api/customer/returns/:returnId` | Get return request status | — |
| `POST` | `/api/customer/reviews` | Submit product review | `{ variantId, orderItemId, rating, title?, comment?, images? }` |
| `POST` | `/api/customer/reviews/list` | List my reviews | `{ page, limit, rating?, search?, sortBy?, sortOrder? }` |
| `GET` | `/api/customer/reviews/:reviewId` | Get review details | — |
| `PUT` | `/api/customer/reviews/:reviewId` | Update review | `{ rating?, title?, comment?, images? }` |
| `DELETE` | `/api/customer/reviews/:reviewId` | Delete review | — |

### 6.6 Customer Catalog & Browsing
| Method | Endpoint | Description | Request Body / Parameters |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/customer/products` | Browse products | `{ page, pageSize, search?, brandIds?, categoryIds?, sortBy?, sortOrder? }` |
| `POST` | `/api/customer/products/:productUuid/variants` | List product variants | `{ page, pageSize, search?, minPrice?, maxPrice?, sortBy?, sortOrder? }` |
| `GET` | `/api/customer/products/:productUuid/variants/:variantUuid` | Get variant details | — |
| `POST` | `/api/customer/variants` | Variant catalog filter | `{ page, pageSize, search?, productIds?, brandIds?, categoryIds?, minPrice?, maxPrice?, sortBy?, sortOrder? }` |
| `POST` | `/api/customer/brands` | List brands | `{ page, pageSize, search?, sortBy?, sortOrder? }` |
| `GET` | `/api/customer/brands/:uuid` | Get single brand | — |
| `POST` | `/api/customer/categories` | List categories | `{ page, pageSize, search?, sortBy?, sortOrder? }` |
| `GET` | `/api/customer/categories/:uuid` | Get single category | — |
| `GET` | `/api/customer/banners?position=home-hero` | Get promotional banners | Query: `position` (e.g. `home-hero`) |
| `GET` | `/api/product-variants/:variantId/reviews` | Reviews for variant | Query: `page`, `limit` |
| `GET` | `/api/products/:productId/reviews` | Reviews for product | Query: `page`, `limit` |

### 6.7 Customer Auth & Support
| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/send-email-otp` | Send email OTP for registration | `{ email }` |
| `POST` | `/api/auth/resend-register-otp` | Resend registration OTP | `{ email }` |
| `POST` | `/api/auth/verify-email-otp` | Verify registration OTP | `{ email, otp }` |
| `POST` | `/api/auth/register` | Complete customer registration | `{ name, email, phone, password, emailVerificationToken }` |
| `POST` | `/api/auth/login` | Customer password login | `{ email, password }` |
| `POST` | `/api/auth/forgot-password` | Send forgot password OTP | `{ email }` |
| `POST` | `/api/auth/verify-otp` | Verify forgot password OTP | `{ email, otp }` |
| `POST` | `/api/auth/reset-password` | Set new password | `{ email, resetToken, password, confirmPassword }` |
| `POST` | `/api/auth/refresh` | Refresh access token | `{ refreshToken }` |
| `POST` | `/api/auth/logout` | Customer session logout | `{}` |
| `POST` | `/api/contact` | Submit contact form | `{ name, email, phone, subject, message }` |
